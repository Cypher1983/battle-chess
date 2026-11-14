<script setup lang="ts">
import { Head, router, usePage, usePoll } from '@inertiajs/vue3';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { computed, ref, watch } from 'vue';
import GameMoveController from '@/actions/App/Http/Controllers/GameMoveController';
import ChessBoard from '@/components/chess/ChessBoard.vue';
import GameControls from '@/components/chess/GameControls.vue';
import PromotionPicker from '@/components/chess/PromotionPicker.vue';
import RatingTag from '@/components/chess/RatingTag.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsLive, usePresence } from '@/composables/useRealtime';
import { armies } from '@/lib/armies';
import type { PieceColor, PieceType } from '@/lib/armies';
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
    status: 'active' | 'finished';
    result: '1-0' | '0-1' | '1/2-1/2' | null;
    end_reason: string | null;
    white: Player;
    black: Player;
    moves: { ply: number; san: string }[];
    last_move: { from: string; to: string } | null;
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

        return `${armies[winner].name} wins · ${game.end_reason}`;
    }

    if (props.myColor === null) {
        return `${armies[game.turn].name} to move`;
    }

    return game.turn === props.myColor ? 'Your move' : "Opponent's move";
});

function player(color: PieceColor): Player {
    return color === 'w' ? props.game.white : props.game.black;
}

// --- Moving -------------------------------------------------------------

const page = usePage();
const moveError = computed(() => page.props.errors?.move as string | undefined);

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
</script>

<template>
    <Head :title="`${game.white.username} vs ${game.black.username}`" />

    <div
        class="mx-auto grid w-full max-w-6xl gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
        <div class="mx-auto flex w-full max-w-[min(100%,36rem)] flex-col gap-3">
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
                    {{ armies[opponentColor].name }}
                </span>
            </div>

            <div class="relative">
                <ChessBoard
                    :fen="game.fen"
                    :orientation="orientation"
                    :last-move="game.last_move"
                    :selected="selected"
                    :targets="targets"
                    :class="canMove && 'cursor-pointer'"
                    @square-click="onSquareClick"
                />
                <PromotionPicker
                    v-if="pendingPromotion && myColor"
                    :color="myColor"
                    @choose="choosePromotion"
                    @cancel="pendingPromotion = null"
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
                    {{ armies[orientation].name }}
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
            </Card>

            <GameControls
                v-if="game.status === 'active' && myColor"
                :game-id="game.id"
                :my-color="myColor"
                :draw-offered-by="game.draw_offered_by"
            />

            <Card class="min-h-0 flex-1">
                <CardHeader>
                    <CardTitle class="text-base">Moves</CardTitle>
                </CardHeader>
                <CardContent>
                    <p
                        v-if="movePairs.length === 0"
                        class="text-sm text-muted-foreground"
                    >
                        No moves yet. The Clockwork Legion moves first.
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
