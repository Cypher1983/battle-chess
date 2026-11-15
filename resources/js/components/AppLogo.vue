<script setup lang="ts">
import { usePage } from '@inertiajs/vue3';
import AppLogoIcon from '@/components/AppLogoIcon.vue';

const name = usePage().props.name;
</script>

<template>
    <div class="flex aspect-square size-8 items-center justify-center">
        <AppLogoIcon class="size-8 text-sidebar-primary" />
    </div>
    <div class="ml-1 grid flex-1 text-left">
        <span
            class="truncate font-display text-sm leading-tight font-bold tracking-[0.14em] uppercase"
            >{{ name }}</span
        >
    </div>
</template>
