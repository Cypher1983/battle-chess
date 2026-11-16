<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { Flag, User } from '@lucide/vue';
import { scoreboard } from '@/routes';
import { clans } from '@/routes/scoreboard';

defineProps<{
    current: 'players' | 'clans';
}>();

const tabs = [
    { id: 'players', title: 'Players', href: scoreboard(), icon: User },
    { id: 'clans', title: 'Clans', href: clans(), icon: Flag },
] as const;
</script>

<template>
    <nav
        class="inline-flex w-fit gap-1 rounded-lg bg-muted p-1"
        aria-label="Scoreboard"
    >
        <Link
            v-for="tab in tabs"
            :key="tab.id"
            :href="tab.href"
            class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors"
            :class="
                tab.id === current
                    ? 'bg-background font-medium shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
            "
            :aria-current="tab.id === current ? 'page' : undefined"
            :data-test="`scoreboard-tab-${tab.id}`"
        >
            <component :is="tab.icon" class="size-4" />
            {{ tab.title }}
        </Link>
    </nav>
</template>
