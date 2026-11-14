<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { Trophy } from '@lucide/vue';
import ComingSoon from '@/components/ComingSoon.vue';
import { scoreboard } from '@/routes';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                title: 'Scoreboard',
                href: scoreboard(),
            },
        ],
    },
});
</script>

<template>
    <Head title="Scoreboard" />

    <ComingSoon
        title="Scoreboard"
        description="See who rules the board: ratings, wins, losses and draws for every player."
        :icon="Trophy"
    />
</template>
