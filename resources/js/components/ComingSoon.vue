<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';

defineProps<{
    title: string;
    description: string;
    icon: LucideIcon;
}>();
</script>

<template>
    <div class="flex h-full flex-1 items-center justify-center p-4">
        <div
            class="flex max-w-md flex-col items-center gap-3 rounded-xl border border-sidebar-border/70 p-8 text-center dark:border-sidebar-border"
        >
            <component :is="icon" class="size-10 text-muted-foreground" />
            <h1 class="text-xl font-semibold">{{ title }}</h1>
            <p class="text-sm text-muted-foreground">{{ description }}</p>
            <span
                class="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
            >
                Coming soon
            </span>
        </div>
    </div>
</template>
