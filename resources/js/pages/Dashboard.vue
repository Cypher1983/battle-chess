<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { Mail, Swords, Trophy } from '@lucide/vue';
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { armies, pieceImage } from '@/lib/armies';
import type { ArmyId, PieceType } from '@/lib/armies';
import { dashboard, invites, play, scoreboard } from '@/routes';
import { edit as editArmy } from '@/routes/army';

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

const army = computed(
    () => armies[page.props.auth.user.army as ArmyId] ?? armies.clockwork,
);

/** The pieces shown in the army banner, royals in the middle. */
const rank: PieceType[] = ['p', 'n', 'b', 'k', 'q', 'r'];

const pendingInvitations = computed(() => page.props.pendingInvitations);
const games = computed(
    () => props.stats.wins + props.stats.losses + props.stats.draws,
);
</script>

<template>
    <Head title="Dashboard" />

    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
        <Card class="overflow-hidden py-0" data-test="army-banner">
            <div
                class="flex flex-col gap-6 bg-linear-to-br from-primary/15 via-transparent to-transparent p-6 md:flex-row md:items-center md:justify-between"
            >
                <div class="space-y-1">
                    <h1 class="text-2xl font-semibold">
                        Welcome back, {{ page.props.auth.user.name }}
                    </h1>
                    <p class="text-sm text-muted-foreground">
                        The
                        <span class="font-semibold text-primary">{{
                            army.name
                        }}</span>
                        awaits your orders.
                    </p>
                    <p class="text-sm text-muted-foreground italic">
                        {{ army.tagline }}
                    </p>
                    <Link
                        :href="editArmy()"
                        class="inline-block pt-1 text-sm text-primary underline-offset-4 hover:underline"
                    >
                        Change army
                    </Link>
                </div>
                <div class="flex items-end gap-1 sm:gap-2">
                    <img
                        v-for="type in rank"
                        :key="type"
                        :src="pieceImage(army.id, type)"
                        :alt="army.pieces[type]"
                        :title="army.pieces[type]"
                        class="drop-shadow-md"
                        :class="type === 'k' ? 'size-16' : 'size-12'"
                    />
                </div>
            </div>
        </Card>

        <div class="grid gap-4 sm:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardDescription>Rating</CardDescription>
                    <CardAction>
                        <span
                            class="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30"
                        >
                            <Trophy class="size-4" />
                        </span>
                    </CardAction>
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
                    <CardAction>
                        <span
                            class="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30"
                        >
                            <Swords class="size-4" />
                        </span>
                    </CardAction>
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
                    <CardAction>
                        <span
                            class="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30"
                        >
                            <Mail class="size-4" />
                        </span>
                    </CardAction>
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
