<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { Mail, Swords, Trophy } from '@lucide/vue';
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard, invites, play, scoreboard } from '@/routes';

const props = defineProps<{
    stats: {
        rating: number;
        wins: number;
        losses: number;
        draws: number;
        active_games: number;
        your_turn: number;
    };
}>();

defineOptions({
    layout: {
        breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
    },
});

const page = usePage();
const pendingInvitations = computed(() => page.props.pendingInvitations);
const games = computed(
    () => props.stats.wins + props.stats.losses + props.stats.draws,
);
</script>

<template>
    <Head title="Dashboard" />

    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
        <div>
            <h1 class="text-2xl font-semibold">
                Welcome back, {{ page.props.auth.user.name }}
            </h1>
            <p class="text-sm text-muted-foreground">
                The Clockwork Legion and the Wildwood Court await your orders.
            </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardDescription>Rating</CardDescription>
                    <CardTitle
                        class="text-3xl tabular-nums"
                        data-test="stat-rating"
                    >
                        {{ stats.rating }}
                    </CardTitle>
                </CardHeader>
                <CardContent class="text-sm text-muted-foreground">
                    {{ stats.wins }} wins · {{ stats.losses }} losses ·
                    {{ stats.draws }} draws
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardDescription>Your move</CardDescription>
                    <CardTitle
                        class="text-3xl tabular-nums"
                        data-test="stat-your-turn"
                    >
                        {{ stats.your_turn }}
                    </CardTitle>
                </CardHeader>
                <CardContent class="text-sm text-muted-foreground">
                    of {{ stats.active_games }} battles in progress
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardDescription>Open challenges</CardDescription>
                    <CardTitle class="text-3xl tabular-nums">
                        {{ pendingInvitations }}
                    </CardTitle>
                </CardHeader>
                <CardContent class="text-sm text-muted-foreground">
                    waiting for your answer
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>
                    {{ games === 0 ? 'Begin your first battle' : 'Next steps' }}
                </CardTitle>
            </CardHeader>
            <CardContent class="flex flex-wrap gap-2">
                <Button as-child>
                    <Link :href="play()"><Swords /> Your battles</Link>
                </Button>
                <Button variant="outline" as-child>
                    <Link :href="invites()"><Mail /> Challenge a player</Link>
                </Button>
                <Button variant="outline" as-child>
                    <Link :href="scoreboard()"><Trophy /> Scoreboard</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
</template>
