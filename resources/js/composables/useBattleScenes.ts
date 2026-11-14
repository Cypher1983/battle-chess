import { ref, watch } from 'vue';
import type { Ref } from 'vue';

const STORAGE_KEY = 'battle-chess:battle-scenes';

function prefersReducedMotion(): boolean {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    );
}

function readPreference(): boolean {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);

        if (stored !== null) {
            return stored === 'on';
        }
    } catch {
        // Storage can be unavailable (private mode, blocked site data).
    }

    return !prefersReducedMotion();
}

const enabled = ref(typeof window === 'undefined' ? false : readPreference());

watch(enabled, (value) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off');
    } catch {
        // Not being able to remember the choice is fine.
    }
});

/**
 * Whether capture battle scenes play. Remembered per browser; defaults to
 * off when the system asks for reduced motion.
 */
export function useBattleScenes(): Ref<boolean> {
    return enabled;
}
