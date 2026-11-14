<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { armies, pieceGlyphs } from '@/lib/armies';
import type { PieceColor, PieceType } from '@/lib/armies';

defineProps<{
    color: PieceColor;
}>();

const emit = defineEmits<{
    choose: [piece: PieceType];
    cancel: [];
}>();

const choices: PieceType[] = ['q', 'r', 'b', 'n'];
</script>

<template>
    <div
        class="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-label="Choose a promotion piece"
        @click.self="emit('cancel')"
    >
        <div class="flex flex-col gap-3 rounded-xl bg-background p-4 shadow-xl">
            <p class="text-center text-sm font-medium">Promote your pawn to</p>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button
                    v-for="piece in choices"
                    :key="piece"
                    variant="outline"
                    class="flex h-auto flex-col gap-1 py-2"
                    :data-test="`promote-${piece}`"
                    @click="emit('choose', piece)"
                >
                    <span
                        class="text-3xl leading-none"
                        :class="
                            color === 'w' ? 'text-[#d9a521]' : 'text-[#2f6b35]'
                        "
                    >
                        {{ pieceGlyphs[piece] }}
                    </span>
                    <span class="text-xs">{{
                        armies[color].pieces[piece]
                    }}</span>
                </Button>
            </div>
            <Button variant="ghost" size="sm" @click="emit('cancel')">
                Cancel
            </Button>
        </div>
    </div>
</template>
