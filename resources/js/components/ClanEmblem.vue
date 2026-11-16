<script setup lang="ts">
import { emblemIcons, emblemShapes } from '@/lib/emblems';
import type { Emblem } from '@/lib/emblems';

defineProps<{
    emblem: Emblem;
    /** The clan's name, read out by screen readers; omit when shown beside it. */
    label?: string;
}>();
</script>

<template>
    <svg
        viewBox="0 0 100 100"
        class="shrink-0"
        :role="label ? 'img' : undefined"
        :aria-label="label"
        :aria-hidden="label ? undefined : 'true'"
        data-test="clan-emblem"
    >
        <path
            :d="emblemShapes[emblem.shape].path"
            :fill="emblem.primary"
            :stroke="emblem.secondary"
            stroke-width="6"
            stroke-linejoin="round"
        />
        <path
            :d="emblemIcons[emblem.icon].path"
            :fill="emblem.secondary"
            fill-rule="evenodd"
            transform="translate(23 22) scale(2.25)"
        />
    </svg>
</template>
