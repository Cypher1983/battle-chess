<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { Crown } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import type { RankedPlayers } from '@/types/scoreboard';

withDefaults(
    defineProps<{
        players: RankedPlayers;
        /** Guests see usernames only. */
        showNames?: boolean;
    }>(),
    { showNames: true },
);

/** Gold, silver and bronze badges for the top three places. */
const medals: Record<number, { label: string; class: string }> = {
    1: {
        label: 'First place',
        class: 'bg-amber-400/20 text-amber-600 ring-amber-400/60 dark:text-amber-300',
    },
    2: {
        label: 'Second place',
        class: 'bg-slate-300/25 text-slate-600 ring-slate-400/60 dark:text-slate-200',
    },
    3: {
        label: 'Third place',
        class: 'bg-orange-700/15 text-orange-800 ring-orange-700/50 dark:text-orange-300',
    },
};
</script>

<template>
    <p v-if="players.data.length === 0" class="text-sm text-muted-foreground">
        No battles have been decided yet.
    </p>

    <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b text-left text-xs text-muted-foreground">
                    <th class="py-2 pr-2 font-medium">#</th>
                    <th class="py-2 pr-2 font-medium">Player</th>
                    <th class="py-2 pr-2 text-right font-medium">Rating</th>
                    <th
                        class="hidden py-2 pr-2 text-right font-medium sm:table-cell"
                    >
                        W / L / D
                    </th>
                    <th class="py-2 text-right font-medium">Battles</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="player in players.data"
                    :key="player.username"
                    class="border-b last:border-0"
                    :class="player.is_me && 'bg-primary/5 font-medium'"
                    data-test="scoreboard-row"
                >
                    <td class="py-2 pr-2 tabular-nums">
                        <span
                            v-if="medals[player.rank]"
                            class="inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ring-1"
                            :class="medals[player.rank].class"
                            :aria-label="medals[player.rank].label"
                            data-test="medal"
                        >
                            <Crown v-if="player.rank === 1" class="size-4" />
                            <template v-else>{{ player.rank }}</template>
                        </span>
                        <span v-else class="pl-2">{{ player.rank }}</span>
                    </td>
                    <td class="max-w-0 truncate py-2 pr-2">
                        <template v-if="showNames">
                            {{ player.name }}
                            <span class="text-muted-foreground">
                                @{{ player.username }}
                            </span>
                        </template>
                        <span v-else class="font-medium">
                            @{{ player.username }}
                        </span>
                        <span
                            v-if="player.is_me"
                            class="text-xs text-muted-foreground"
                        >
                            (you)
                        </span>
                    </td>
                    <td class="py-2 pr-2 text-right font-semibold tabular-nums">
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
</template>
