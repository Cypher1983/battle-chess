<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { Mail, Shield, Swords, Trophy } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { armies, ARMY_IDS, pieceImage } from '@/lib/armies';
import { armies as armiesPage, login, play, register } from '@/routes';

const page = usePage();

const features = [
    {
        icon: Swords,
        title: 'Captures become battles',
        text: 'Every capture plays out as a short 3D fight scene between the two pieces.',
    },
    {
        icon: Shield,
        title: `${ARMY_IDS.length} armies`,
        text: 'From clockwork automatons to zombie hordes. Pick one, then pick again for any challenge.',
    },
    {
        icon: Mail,
        title: 'Challenge anyone',
        text: 'Invite friends by username or email. Each player gets 72 hours per move.',
    },
    {
        icon: Trophy,
        title: 'Climb the ladder',
        text: 'Every finished battle moves your Elo rating on the public scoreboard.',
    },
];
</script>

<template>
    <Head title="Chess where every capture is a fight" />

    <section
        class="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24"
    >
        <div class="space-y-6 text-center md:text-left">
            <p
                class="text-xs font-semibold tracking-[0.3em] text-primary uppercase"
            >
                Correspondence chess · 3D battles
            </p>
            <h1 class="text-4xl leading-tight font-bold sm:text-5xl">
                Chess where every capture is a fight
            </h1>
            <p class="text-lg text-muted-foreground">
                Challenge your friends, command one of
                {{ ARMY_IDS.length }} armies and watch your pieces battle it out
                on a 3D board whenever a capture lands.
            </p>
            <div class="flex flex-wrap justify-center gap-3 md:justify-start">
                <template v-if="page.props.auth.user">
                    <Button size="lg" as-child>
                        <Link :href="play()"
                            ><Swords /> Go to your battles</Link
                        >
                    </Button>
                </template>
                <template v-else>
                    <Button size="lg" as-child>
                        <Link :href="register()"
                            ><Swords /> Raise your army</Link
                        >
                    </Button>
                    <Button size="lg" variant="outline" as-child>
                        <Link :href="login()">Log in</Link>
                    </Button>
                </template>
            </div>
        </div>

        <!-- Two kings squaring up. -->
        <figure class="relative mx-auto w-full max-w-md" aria-hidden="true">
            <div
                class="absolute -inset-6 rounded-full bg-primary/10 blur-3xl"
            />
            <div
                class="relative grid w-full grid-cols-2 overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-primary/30"
            >
                <div
                    class="flex aspect-square items-center justify-center bg-stone-100"
                >
                    <img
                        :src="pieceImage('clockwork', 'k')"
                        alt=""
                        class="w-3/4 drop-shadow-xl"
                    />
                </div>
                <div
                    class="flex aspect-square items-center justify-center bg-stone-800"
                >
                    <img
                        :src="pieceImage('wildwood', 'k')"
                        alt=""
                        class="w-3/4 -scale-x-100 drop-shadow-xl"
                    />
                </div>
                <span
                    class="absolute top-1/2 left-1/2 flex size-16 -translate-1/2 items-center justify-center rounded-full border-2 border-primary bg-background font-display text-xl font-bold text-primary shadow-lg"
                >
                    VS
                </span>
            </div>
            <figcaption
                class="relative mt-3 text-center text-sm text-muted-foreground"
            >
                {{ armies.clockwork.pieces.k }} vs
                {{ armies.wildwood.pieces.k }}
            </figcaption>
        </figure>
    </section>

    <section class="mx-auto w-full max-w-6xl px-4 pb-16">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
                v-for="feature in features"
                :key="feature.title"
                class="rounded-xl border bg-card/80 p-5 shadow-[inset_0_1px_0_0_var(--card-edge)]"
                data-test="feature"
            >
                <span
                    class="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30"
                >
                    <component :is="feature.icon" class="size-5" />
                </span>
                <h2 class="mb-1 text-base font-semibold">
                    {{ feature.title }}
                </h2>
                <p class="text-sm text-muted-foreground">
                    {{ feature.text }}
                </p>
            </div>
        </div>
    </section>

    <section class="mx-auto w-full max-w-6xl space-y-6 px-4 pb-16">
        <div class="flex items-end justify-between gap-4">
            <h2 class="text-2xl font-semibold">Pick your army</h2>
            <Link
                :href="armiesPage()"
                class="text-sm text-primary underline-offset-4 hover:underline"
            >
                Meet all {{ ARMY_IDS.length }} armies →
            </Link>
        </div>
        <ul
            class="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-[repeat(15,minmax(0,1fr))]"
        >
            <li v-for="id in ARMY_IDS" :key="id" data-test="army-preview">
                <Link
                    :href="`${armiesPage.url()}#${id}`"
                    class="group flex flex-col items-center gap-1 rounded-lg border bg-card/80 p-2 transition-colors hover:border-primary/50"
                    :title="armies[id].name"
                >
                    <img
                        :src="pieceImage(id, 'k')"
                        :alt="armies[id].name"
                        class="size-12 transition-transform group-hover:-translate-y-0.5"
                        loading="lazy"
                    />
                    <span
                        class="w-full truncate text-center text-[0.65rem] text-muted-foreground lg:sr-only"
                    >
                        {{ armies[id].name }}
                    </span>
                </Link>
            </li>
        </ul>
    </section>
</template>
