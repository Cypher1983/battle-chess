<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { Flag } from '@lucide/vue';
import RankBadge from '@/components/chess/RankBadge.vue';
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
import type { ClanSummary } from '@/types';

type RankedClan = ClanSummary & {
    rank: number;
    members: number;
    /** The average rating of members who have finished a battle. */
    rating: number;
    wins: number;
    losses: number;
    draws: number;
    is_mine: boolean;
};

defineProps<{
    clans: {
        data: RankedClan[];
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
        ],
    },
});
</script>

<template>
    <Head title="Clan rankings" />

    <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
        <ScoreboardTabs current="clans" />

        <Card>
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <Flag class="size-5" />
                    Clan rankings
                </CardTitle>
                <CardDescription>
                    Ranked by the average rating of members who have finished a
                    battle. Only signed-in players can see this.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p
                    v-if="clans.data.length === 0"
                    class="text-sm text-muted-foreground"
                >
                    No clan has fought a battle yet.
                </p>

                <div v-else class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr
                                class="border-b text-left text-xs text-muted-foreground"
                            >
                                <th class="py-2 pr-2 font-medium">#</th>
                                <th class="py-2 pr-2 font-medium">Clan</th>
                                <th class="py-2 pr-2 text-right font-medium">
                                    Avg rating
                                </th>
                                <th
                                    class="hidden py-2 pr-2 text-right font-medium sm:table-cell"
                                >
                                    W / L / D
                                </th>
                                <th class="py-2 text-right font-medium">
                                    Members
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="clan in clans.data"
                                :key="clan.id"
                                class="border-b last:border-0"
                                :class="
                                    clan.is_mine && 'bg-primary/5 font-medium'
                                "
                                data-test="clan-scoreboard-row"
                            >
                                <td class="py-2 pr-2 tabular-nums">
                                    <RankBadge :rank="clan.rank" />
                                </td>
                                <td class="max-w-0 py-2 pr-2">
                                    <span class="flex items-center gap-2">
                                        <ClanEmblem
                                            class="size-6"
                                            :emblem="clan.emblem"
                                        />
                                        <span class="truncate">
                                            {{ clan.name }}
                                            <span class="text-muted-foreground">
                                                [{{ clan.tag }}]
                                            </span>
                                        </span>
                                        <span
                                            v-if="clan.is_mine"
                                            class="text-xs text-muted-foreground"
                                        >
                                            (yours)
                                        </span>
                                    </span>
                                </td>
                                <td
                                    class="py-2 pr-2 text-right font-semibold tabular-nums"
                                >
                                    {{ clan.rating }}
                                </td>
                                <td
                                    class="hidden py-2 pr-2 text-right tabular-nums sm:table-cell"
                                >
                                    {{ clan.wins }} / {{ clan.losses }} /
                                    {{ clan.draws }}
                                </td>
                                <td class="py-2 text-right tabular-nums">
                                    {{ clan.members }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div
                    v-if="clans.last_page > 1"
                    class="mt-4 flex items-center justify-between text-sm"
                >
                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="!clans.prev_page_url"
                        as-child
                    >
                        <Link
                            :href="clans.prev_page_url ?? ''"
                            :disabled="!clans.prev_page_url"
                            preserve-scroll
                        >
                            Previous
                        </Link>
                    </Button>
                    <span class="text-muted-foreground">
                        Page {{ clans.current_page }} of {{ clans.last_page }}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="!clans.next_page_url"
                        as-child
                    >
                        <Link
                            :href="clans.next_page_url ?? ''"
                            :disabled="!clans.next_page_url"
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
