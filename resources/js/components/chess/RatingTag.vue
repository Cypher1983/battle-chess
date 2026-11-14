<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    rating: number;
    change: number | null;
}>();

const changeLabel = computed(() => {
    if (props.change === null) {
        return null;
    }

    return props.change > 0 ? `+${props.change}` : `${props.change}`;
});

const changeClass = computed(() => {
    if (props.change === null || props.change === 0) {
        return '';
    }

    return props.change > 0 ? 'text-green-600' : 'text-red-600';
});
</script>

<template>
    <span
        class="ml-1 text-xs text-muted-foreground tabular-nums"
        data-test="rating"
    >
        {{ rating }}
        <span v-if="changeLabel" :class="changeClass">({{ changeLabel }})</span>
    </span>
</template>
