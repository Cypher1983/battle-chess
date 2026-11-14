<script setup lang="ts">
import { router, usePage } from '@inertiajs/vue3';
import { toast } from 'vue-sonner';
import { useUserNotifications } from '@/composables/useRealtime';

type LiveNotification = {
    kind: 'invitation.received' | 'challenge.accepted' | 'challenge.declined';
    message: string;
    url: string | null;
};

const page = usePage();

/**
 * Props to refresh for each kind; props a page does not have are ignored.
 */
const reloads: Record<LiveNotification['kind'], string[]> = {
    'invitation.received': ['pendingInvitations', 'received'],
    'challenge.accepted': ['sent', 'active'],
    'challenge.declined': ['sent'],
};

if (page.props.auth.user) {
    useUserNotifications<LiveNotification>(
        page.props.auth.user.id,
        (notification) => {
            const url = notification.url;

            toast.info(notification.message, {
                action: url
                    ? { label: 'Open', onClick: () => router.visit(url) }
                    : undefined,
            });

            router.reload({ only: reloads[notification.kind] ?? [] });
        },
    );
}
</script>

<template>
    <span class="hidden" aria-hidden="true" />
</template>
