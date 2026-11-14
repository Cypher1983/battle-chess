<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Fighter } from '@/lib/battle/playBattle';

const props = defineProps<{
    attacker: Fighter;
    defender: Fighter;
}>();

const emit = defineEmits<{
    impact: [];
    done: [];
}>();

let impacted = false;

const host = ref<HTMLDivElement | null>(null);
const controller = new AbortController();

onMounted(async () => {
    try {
        // PixiJS is only downloaded the first time a battle plays.
        const { playBattle, IMPACT_AT } =
            await import('@/lib/battle/playBattle');

        if (host.value) {
            await playBattle(host.value, {
                attacker: props.attacker,
                defender: props.defender,
                signal: controller.signal,
                onProgress: (elapsed) => {
                    if (!impacted && elapsed >= IMPACT_AT) {
                        impacted = true;
                        emit('impact');
                    }
                },
            });
        }
    } catch (error) {
        // A failed animation must never block the game.
        console.error('Battle scene failed', error);
    } finally {
        // Skipped or failed scenes still deliver the impact (e.g. its sound).
        if (!impacted) {
            impacted = true;
            emit('impact');
        }

        emit('done');
    }
});

onBeforeUnmount(() => controller.abort());

function skip(): void {
    controller.abort();
}
</script>

<template>
    <div
        ref="host"
        class="absolute inset-0 z-40 cursor-pointer overflow-hidden rounded-lg"
        role="img"
        aria-label="Capture battle. Click to skip."
        data-test="battle-overlay"
        @click="skip"
    >
        <span
            class="pointer-events-none absolute right-2 bottom-2 z-10 rounded bg-black/50 px-2 py-0.5 text-xs text-white"
        >
            Click to skip
        </span>
    </div>
</template>
