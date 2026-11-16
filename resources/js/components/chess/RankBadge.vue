<script setup lang="ts">
import { Crown } from '@lucide/vue';

defineProps<{
    rank: number;
}>();

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
    <span
        v-if="medals[rank]"
        class="inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ring-1"
        :class="medals[rank].class"
        :aria-label="medals[rank].label"
        data-test="medal"
    >
        <Crown v-if="rank === 1" class="size-4" />
        <template v-else>{{ rank }}</template>
    </span>
    <span v-else class="pl-2">{{ rank }}</span>
</template>
