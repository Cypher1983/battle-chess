<script setup lang="ts">
import { computed } from 'vue';
import type { PieceType } from '@/lib/armies';

/**
 * A small 7×7 board showing where a piece in the middle can go.
 * Dots mark moves; rings mark squares a pawn can only capture on.
 */
const props = defineProps<{
    type: PieceType;
    image: string;
}>();

const names: Record<PieceType, string> = {
    k: 'king',
    q: 'queen',
    r: 'rook',
    b: 'bishop',
    n: 'knight',
    p: 'pawn',
};

const SIZE = 7;
const CENTRE = 3;

type Mark = 'piece' | 'move' | 'capture' | null;

const lines: Record<'r' | 'b', [number, number][]> = {
    r: [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
    ],
    b: [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
    ],
};

function marks(type: PieceType): Map<string, Mark> {
    const result = new Map<string, Mark>();
    const add = (dx: number, dy: number, mark: Mark = 'move') => {
        const x = CENTRE + dx;
        const y = CENTRE + dy;

        if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
            result.set(`${x},${y}`, mark);
        }
    };
    const slide = (directions: [number, number][]) => {
        for (const [dx, dy] of directions) {
            for (let step = 1; step < SIZE; step++) {
                add(dx * step, dy * step);
            }
        }
    };

    switch (type) {
        case 'k':
            for (const dx of [-1, 0, 1]) {
                for (const dy of [-1, 0, 1]) {
                    if (dx !== 0 || dy !== 0) {
                        add(dx, dy);
                    }
                }
            }
            break;
        case 'q':
            slide([...lines.r, ...lines.b]);
            break;
        case 'r':
            slide(lines.r);
            break;
        case 'b':
            slide(lines.b);
            break;
        case 'n':
            for (const [dx, dy] of [
                [1, 2],
                [2, 1],
                [-1, 2],
                [-2, 1],
                [1, -2],
                [2, -1],
                [-1, -2],
                [-2, -1],
            ]) {
                add(dx, dy);
            }
            break;
        case 'p':
            // Up the diagram is forward.
            add(0, -1);
            add(-1, -1, 'capture');
            add(1, -1, 'capture');
            break;
    }

    result.set(`${CENTRE},${CENTRE}`, 'piece');

    return result;
}

const squares = computed(() => {
    const marked = marks(props.type);

    return Array.from({ length: SIZE * SIZE }, (_, index) => {
        const x = index % SIZE;
        const y = Math.floor(index / SIZE);

        return {
            key: index,
            dark: (x + y) % 2 === 1,
            mark: marked.get(`${x},${y}`) ?? null,
        };
    });
});
</script>

<template>
    <div
        class="grid aspect-square w-full grid-cols-7 grid-rows-7 overflow-hidden rounded-md border"
        role="img"
        :aria-label="`How the ${names[type]} moves`"
    >
        <div
            v-for="square in squares"
            :key="square.key"
            class="flex min-h-0 items-center justify-center"
            :class="square.dark ? 'bg-stone-500/45' : 'bg-stone-200/70'"
        >
            <img
                v-if="square.mark === 'piece'"
                :src="image"
                alt=""
                class="size-[85%] object-contain"
            />
            <span
                v-else-if="square.mark === 'move'"
                class="aspect-square w-1/3 rounded-full bg-primary shadow"
            />
            <span
                v-else-if="square.mark === 'capture'"
                class="aspect-square w-2/3 rounded-full border-2 border-destructive-foreground"
            />
        </div>
    </div>
</template>
