import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { QualityChoice } from '@/lib/board3d/quality';

const STORAGE_KEY = 'battle-chess:graphics';
const CHOICES: QualityChoice[] = ['auto', 'low', 'high', 'ultra'];

function readPreference(): QualityChoice {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);

        if (CHOICES.includes(stored as QualityChoice)) {
            return stored as QualityChoice;
        }
    } catch {
        // Storage can be unavailable (private mode, blocked site data).
    }

    return 'auto';
}

const choice = ref<QualityChoice>(
    typeof window === 'undefined' ? 'auto' : readPreference(),
);

watch(choice, (value) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
        // Not being able to remember the choice is fine.
    }
});

/**
 * The 3D graphics level the player chose ("auto" by default), remembered
 * per browser.
 */
export function useGraphicsQuality(): Ref<QualityChoice> {
    return choice;
}
