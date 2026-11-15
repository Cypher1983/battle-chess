<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import ScoreboardTable from '@/components/chess/ScoreboardTable.vue';
import { Button } from '@/components/ui/button';
import { register, rules } from '@/routes';
import type { RankedPlayers } from '@/types/scoreboard';

defineProps<{
    players: RankedPlayers;
}>();
</script>

<template>
    <Head title="Scoreboard" />

    <div class="mx-auto w-full max-w-4xl space-y-8 px-4 py-12">
        <header class="space-y-3">
            <p
                class="text-xs font-semibold tracking-[0.3em] text-primary uppercase"
            >
                Hall of champions
            </p>
            <h1 class="text-4xl font-bold">Scoreboard</h1>
            <p class="text-muted-foreground">
                Players ranked by Elo rating. Everyone starts at 1200;
                <Link
                    :href="`${rules.url()}#rating`"
                    class="text-primary underline-offset-4 hover:underline"
                    >see how ratings work</Link
                >.
            </p>
        </header>

        <div
            class="rounded-xl border bg-card/90 p-5 shadow-[inset_0_1px_0_0_var(--card-edge)]"
        >
            <ScoreboardTable :players="players" :show-names="false" />
        </div>

        <div
            class="flex flex-col items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 p-6 text-center sm:flex-row sm:justify-between sm:text-left"
        >
            <p class="text-sm text-muted-foreground">
                Want your name up here? Finish a battle to join the rankings.
            </p>
            <Button as-child>
                <Link :href="register()">Raise your army</Link>
            </Button>
        </div>
    </div>
</template>
