import { ref, watch } from 'vue';
import type { Ref } from 'vue';

const STORAGE_KEY = 'battle-chess:sound';

function readPreference(): boolean {
    try {
        return window.localStorage.getItem(STORAGE_KEY) !== 'off';
    } catch {
        return true;
    }
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
 * Whether sound effects play. On by default and remembered per browser.
 */
export function useSoundEffects(): Ref<boolean> {
    return enabled;
}
