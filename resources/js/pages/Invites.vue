<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { Mail } from '@lucide/vue';
import ComingSoon from '@/components/ComingSoon.vue';
import { invites } from '@/routes';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                title: 'Invites',
                href: invites(),
            },
        ],
    },
});
</script>

<template>
    <Head title="Invites" />

    <ComingSoon
        title="Invites"
        description="Challenge other players by username or email, and answer the challenges sent to you."
        :icon="Mail"
    />
</template>
