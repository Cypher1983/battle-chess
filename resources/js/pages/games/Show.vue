<script setup lang="ts">
import { Head, router, useForm, usePage, usePoll } from '@inertiajs/vue3';
import { RotateCcw } from '@lucide/vue';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { computed, onMounted, ref, watch } from 'vue';
import GameMoveController from '@/actions/App/Http/Controllers/GameMoveController';
import RematchController from '@/actions/App/Http/Controllers/RematchController';
import ArmyPickerDialog from '@/components/chess/ArmyPickerDialog.vue';
import Board3D from '@/components/chess/Board3D.vue';
import ChessBoard from '@/components/chess/ChessBoard.vue';
import GameControls from '@/components/chess/GameControls.vue';
import PromotionPicker from '@/components/chess/PromotionPicker.vue';
import BattleOverlay from '@/components/chess/BattleOverlay.vue';
import RatingTag from '@/components/chess/RatingTag.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBattleScenes } from '@/composables/useBattleScenes';
import { useBoardView } from '@/composables/useBoardView';
import { useGraphicsQuality } from '@/composables/useGraphicsQuality';
import { useSoundEffects } from '@/composables/useSoundEffects';
import { useIsLive, usePresence } from '@/composables/useRealtime';
import type { Fighter } from '@/lib/battle/playBattle';
import {
    playCheckSound,
    playGameOverSound,
    playImpactSound,
    playMoveSound,
} from '@/lib/sounds';
import { armies } from '@/lib/armies';
import type { ArmyId, GameArmies, PieceColor, PieceType } from '@/lib/armies';
import type { BoardThemeId } from '@/lib/boardThemes';
import { play } from '@/routes';

type Player = {
    name: string;
    username: string;
    rating: number;
    rating_change: number | null;
};

type GameData = {
    id: number;
    fen: string;
    turn: PieceColor;
    armies: GameArmies;
    board_theme: BoardThemeId;
    status: 'active' | 'finished';
    result: '1-0' | '0-1' | '1/2-1/2' | null;
    end_reason: string | null;
    white: Player;
    black: Player;
    moves: { ply: number; san: string }[];
    last_move: {
        ply: number;
        from: string;
        to: string;
        color: PieceColor;
        piece: PieceType | null;
        captured: PieceType | null;
    } | null;
    move_deadline: string | null;
    draw_offered_by: PieceColor | null;
};

const props = defineProps<{
    game: GameData;
    myColor: PieceColor | null;
}>();

defineOptions({
    layout: {
        breadcrumbs: [{ title: 'Play', href: play() }],
    },
});

const orientation = computed<PieceColor>(() => props.myColor ?? 'w');
const opponentColor = computed<PieceColor>(() =>
    orientation.value === 'w' ? 'b' : 'w',
);

const movePairs = computed(() => {
    const pairs: { number: number; white: string; black: string | null }[] = [];

    props.game.moves.forEach((move, index) => {
        if (index % 2 === 0) {
            pairs.push({ number: index / 2 + 1, white: move.san, black: null });
        } else {
            pairs[pairs.length - 1].black = move.san;
        }
    });

    return pairs;
});

const statusText = computed(() => {
    const { game } = props;

    if (game.status === 'finished') {
        if (game.result === '1/2-1/2') {
            return `Draw · ${game.end_reason}`;
        }

        const winner = game.result === '1-0' ? 'w' : 'b';

        return `${armies[game.armies[winner]].name} wins · ${game.end_reason}`;
    }

    if (props.myColor === null) {
        return `${armies[game.armies[game.turn]].name} to move`;
    }

    return game.turn === props.myColor ? 'Your move' : "Opponent's move";
});

function player(color: PieceColor): Player {
    return color === 'w' ? props.game.white : props.game.black;
}

// --- Board view (2D or 3D) -------------------------------------------------

const { preferred: boardView, view, supports3d } = useBoardView();
const failed3d = ref(false);
const graphics = useGraphicsQuality();

// The server renders the 2D board; the browser switches to 3D once mounted.
const mounted = ref(false);
onMounted(() => (mounted.value = true));

const show3d = computed(
    () => mounted.value && view.value === '3d' && !failed3d.value,
);

const board3d = computed({
    get: () => boardView.value === '3d',
    set: (on: boolean) => {
        boardView.value = on ? '3d' : '2d';
        failed3d.value = false;
    },
});

// --- Moving -------------------------------------------------------------

const page = usePage();
const moveError = computed(() => page.props.errors?.move as string | undefined);

// --- Battle scenes ---------------------------------------------------------

const battleScenes = useBattleScenes();
const battle = ref<{
    ply: number;
    from: string;
    to: string;
    attacker: Fighter;
    defender: Fighter;
} | null>(null);

// Only captures that arrive while the page is open play a battle,
// not the capture that happened to be the last move on page load.
let lastSeenPly = props.game.last_move?.ply ?? 0;

watch(
    () => props.game.last_move,
    (move) => {
        if (!move || move.ply <= lastSeenPly) {
            return;
        }

        lastSeenPly = move.ply;

        if (battleScenes.value && move.piece && move.captured) {
            // The impact sound plays when the battle's blow lands.
            battle.value = {
                ply: move.ply,
                from: move.from,
                to: move.to,
                attacker: {
                    army: props.game.armies[move.color],
                    color: move.color,
                    type: move.piece,
                },
                defender: {
                    army: props.game.armies[move.color === 'w' ? 'b' : 'w'],
                    color: move.color === 'w' ? 'b' : 'w',
                    type: move.captured,
                },
            };
        } else if (move.captured) {
            sound(playImpactSound);
        } else {
            sound(playMoveSound);
        }

        if (new Chess(props.game.fen).inCheck()) {
            sound(playCheckSound);
        }
    },
);

// --- Sound ----------------------------------------------------------------

const soundEffects = useSoundEffects();

function sound(play: () => void): void {
    if (soundEffects.value) {
        play();
    }
}

watch(
    () => props.game.status,
    (status, previous) => {
        if (previous !== 'active' || status !== 'finished') {
            return;
        }

        if (props.game.result === '1/2-1/2' || props.myColor === null) {
            sound(() => playGameOverSound('draw'));
        } else {
            const won =
                (props.game.result === '1-0') === (props.myColor === 'w');
            sound(() => playGameOverSound(won ? 'win' : 'loss'));
        }
    },
);

const position = computed(() => new Chess(props.game.fen));
const canMove = computed(
    () =>
        props.game.status === 'active' &&
        props.myColor !== null &&
        props.game.turn === props.myColor,
);

const selected = ref<Square | null>(null);
const pendingPromotion = ref<{ from: Square; to: Square } | null>(null);
const submitting = ref(false);

const movesFromSelected = computed(() =>
    selected.value
        ? position.value.moves({ square: selected.value, verbose: true })
        : [],
);
const targets = computed(() => [
    ...new Set(movesFromSelected.value.map((move) => move.to)),
]);

function onSquareClick(square: Square): void {
    if (!canMove.value || submitting.value) {
        return;
    }

    if (selected.value && targets.value.includes(square)) {
        const isPromotion = movesFromSelected.value.some(
            (move) => move.to === square && move.promotion,
        );

        if (isPromotion) {
            pendingPromotion.value = { from: selected.value, to: square };
        } else {
            submitMove(selected.value, square);
        }

        return;
    }

    const piece = position.value.get(square);

    selected.value =
        piece && piece.color === props.myColor && square !== selected.value
            ? square
            : null;
}

function choosePromotion(piece: PieceType): void {
    if (pendingPromotion.value) {
        submitMove(
            pendingPromotion.value.from,
            pendingPromotion.value.to,
            piece,
        );
    }

    pendingPromotion.value = null;
}

function submitMove(from: Square, to: Square, promotion?: PieceType): void {
    submitting.value = true;

    router.post(
        GameMoveController.store(props.game.id).url,
        { from, to, promotion: promotion ?? null },
        {
            preserveScroll: true,
            onFinish: () => {
                submitting.value = false;
                selected.value = null;
            },
        },
    );
}

// --- Live updates ---------------------------------------------------------

// The broadcast only says "this game changed"; the page then reloads the
// game from the server, which stays the single source of truth.
const presence = usePresence(`games.${props.game.id}`, '.game.updated', () => {
    router.reload({ only: ['game'] });
});

const isLive = useIsLive();

// --- Who is watching -----------------------------------------------------

type Member = { id: number; username: string; color: PieceColor };

const onlineColors = ref(new Set<PieceColor>());

presence
    ?.channel()
    .here((members: Member[]) => {
        onlineColors.value = new Set(members.map((member) => member.color));
    })
    .joining((member: Member) => {
        onlineColors.value = new Set([...onlineColors.value, member.color]);
    })
    .leaving((member: Member) => {
        const next = new Set(onlineColors.value);
        next.delete(member.color);
        onlineColors.value = next;
    });

const showPresence = computed(() => presence !== null && isLive.value);
const opponentOnline = computed(() =>
    onlineColors.value.has(opponentColor.value),
);

// Fall back to polling while waiting for the opponent if the WebSocket
// is not connected (for example when Reverb is not running).
const needsPolling = computed(
    () =>
        !isLive.value &&
        props.game.status === 'active' &&
        props.myColor !== null &&
        props.game.turn !== props.myColor,
);

const { start: startPolling, stop: stopPolling } = usePoll(
    3000,
    { only: ['game'] },
    { autoStart: false },
);

watch(needsPolling, (poll) => (poll ? startPolling() : stopPolling()), {
    immediate: true,
});

watch(
    () => props.game.fen,
    () => {
        selected.value = null;
        pendingPromotion.value = null;
    },
);

const rematch = useForm<{ army: ArmyId | null }>({ army: null });
const pickingRematchArmy = ref(false);

function askForRematch(army: ArmyId): void {
    rematch.army = army;
    rematch.post(RematchController.store.url(props.game.id), {
        preserveScroll: true,
        onSuccess: () => (pickingRematchArmy.value = false),
    });
}
</script>

<template>
    <Head :title="`${game.white.username} vs ${game.black.username}`" />

    <div
        class="mx-auto grid w-full max-w-6xl gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
        <!-- As wide as fits, and never taller than the window. -->
        <div
            class="mx-auto flex w-full max-w-[min(100%,calc(100dvh_-_10.5rem))] flex-col gap-3"
        >
            <div class="flex items-center justify-between text-sm">
                <span class="font-medium">
                    <span
                        v-if="showPresence"
                        class="mr-1 inline-block size-2 rounded-full"
                        :class="opponentOnline ? 'bg-green-500' : 'bg-gray-400'"
                        :title="opponentOnline ? 'Online' : 'Offline'"
                        data-test="opponent-presence"
                    />
                    {{ player(opponentColor).name }}
                    <span class="text-muted-foreground">
                        @{{ player(opponentColor).username }}
                    </span>
                    <RatingTag
                        :rating="player(opponentColor).rating"
                        :change="player(opponentColor).rating_change"
                    />
                </span>
                <span class="text-muted-foreground">
                    {{ armies[game.armies[opponentColor]].name }}
                </span>
            </div>

            <div class="relative">
                <Board3D
                    v-if="show3d"
                    :key="`${graphics}:${game.armies.w}:${game.armies.b}:${game.board_theme}`"
                    :quality="graphics"
                    :fen="game.fen"
                    :orientation="orientation"
                    :armies="game.armies"
                    :board-theme="game.board_theme"
                    :last-move="game.last_move"
                    :selected="selected"
                    :targets="targets"
                    :battle="battle"
                    @square-click="onSquareClick"
                    @failed="failed3d = true"
                    @battle-impact="sound(playImpactSound)"
                    @battle-done="battle = null"
                />
                <ChessBoard
                    v-else
                    :fen="game.fen"
                    :orientation="orientation"
                    :armies="game.armies"
                    :board-theme="game.board_theme"
                    :last-move="game.last_move"
                    :selected="selected"
                    :targets="targets"
                    :class="canMove && 'cursor-pointer'"
                    @square-click="onSquareClick"
                />
                <PromotionPicker
                    v-if="pendingPromotion && myColor"
                    :army="game.armies[myColor]"
                    @choose="choosePromotion"
                    @cancel="pendingPromotion = null"
                />
                <BattleOverlay
                    v-if="battle && !show3d"
                    :key="battle.ply"
                    :attacker="battle.attacker"
                    :defender="battle.defender"
                    @impact="sound(playImpactSound)"
                    @done="battle = null"
                />
            </div>

            <div class="flex items-center justify-between text-sm">
                <span class="font-medium">
                    {{ player(orientation).name }}
                    <span class="text-muted-foreground">
                        @{{ player(orientation).username }}
                    </span>
                    <RatingTag
                        :rating="player(orientation).rating"
                        :change="player(orientation).rating_change"
                    />
                </span>
                <span class="text-muted-foreground">
                    {{ armies[game.armies[orientation]].name }}
                </span>
            </div>
        </div>

        <div class="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle data-test="game-status">
                        {{ statusText }}
                    </CardTitle>
                </CardHeader>
                <CardContent v-if="moveError">
                    <p class="text-sm text-red-600" data-test="move-error">
                        {{ moveError }}
                    </p>
                </CardContent>
                <CardContent>
                    <label
                        class="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                    >
                        <input
                            v-model="battleScenes"
                            type="checkbox"
                            class="size-4 accent-primary"
                            data-test="battle-scenes-toggle"
                        />
                        Play battle scenes on captures
                    </label>
                    <label
                        class="mt-2 flex items-center gap-2 text-sm text-muted-foreground"
                        :class="supports3d ? 'cursor-pointer' : 'opacity-60'"
                        :title="
                            supports3d
                                ? undefined
                                : 'Your browser cannot show the 3D board (no WebGL)'
                        "
                    >
                        <input
                            v-model="board3d"
                            type="checkbox"
                            class="size-4 accent-primary"
                            :disabled="!supports3d"
                            data-test="board-3d-toggle"
                        />
                        3D board
                    </label>
                    <label
                        v-if="show3d"
                        class="mt-2 flex items-center gap-2 text-sm text-muted-foreground"
                    >
                        Graphics
                        <select
                            v-model="graphics"
                            class="rounded border border-input bg-background px-1 py-0.5 text-sm text-foreground"
                            data-test="graphics-quality"
                        >
                            <option value="auto">Auto</option>
                            <option value="low">Low</option>
                            <option value="high">High</option>
                            <option value="ultra">Ultra (4K)</option>
                        </select>
                    </label>
                    <label
                        class="mt-2 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                    >
                        <input
                            v-model="soundEffects"
                            type="checkbox"
                            class="size-4 accent-primary"
                            data-test="sound-toggle"
                        />
                        Sound effects
                    </label>
                </CardContent>
            </Card>

            <GameControls
                v-if="game.status === 'active' && myColor"
                :game-id="game.id"
                :my-color="myColor"
                :turn="game.turn"
                :move-deadline="game.move_deadline"
                :draw-offered-by="game.draw_offered_by"
            />

            <Card v-if="game.status === 'finished' && myColor">
                <CardContent>
                    <Button
                        class="w-full"
                        data-test="rematch-button"
                        @click="pickingRematchArmy = true"
                    >
                        <RotateCcw />
                        Rematch
                    </Button>

                    <ArmyPickerDialog
                        v-model:open="pickingRematchArmy"
                        title="Choose your army"
                        :description="`The army you lead in the rematch against ${opponentColor === 'w' ? game.white.name : game.black.name}. They pick theirs when they accept.`"
                        :initial="game.armies[myColor]"
                        confirm-label="Challenge"
                        :processing="rematch.processing"
                        :error="rematch.errors.army"
                        @confirm="askForRematch"
                    />
                </CardContent>
            </Card>

            <Card class="min-h-0 flex-1">
                <CardHeader>
                    <CardTitle class="text-base">Moves</CardTitle>
                </CardHeader>
                <CardContent>
                    <p
                        v-if="movePairs.length === 0"
                        class="text-sm text-muted-foreground"
                    >
                        No moves yet. The {{ armies[game.armies.w].name }} moves
                        first, with the white pieces.
                    </p>
                    <div
                        v-else
                        class="grid max-h-80 grid-cols-[2rem_1fr_1fr] gap-x-2 gap-y-1 overflow-y-auto font-mono text-sm"
                        data-test="move-list"
                    >
                        <template v-for="pair in movePairs" :key="pair.number">
                            <span class="text-muted-foreground">
                                {{ pair.number }}.
                            </span>
                            <span>{{ pair.white }}</span>
                            <span>{{ pair.black ?? '' }}</span>
                        </template>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>
