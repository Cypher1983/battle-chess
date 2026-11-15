<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { armies, ARMY_IDS, pieceImage } from '@/lib/armies';
</script>

<template>
    <Head title="Armies" />

    <div class="mx-auto w-full max-w-6xl space-y-10 px-4 py-12">
        <header class="max-w-2xl space-y-3">
            <p
                class="text-xs font-semibold tracking-[0.3em] text-primary uppercase"
            >
                {{ ARMY_IDS.length }} armies
            </p>
            <h1 class="text-4xl font-bold">Choose your army</h1>
            <p class="text-muted-foreground">
                Every army plays by the same chess rules. They just look and
                fight differently. Any army can play white or black: a light or
                dark rim on each piece's base shows its side.
            </p>
        </header>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <article
                v-for="id in ARMY_IDS"
                :id="id"
                :key="id"
                class="flex flex-col gap-4 rounded-xl border bg-card/90 p-5 shadow-[inset_0_1px_0_0_var(--card-edge)]"
                data-test="army-card"
            >
                <div class="flex items-center gap-4">
                    <img
                        :src="pieceImage(id, 'k')"
                        :alt="armies[id].pieces.k"
                        class="size-16 shrink-0 drop-shadow-md"
                    />
                    <div>
                        <h2 class="text-lg font-semibold">
                            {{ armies[id].name }}
                        </h2>
                        <p class="text-sm text-muted-foreground italic">
                            {{ armies[id].tagline }}
                        </p>
                    </div>
                </div>
            </article>
        </div>
    </div>
</template>
