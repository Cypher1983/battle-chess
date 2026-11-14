<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { Swords } from '@lucide/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { armies } from '@/lib/armies';
import type { ArmyId, PieceColor } from '@/lib/armies';
import { invites, play } from '@/routes';
import { show } from '@/routes/games';

type Opponent = {
    name: string;
    username: string;
};

type ActiveGame = {
    id: number;
    my_color: PieceColor;
    my_army: ArmyId;
    opponent: Opponent;
    your_turn: boolean;
    move_count: number;
};

type FinishedGame = {
    id: number;
    my_color: PieceColor;
    my_army: ArmyId;
    opponent: Opponent;
    outcome: 'win' | 'loss' | 'draw';
    end_reason: string | null;
    finished_at: string | null;
};

defineProps<{
    active: ActiveGame[];
    finished: FinishedGame[];
}>();

defineOptions({
    layout: {
        breadcrumbs: [{ title: 'Play', href: play() }],
    },
});

const outcomeLabels: Record<FinishedGame['outcome'], string> = {
    win: 'Victory',
    loss: 'Defeat',
    draw: 'Draw',
};
</script>

<template>
    <Head title="Play" />

    <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
        <Card>
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <Swords class="size-5" />
                    Your battles
                </CardTitle>
                <CardDescription>
                    Games in progress. Battles waiting on your move are listed
                    first.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    v-if="active.length === 0"
                    class="flex flex-col items-start gap-3 text-sm text-muted-foreground"
                >
                    <p>No battles in progress. Challenge someone to begin.</p>
                    <Button size="sm" as-child>
                        <Link :href="invites()">Send a challenge</Link>
                    </Button>
                </div>
                <ul v-else class="divide-y">
                    <li
                        v-for="game in active"
                        :key="game.id"
                        data-test="active-game"
                    >
                        <Link
                            :href="show(game.id)"
                            class="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                        >
                            <div class="min-w-0">
                                <p class="truncate font-medium">
                                    vs {{ game.opponent.name }}
                                    <span class="text-muted-foreground">
                                        @{{ game.opponent.username }}
                                    </span>
                                </p>
                                <p class="text-xs text-muted-foreground">
                                    You command the
                                    {{ armies[game.my_army].name }} ·
                                    {{ game.move_count }} moves
                                </p>
                            </div>
                            <Badge v-if="game.your_turn">Your move</Badge>
                            <Badge v-else variant="secondary">Waiting</Badge>
                        </Link>
                    </li>
                </ul>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Recent results</CardTitle>
            </CardHeader>
            <CardContent>
                <p
                    v-if="finished.length === 0"
                    class="text-sm text-muted-foreground"
                >
                    No finished battles yet.
                </p>
                <ul v-else class="divide-y">
                    <li
                        v-for="game in finished"
                        :key="game.id"
                        data-test="finished-game"
                    >
                        <Link
                            :href="show(game.id)"
                            class="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                        >
                            <div class="min-w-0">
                                <p class="truncate font-medium">
                                    vs {{ game.opponent.name }}
                                    <span class="text-muted-foreground">
                                        @{{ game.opponent.username }}
                                    </span>
                                </p>
                                <p class="text-xs text-muted-foreground">
                                    {{ game.end_reason }} ·
                                    {{ game.finished_at }}
                                </p>
                            </div>
                            <Badge
                                :variant="
                                    game.outcome === 'win'
                                        ? 'default'
                                        : game.outcome === 'loss'
                                          ? 'destructive'
                                          : 'secondary'
                                "
                            >
                                {{ outcomeLabels[game.outcome] }}
                            </Badge>
                        </Link>
                    </li>
                </ul>
            </CardContent>
        </Card>
    </div>
</template>
