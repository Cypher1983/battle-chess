<script setup lang="ts">
import { BOARD_THEME_IDS, boardThemes } from '@/lib/boardThemes';
import type { BoardThemeId } from '@/lib/boardThemes';

withDefaults(
    defineProps<{
        /** The form field name of the radio buttons. */
        name?: string;
    }>(),
    { name: 'board_theme' },
);

const chosen = defineModel<BoardThemeId>({ required: true });

/** A 4×4 corner of the board, enough to show its colours. */
const CELLS = Array.from({ length: 16 }, (_, i) => (i + (i >> 2)) % 2 === 0);
</script>

<template>
    <fieldset class="space-y-2">
        <legend class="text-sm font-medium">Board</legend>
        <div class="grid grid-cols-4 gap-2 sm:grid-cols-8">
            <label
                v-for="id in BOARD_THEME_IDS"
                :key="id"
                class="flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-1.5 text-center text-xs transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                :data-test="`board-theme-${id}`"
            >
                <input
                    v-model="chosen"
                    type="radio"
                    :name="name"
                    :value="id"
                    class="sr-only"
                />
                <span
                    class="grid aspect-square w-full grid-cols-4 rounded-sm border-[3px]"
                    :style="{ borderColor: boardThemes[id].frame }"
                    aria-hidden="true"
                >
                    <span
                        v-for="(light, index) in CELLS"
                        :key="index"
                        :style="{
                            backgroundColor: light
                                ? boardThemes[id].light
                                : boardThemes[id].dark,
                        }"
                    />
                </span>
                <span class="leading-tight">{{ boardThemes[id].name }}</span>
            </label>
        </div>
    </fieldset>
</template>
