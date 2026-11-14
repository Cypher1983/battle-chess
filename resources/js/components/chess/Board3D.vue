<script setup lang="ts">
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from 'vue';
import { pieceLabel } from '@/lib/armies';
import { CLASSIC_ARMIES } from '@/lib/armies';
import type { GameArmies, PieceColor } from '@/lib/armies';
import type { BoardView } from '@/lib/board3d/BoardView';
import type { QualityChoice } from '@/lib/board3d/quality';

type Props = {
    fen: string;
    orientation: PieceColor;
    /** Which army plays each colour. */
    armies?: GameArmies;
    lastMove?: { from: string; to: string } | null;
    selected?: string | null;
    targets?: string[];
    /** Graphics level, read once: re-mount the board to change it. */
    quality?: QualityChoice;
    /** A capture to fight out when the position changes to `fen`. */
    battle?: { ply: number; from: string; to: string } | null;
};

const props = withDefaults(defineProps<Props>(), {
    armies: () => CLASSIC_ARMIES,
    lastMove: null,
    selected: null,
    targets: () => [],
    battle: null,
    quality: 'auto',
});

const emit = defineEmits<{
    squareClick: [square: Square];
    /** The 3D board could not start (e.g. WebGL failed); show 2D instead. */
    failed: [];
    /** A battle's blow lands (e.g. to play the impact sound). */
    battleImpact: [];
    /** A battle is over (or was skipped). */
    battleDone: [];
}>();

const host = ref<HTMLDivElement | null>(null);
const ready = ref(false);
let view: BoardView | null = null;
let unmounted = false;

/** The square with keyboard focus, framed on the 3D board. */
const focused = ref<Square | null>(null);

onMounted(async () => {
    try {
        // three.js is only downloaded when the 3D board is shown.
        const { BoardView, BATTLE_IMPACT_AT } =
            await import('@/lib/board3d/BoardView');
        impactAt = BATTLE_IMPACT_AT;

        if (unmounted || !host.value) {
            return;
        }

        view = new BoardView(host.value, {
            orientation: props.orientation,
            quality: props.quality,
            armies: props.armies,
            onSquareClick: (square) => emit('squareClick', square),
        });
        view.setPosition(props.fen);
        view.setHighlights(highlights());
        ready.value = true;
    } catch (error) {
        console.error('3D board failed', error);
        emit('failed');
    } finally {
        // A battle that arrived before the board was ready can't be shown.
        if (props.battle && !view) {
            emit('battleImpact');
            emit('battleDone');
        }
    }
});

onBeforeUnmount(() => {
    unmounted = true;
    battleController?.abort();
    view?.dispose();
    view = null;
});

// --- Battles ---------------------------------------------------------------

let impactAt = 0;
let lastBattlePly = props.battle?.ply ?? 0;
let battleController: AbortController | null = null;
const battling = ref(false);

watch(
    () => props.fen,
    (fen) => {
        const battle = props.battle;

        if (!view) {
            return;
        }

        if (battle && battle.ply !== lastBattlePly) {
            lastBattlePly = battle.ply;
            fight(view, fen, battle);
        } else {
            view.setPosition(fen);
        }
    },
);

function fight(
    board: BoardView,
    fen: string,
    battle: { from: string; to: string },
): void {
    const controller = new AbortController();
    battleController = controller;
    battling.value = true;
    let impacted = false;

    const impact = (): void => {
        if (!impacted) {
            impacted = true;
            emit('battleImpact');
        }
    };

    board
        .playBattle(
            fen,
            { from: battle.from as Square, to: battle.to as Square },
            {
                signal: controller.signal,
                onProgress: (elapsed) => elapsed >= impactAt && impact(),
            },
        )
        .catch((error) => console.error('Battle scene failed', error))
        .finally(() => {
            // Skipped or failed battles still deliver the impact.
            impact();

            if (battleController === controller) {
                battleController = null;
                battling.value = false;
            }

            emit('battleDone');
        });
}

function skipBattle(): void {
    battleController?.abort();
}

function highlights() {
    return {
        lastMove: props.lastMove
            ? { from: props.lastMove.from, to: props.lastMove.to }
            : null,
        selected: props.selected,
        targets: props.targets,
        focused: focused.value,
    };
}

watch(highlights, (marks) => view?.setHighlights(marks));

// --- Keyboard and screen reader access ---------------------------------
//
// The canvas can't be tabbed to, so a hidden grid of buttons mirrors the
// board in the player's orientation. It is one tab stop; arrow keys move
// between squares, Enter or Space clicks, and the 3D board frames the
// focused square.

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const cursor = ref<Square>(props.orientation === 'w' ? 'e2' : 'e7');
const grid = ref<HTMLDivElement | null>(null);

const cells = computed(() => {
    const chess = new Chess(props.fen);
    const files = props.orientation === 'w' ? FILES : [...FILES].reverse();
    const ranks = props.orientation === 'w' ? RANKS : [...RANKS].reverse();

    return ranks.flatMap((rank) =>
        files.map((file) => {
            const square = `${file}${rank}` as Square;
            const piece = chess.get(square);

            return {
                square,
                label: piece
                    ? `${square}: ${pieceLabel(props.armies[piece.color], piece.type)}`
                    : square,
            };
        }),
    );
});

function onKeydown(event: KeyboardEvent, index: number): void {
    const moves: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
    };
    const move = moves[event.key];

    if (!move) {
        return;
    }

    event.preventDefault();
    const row = Math.min(Math.max(Math.floor(index / 8) + move[0], 0), 7);
    const col = Math.min(Math.max((index % 8) + move[1], 0), 7);
    const square = cells.value[row * 8 + col].square;
    cursor.value = square;
    nextTick(() =>
        grid.value
            ?.querySelector<HTMLButtonElement>(`[data-square-3d="${square}"]`)
            ?.focus(),
    );
}

watch(
    () => props.orientation,
    (orientation) => view?.setOrientation(orientation),
);
</script>

<template>
    <div
        class="relative aspect-square w-full select-none"
        data-test="chess-board-3d"
    >
        <div ref="host" class="absolute inset-0 touch-none" />
        <button
            v-if="ready"
            type="button"
            class="absolute top-2 right-2 z-10 rounded bg-black/40 px-2 py-0.5 text-xs text-white hover:bg-black/60"
            title="Scroll or pinch to zoom"
            data-test="reset-camera"
            @click="view?.resetCamera()"
        >
            Reset view
        </button>
        <div
            ref="grid"
            class="sr-only"
            role="group"
            aria-label="Chessboard squares"
        >
            <button
                v-for="(cell, index) in cells"
                :key="cell.square"
                type="button"
                :tabindex="cell.square === cursor ? 0 : -1"
                :aria-label="cell.label"
                :aria-pressed="cell.square === selected"
                :data-square-3d="cell.square"
                @focus="
                    focused = cell.square;
                    cursor = cell.square;
                "
                @blur="focused = null"
                @keydown="onKeydown($event, index)"
                @click="emit('squareClick', cell.square)"
            >
                {{ cell.label }}
            </button>
        </div>
        <div
            v-if="battling"
            class="absolute inset-0 z-20 cursor-pointer"
            role="button"
            tabindex="0"
            aria-label="Capture battle. Click to skip."
            data-test="battle-overlay-3d"
            @click="skipBattle"
            @keydown.enter.space.prevent="skipBattle"
        >
            <span
                class="pointer-events-none absolute right-2 bottom-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white"
            >
                Click to skip
            </span>
        </div>
        <div
            v-if="!ready"
            class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
        >
            Loading 3D board…
        </div>
    </div>
</template>
