<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { Swords } from '@lucide/vue';
import ComingSoon from '@/components/ComingSoon.vue';
import { play } from '@/routes';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                title: 'Play',
                href: play(),
            },
        ],
    },
});
</script>

<template>
    <Head title="Play" />

    <ComingSoon
        title="Play"
        description="Lead the Clockwork Legion or the Wildwood Court into battle against your friends."
        :icon="Swords"
    />
</template>
