<script setup lang="ts">
import type { Square } from 'chess.js';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { PieceColor } from '@/lib/armies';
import type { BoardView } from '@/lib/board3d/BoardView';

type Props = {
    fen: string;
    orientation: PieceColor;
    lastMove?: { from: string; to: string } | null;
    selected?: string | null;
    targets?: string[];
};

const props = withDefaults(defineProps<Props>(), {
    lastMove: null,
    selected: null,
    targets: () => [],
});

const emit = defineEmits<{
    squareClick: [square: Square];
    /** The 3D board could not start (e.g. WebGL failed); show 2D instead. */
    failed: [];
}>();

const host = ref<HTMLDivElement | null>(null);
const ready = ref(false);
let view: BoardView | null = null;
let unmounted = false;

onMounted(async () => {
    try {
        // three.js is only downloaded when the 3D board is shown.
        const { BoardView } = await import('@/lib/board3d/BoardView');

        if (unmounted || !host.value) {
            return;
        }

        view = new BoardView(host.value, {
            orientation: props.orientation,
            onSquareClick: (square) => emit('squareClick', square),
        });
        view.setPosition(props.fen);
        view.setHighlights(highlights());
        ready.value = true;
    } catch (error) {
        console.error('3D board failed', error);
        emit('failed');
    }
});

onBeforeUnmount(() => {
    unmounted = true;
    view?.dispose();
    view = null;
});

watch(
    () => props.fen,
    (fen) => view?.setPosition(fen),
);

function highlights() {
    return {
        lastMove: props.lastMove
            ? { from: props.lastMove.from, to: props.lastMove.to }
            : null,
        selected: props.selected,
        targets: props.targets,
    };
}

watch(highlights, (marks) => view?.setHighlights(marks));

watch(
    () => props.orientation,
    (orientation) => view?.setOrientation(orientation),
);
</script>

<template>
    <div
        class="relative aspect-square w-full select-none"
        data-test="chess-board-3d"
    >
        <div ref="host" class="absolute inset-0 touch-none" />
        <button
            v-if="ready"
            type="button"
            class="absolute top-2 right-2 z-10 rounded bg-black/40 px-2 py-0.5 text-xs text-white hover:bg-black/60"
            title="Drag to turn the board, scroll or pinch to zoom"
            data-test="reset-camera"
            @click="view?.resetCamera()"
        >
            Reset view
        </button>
        <div
            v-if="!ready"
            class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
        >
            Loading 3D board…
        </div>
    </div>
</template>
