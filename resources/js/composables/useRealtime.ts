import {
    echoIsConfigured,
    useConnectionStatus,
    useEchoNotification,
    useEchoPresence,
} from '@laravel/echo-vue';
import type { ConnectionStatus } from '@laravel/echo-vue';
import { computed, ref } from 'vue';
import type { Ref } from 'vue';

/**
 * Thin wrappers around Echo that do nothing when real-time is not configured,
 * so pages work (with polling fallbacks) without a Reverb server.
 */
export function useRealtimeConnection(): Ref<ConnectionStatus> {
    return echoIsConfigured() ? useConnectionStatus() : ref('disconnected');
}

export function useIsLive(): Ref<boolean> {
    const status = useRealtimeConnection();

    return computed(() => status.value === 'connected');
}

export function usePresence<TPayload = unknown>(
    channel: string,
    event: string,
    callback: (payload: TPayload) => void,
): ReturnType<typeof useEchoPresence> | null {
    return echoIsConfigured()
        ? useEchoPresence<TPayload>(channel, event, callback)
        : null;
}

export function useUserNotifications<TPayload>(
    userId: number,
    callback: (payload: TPayload) => void,
): void {
    if (echoIsConfigured()) {
        useEchoNotification<TPayload>(`App.Models.User.${userId}`, callback);
    }
}
