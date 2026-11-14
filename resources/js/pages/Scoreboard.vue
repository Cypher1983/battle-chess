<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { Crown, Trophy } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { scoreboard } from '@/routes';

type Standing = {
    name: string;
    username: string;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
    games: number;
};

type RankedPlayer = Standing & {
    rank: number;
    is_me: boolean;
};

defineProps<{
    players: {
        data: RankedPlayer[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
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
                <p
                    v-if="players.data.length === 0"
                    class="text-sm text-muted-foreground"
                >
                    No battles have been decided yet.
                </p>

                <div v-else class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr
                                class="border-b text-left text-xs text-muted-foreground"
                            >
                                <th class="py-2 pr-2 font-medium">#</th>
                                <th class="py-2 pr-2 font-medium">Player</th>
                                <th class="py-2 pr-2 text-right font-medium">
                                    Rating
                                </th>
                                <th
                                    class="hidden py-2 pr-2 text-right font-medium sm:table-cell"
                                >
                                    W / L / D
                                </th>
                                <th class="py-2 text-right font-medium">
                                    Battles
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="player in players.data"
                                :key="player.username"
                                class="border-b last:border-0"
                                :class="
                                    player.is_me && 'bg-primary/5 font-medium'
                                "
                                data-test="scoreboard-row"
                            >
                                <td class="py-2 pr-2 tabular-nums">
                                    <Crown
                                        v-if="player.rank === 1"
                                        class="inline size-4 text-amber-500"
                                        aria-label="First place"
                                    />
                                    <span v-else>{{ player.rank }}</span>
                                </td>
                                <td class="max-w-0 truncate py-2 pr-2">
                                    {{ player.name }}
                                    <span class="text-muted-foreground">
                                        @{{ player.username }}
                                    </span>
                                    <span
                                        v-if="player.is_me"
                                        class="text-xs text-muted-foreground"
                                    >
                                        (you)
                                    </span>
                                </td>
                                <td
                                    class="py-2 pr-2 text-right font-semibold tabular-nums"
                                >
                                    {{ player.rating }}
                                </td>
                                <td
                                    class="hidden py-2 pr-2 text-right tabular-nums sm:table-cell"
                                >
                                    {{ player.wins }} / {{ player.losses }} /
                                    {{ player.draws }}
                                </td>
                                <td class="py-2 text-right tabular-nums">
                                    {{ player.games }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div
                    v-if="players.last_page > 1"
                    class="mt-4 flex items-center justify-between text-sm"
                >
                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="!players.prev_page_url"
                        as-child
                    >
                        <Link
                            :href="players.prev_page_url ?? ''"
                            :disabled="!players.prev_page_url"
                            preserve-scroll
                        >
                            Previous
                        </Link>
                    </Button>
                    <span class="text-muted-foreground">
                        Page {{ players.current_page }} of
                        {{ players.last_page }}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="!players.next_page_url"
                        as-child
                    >
                        <Link
                            :href="players.next_page_url ?? ''"
                            :disabled="!players.next_page_url"
                            preserve-scroll
                        >
                            Next
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
