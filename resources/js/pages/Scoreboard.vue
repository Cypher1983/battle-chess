<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { Trophy } from '@lucide/vue';
import ScoreboardTable from '@/components/chess/ScoreboardTable.vue';
import ScoreboardTabs from '@/components/chess/ScoreboardTabs.vue';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { scoreboard } from '@/routes';
import type { RankedPlayers, Standing } from '@/types/scoreboard';

defineProps<{
    players: RankedPlayers;
    me: Standing & { rank: number | null };
}>();

defineOptions({
    layout: {
        breadcrumbs: [{ title: 'Scoreboard', href: scoreboard() }],
    },
});
</script>

<template>
    <Head title="Scoreboard" />

    <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
        <ScoreboardTabs current="players" />

        <Card>
            <CardHeader>
                <CardTitle>Your standing</CardTitle>
                <CardDescription v-if="me.rank === null">
                    Finish your first battle to enter the rankings.
                </CardDescription>
            </CardHeader>
            <CardContent
                class="grid grid-cols-2 gap-4 sm:grid-cols-4"
                data-test="my-standing"
            >
                <div>
                    <p class="text-xs text-muted-foreground">Rank</p>
                    <p class="text-2xl font-semibold">
                        {{ me.rank === null ? '—' : `#${me.rank}` }}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-muted-foreground">Rating</p>
                    <p class="text-2xl font-semibold">{{ me.rating }}</p>
                </div>
                <div>
                    <p class="text-xs text-muted-foreground">W / L / D</p>
                    <p class="text-2xl font-semibold">
                        {{ me.wins }} / {{ me.losses }} / {{ me.draws }}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-muted-foreground">Battles</p>
                    <p class="text-2xl font-semibold">{{ me.games }}</p>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <Trophy class="size-5" />
                    Rankings
                </CardTitle>
                <CardDescription>
                    Elo ratings. Everyone starts at 1200; beating stronger
                    opponents earns more.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScoreboardTable :players="players" />
            </CardContent>
        </Card>
    </div>
</template>
