<script setup lang="ts">
import { ARMY_IDS, armies, pieceImage } from '@/lib/armies';
import type { ArmyId } from '@/lib/armies';

withDefaults(
    defineProps<{
        /** The form field name of the radio buttons. */
        name?: string;
    }>(),
    { name: 'army' },
);

const chosen = defineModel<ArmyId>({ required: true });
</script>

<template>
    <fieldset class="grid gap-3 sm:grid-cols-2">
        <legend class="sr-only">Army</legend>
        <label
            v-for="id in ARMY_IDS"
            :key="id"
            class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            :data-test="`army-${id}`"
        >
            <input
                v-model="chosen"
                type="radio"
                :name="name"
                :value="id"
                class="sr-only"
            />
            <img
                :src="pieceImage(id, 'k')"
                :alt="''"
                class="size-14 shrink-0 rounded-md bg-[#eadfc8] p-1"
            />
            <span class="min-w-0">
                <span class="block font-medium">
                    {{ armies[id].name }}
                </span>
                <span class="block text-sm text-muted-foreground">
                    {{ armies[id].tagline }}
                </span>
            </span>
        </label>
    </fieldset>
</template>
