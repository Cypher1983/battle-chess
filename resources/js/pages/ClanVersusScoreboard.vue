<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { Swords } from '@lucide/vue';
import ScoreboardTabs from '@/components/chess/ScoreboardTabs.vue';
import ClanEmblem from '@/components/ClanEmblem.vue';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { scoreboard } from '@/routes';
import { clans as clansRoute } from '@/routes/scoreboard';
import { versus } from '@/routes/scoreboard/clans';
import type { ClanSummary } from '@/types';

/** Finished games between two clans, told from the first clan's side. */
type Matchup = {
    clan: ClanSummary;
    opponent: ClanSummary;
    games: number;
    wins: number;
    losses: number;
    draws: number;
    is_mine: boolean;
};

defineProps<{
    matchups: {
        data: Matchup[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
}>();

defineOptions({
    layout: {
        breadcrumbs: [
            { title: 'Scoreboard', href: scoreboard() },
            { title: 'Clans', href: clansRoute() },
            { title: 'Clan vs clan', href: versus() },
        ],
    },
});

/** Chess points: a win is worth 1 and a draw ½. */
function points(wins: number, draws: number): string {
    const whole = wins + Math.floor(draws / 2);

    if (draws % 2 === 0) {
        return String(whole);
    }

    return whole === 0 ? '½' : `${whole}½`;
}
</script>

<template>
    <Head title="Clan vs clan" />

    <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
        <ScoreboardTabs current="versus" />

        <Card>
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <Swords class="size-5" />
                    Clan vs clan
                </CardTitle>
                <CardDescription>
                    Head-to-head scores from finished battles between members of
                    two clans. A win scores 1 and a draw ½. Only signed-in
                    players can see this.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p
                    v-if="matchups.data.length === 0"
                    class="text-sm text-muted-foreground"
                >
                    No two clans have met in battle yet.
                </p>

                <div v-else class="overflow-x-auto">
                    <table class="w-full text-sm whitespace-nowrap">
                        <thead>
                            <tr
                                class="border-b text-left text-xs text-muted-foreground"
                            >
                                <th class="py-2 pr-2 font-medium">Matchup</th>
                                <th class="py-2 pr-2 text-right font-medium">
                                    Score
                                </th>
                                <th
                                    class="hidden py-2 pr-2 text-right font-medium sm:table-cell"
                                >
                                    W / L / D
                                </th>
                                <th class="py-2 text-right font-medium">
                                    Games
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="matchup in matchups.data"
                                :key="`${matchup.clan.id}-${matchup.opponent.id}`"
                                class="border-b last:border-0"
                                :class="
                                    matchup.is_mine &&
                                    'bg-primary/5 font-medium'
                                "
                                data-test="clan-versus-row"
                            >
                                <td class="w-full max-w-0 py-2 pr-2">
                                    <span class="flex flex-col gap-1">
                                        <span
                                            v-for="(side, index) in [
                                                matchup.clan,
                                                matchup.opponent,
                                            ]"
                                            :key="side.id"
                                            class="flex items-center gap-2"
                                        >
                                            <span
                                                class="w-4 shrink-0 text-xs text-muted-foreground"
                                            >
                                                {{ index === 1 ? 'vs' : '' }}
                                            </span>
                                            <ClanEmblem
                                                class="size-5 shrink-0"
                                                :emblem="side.emblem"
                                            />
                                            <span class="truncate">
                                                {{ side.name }}
                                                <span
                                                    class="text-muted-foreground"
                                                >
                                                    [{{ side.tag }}]
                                                </span>
                                            </span>
                                        </span>
                                    </span>
                                </td>
                                <td
                                    class="py-2 pr-2 text-right font-semibold tabular-nums"
                                    data-test="clan-versus-score"
                                >
                                    {{ points(matchup.wins, matchup.draws) }}
                                    –
                                    {{ points(matchup.losses, matchup.draws) }}
                                </td>
                                <td
                                    class="hidden py-2 pr-2 text-right tabular-nums sm:table-cell"
                                >
                                    {{ matchup.wins }} / {{ matchup.losses }} /
                                    {{ matchup.draws }}
                                </td>
                                <td class="py-2 text-right tabular-nums">
                                    {{ matchup.games }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div
                    v-if="matchups.last_page > 1"
                    class="mt-4 flex items-center justify-between text-sm"
                >
                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="!matchups.prev_page_url"
                        as-child
                    >
                        <Link
                            :href="matchups.prev_page_url ?? ''"
                            :disabled="!matchups.prev_page_url"
                            preserve-scroll
                        >
                            Previous
                        </Link>
                    </Button>
                    <span class="text-muted-foreground">
                        Page {{ matchups.current_page }} of
                        {{ matchups.last_page }}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="!matchups.next_page_url"
                        as-child
                    >
                        <Link
                            :href="matchups.next_page_url ?? ''"
                            :disabled="!matchups.next_page_url"
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
