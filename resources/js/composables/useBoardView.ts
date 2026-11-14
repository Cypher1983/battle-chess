import { computed, ref, watch } from 'vue';
import type { ComputedRef, Ref } from 'vue';

export type BoardView = '2d' | '3d';

const STORAGE_KEY = 'battle-chess:board-view';

/**
 * Whether this browser can draw the 3D board. Checked once per page load.
 */
function detectWebGL(): boolean {
    if (typeof document === 'undefined') {
        return false;
    }

    try {
        const canvas = document.createElement('canvas');

        return (
            canvas.getContext('webgl2') !== null ||
            canvas.getContext('webgl') !== null
        );
    } catch {
        return false;
    }
}

function readPreference(): BoardView {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);

        if (stored === '2d' || stored === '3d') {
            return stored;
        }
    } catch {
        // Storage can be unavailable (private mode, blocked site data).
    }

    return '3d';
}

const supports3d = detectWebGL();
const preferred = ref<BoardView>(
    typeof window === 'undefined' ? '2d' : readPreference(),
);

watch(preferred, (value) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
        // Not being able to remember the choice is fine.
    }
});

/**
 * Which board to draw. Players choose 2D or 3D (3D by default, remembered
 * per browser); browsers without WebGL always get the 2D board.
 */
export function useBoardView(): {
    preferred: Ref<BoardView>;
    view: ComputedRef<BoardView>;
    supports3d: boolean;
} {
    return {
        preferred,
        view: computed(() => (supports3d ? preferred.value : '2d')),
        supports3d,
    };
}
