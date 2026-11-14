<script setup lang="ts">
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { computed } from 'vue';
import { pieceImage, pieceLabel } from '@/lib/armies';
import type { GameArmies, PieceColor } from '@/lib/armies';

type Props = {
    fen: string;
    orientation: PieceColor;
    /** Which army plays each colour. */
    armies: GameArmies;
    lastMove?: { from: string; to: string } | null;
    selected?: string | null;
    targets?: string[];
};

const props = withDefaults(defineProps<Props>(), {
    lastMove: null,
    selected: null,
    targets: () => [],
});

const emit = defineEmits<{
    squareClick: [square: Square];
}>();

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const position = computed(() => new Chess(props.fen));

const checkedKing = computed<string | null>(() => {
    const chess = position.value;

    if (!chess.inCheck()) {
        return null;
    }

    const turn = chess.turn();

    for (const row of chess.board()) {
        for (const piece of row) {
            if (piece && piece.type === 'k' && piece.color === turn) {
                return piece.square;
            }
        }
    }

    return null;
});

const squares = computed(() => {
    const files = props.orientation === 'w' ? FILES : [...FILES].reverse();
    const ranks = props.orientation === 'w' ? RANKS : [...RANKS].reverse();

    return ranks.flatMap((rank, row) =>
        files.map((file, col) => {
            const square = `${file}${rank}` as Square;
            const piece = position.value.get(square) ?? null;

            return {
                square,
                piece,
                isLight: (FILES.indexOf(file) + Number(rank)) % 2 === 1,
                showRank: col === 0 ? rank : null,
                showFile: row === 7 ? file : null,
            };
        }),
    );
});

function isHighlighted(square: string): boolean {
    return (
        square === props.lastMove?.from ||
        square === props.lastMove?.to ||
        square === props.selected
    );
}
</script>

<template>
    <div
        class="grid aspect-square w-full grid-cols-8 overflow-hidden rounded-lg border-4 border-[#5b4632] shadow-lg select-none"
        data-test="chess-board"
    >
        <button
            v-for="cell in squares"
            :key="cell.square"
            type="button"
            class="relative flex items-center justify-center"
            :class="[
                cell.isLight ? 'bg-[#eadfc8]' : 'bg-[#9c7b54]',
                isHighlighted(cell.square) &&
                    'after:absolute after:inset-0 after:bg-yellow-300/45',
                checkedKing === cell.square && 'bg-red-500!',
            ]"
            :data-square="cell.square"
            :aria-label="
                cell.piece
                    ? `${cell.square}: ${pieceLabel(armies[cell.piece.color], cell.piece.type)}`
                    : cell.square
            "
            @click="emit('squareClick', cell.square)"
        >
            <span
                v-if="cell.showRank"
                class="absolute top-0.5 left-1 text-[10px] font-semibold opacity-70"
                :class="cell.isLight ? 'text-[#9c7b54]' : 'text-[#eadfc8]'"
            >
                {{ cell.showRank }}
            </span>
            <span
                v-if="cell.showFile"
                class="absolute right-1 bottom-0.5 text-[10px] font-semibold opacity-70"
                :class="cell.isLight ? 'text-[#9c7b54]' : 'text-[#eadfc8]'"
            >
                {{ cell.showFile }}
            </span>

            <!-- Any army can play either side: the base disc shows which. -->
            <span
                v-if="cell.piece"
                class="pointer-events-none absolute bottom-[6%] h-[16%] w-[70%] rounded-[50%] border-2"
                :class="
                    cell.piece.color === 'w'
                        ? 'border-stone-700/50 bg-[#f6efdf]'
                        : 'border-stone-200/40 bg-[#16161c]'
                "
                :data-side="cell.piece.color"
            />
            <img
                v-if="cell.piece"
                :src="pieceImage(armies[cell.piece.color], cell.piece.type)"
                :alt="pieceLabel(armies[cell.piece.color], cell.piece.type)"
                :title="pieceLabel(armies[cell.piece.color], cell.piece.type)"
                class="pointer-events-none relative z-10 size-[88%] drop-shadow"
                draggable="false"
                :data-piece="`${cell.piece.color}${cell.piece.type}`"
            />

            <span
                v-if="targets.includes(cell.square)"
                class="absolute z-20 rounded-full"
                :class="
                    cell.piece
                        ? 'inset-1 border-4 border-black/30'
                        : 'size-1/3 bg-black/25'
                "
            />
        </button>
    </div>
</template>
