<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { computed } from 'vue';
import ChessBoard from '@/components/chess/ChessBoard.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { armies } from '@/lib/armies';
import type { PieceColor } from '@/lib/armies';
import { play } from '@/routes';

type Player = {
    name: string;
    username: string;
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
</script>

<template>
    <Head :title="`${game.white.username} vs ${game.black.username}`" />

    <div
        class="mx-auto grid w-full max-w-6xl gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
        <div class="mx-auto flex w-full max-w-[min(100%,36rem)] flex-col gap-3">
            <div class="flex items-center justify-between text-sm">
                <span class="font-medium">
                    {{ player(opponentColor).name }}
                    <span class="text-muted-foreground">
                        @{{ player(opponentColor).username }}
                    </span>
                </span>
                <span class="text-muted-foreground">
                    {{ armies[opponentColor].name }}
                </span>
            </div>

            <ChessBoard
                :fen="game.fen"
                :orientation="orientation"
                :last-move="game.last_move"
            />

            <div class="flex items-center justify-between text-sm">
                <span class="font-medium">
                    {{ player(orientation).name }}
                    <span class="text-muted-foreground">
                        @{{ player(orientation).username }}
                    </span>
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
