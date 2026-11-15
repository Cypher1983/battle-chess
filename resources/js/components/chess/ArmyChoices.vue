<script setup lang="ts">
import { ARMY_IDS, armies, pieceImage } from '@/lib/armies';
import type { ArmyId } from '@/lib/armies';

withDefaults(
    defineProps<{
        /** The form field name of the radio buttons. */
        name?: string;
        /** An army that can't be picked, e.g. the one the opponent leads. */
        unavailable?: ArmyId | null;
        /** Why the unavailable army can't be picked. */
        unavailableNote?: string;
    }>(),
    { name: 'army', unavailable: null, unavailableNote: 'Unavailable' },
);

const chosen = defineModel<ArmyId>({ required: true });
</script>

<template>
    <fieldset class="grid gap-3 sm:grid-cols-2">
        <legend class="sr-only">Army</legend>
        <label
            v-for="id in ARMY_IDS"
            :key="id"
            class="flex items-center gap-3 rounded-lg border p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            :class="
                id === unavailable
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer hover:bg-muted/50'
            "
            :data-test="`army-${id}`"
            :data-unavailable="id === unavailable || undefined"
        >
            <input
                v-model="chosen"
                type="radio"
                :name="name"
                :value="id"
                :disabled="id === unavailable"
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
                    {{
                        id === unavailable
                            ? unavailableNote
                            : armies[id].tagline
                    }}
                </span>
            </span>
        </label>
    </fieldset>
</template>
