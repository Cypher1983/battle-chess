<script setup lang="ts">
import ClanEmblem from '@/components/ClanEmblem.vue';
import InputError from '@/components/InputError.vue';
import { Label } from '@/components/ui/label';
import {
    EMBLEM_ICON_IDS,
    EMBLEM_SHAPE_IDS,
    emblemIcons,
    emblemShapes,
} from '@/lib/emblems';
import type { Emblem } from '@/lib/emblems';

defineProps<{
    /** Validation messages, keyed by the server's field names. */
    errors?: Partial<
        Record<
            | 'emblem_shape'
            | 'emblem_icon'
            | 'emblem_primary'
            | 'emblem_secondary',
            string
        >
    >;
}>();

const emblem = defineModel<Emblem>({ required: true });

const choice =
    'flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-1.5 text-center text-xs transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring';
</script>

<template>
    <div class="grid gap-6 sm:grid-cols-[1fr_auto]">
        <div class="space-y-5">
            <fieldset class="space-y-2">
                <legend class="text-sm font-medium">Shape</legend>
                <div class="grid grid-cols-4 gap-2">
                    <label
                        v-for="id in EMBLEM_SHAPE_IDS"
                        :key="id"
                        :class="choice"
                        :data-test="`emblem-shape-${id}`"
                    >
                        <input
                            v-model="emblem.shape"
                            type="radio"
                            name="emblem_shape"
                            :value="id"
                            class="sr-only"
                        />
                        <ClanEmblem
                            class="size-9"
                            :emblem="{ ...emblem, shape: id }"
                        />
                        {{ emblemShapes[id].name }}
                    </label>
                </div>
                <InputError :message="errors?.emblem_shape" />
            </fieldset>

            <fieldset class="space-y-2">
                <legend class="text-sm font-medium">Icon</legend>
                <div class="grid grid-cols-5 gap-2">
                    <label
                        v-for="id in EMBLEM_ICON_IDS"
                        :key="id"
                        :class="choice"
                        :data-test="`emblem-icon-${id}`"
                    >
                        <input
                            v-model="emblem.icon"
                            type="radio"
                            name="emblem_icon"
                            :value="id"
                            class="sr-only"
                        />
                        <svg
                            viewBox="0 0 24 24"
                            class="size-6"
                            aria-hidden="true"
                        >
                            <path
                                :d="emblemIcons[id].path"
                                fill="currentColor"
                                fill-rule="evenodd"
                            />
                        </svg>
                        {{ emblemIcons[id].name }}
                    </label>
                </div>
                <InputError :message="errors?.emblem_icon" />
            </fieldset>

            <div class="grid grid-cols-2 gap-4">
                <div class="grid gap-2">
                    <Label for="emblem_primary">Field colour</Label>
                    <input
                        id="emblem_primary"
                        v-model="emblem.primary"
                        type="color"
                        name="emblem_primary"
                        class="h-9 w-full cursor-pointer rounded-md border border-input bg-transparent p-1"
                    />
                    <InputError :message="errors?.emblem_primary" />
                </div>
                <div class="grid gap-2">
                    <Label for="emblem_secondary">Border & icon colour</Label>
                    <input
                        id="emblem_secondary"
                        v-model="emblem.secondary"
                        type="color"
                        name="emblem_secondary"
                        class="h-9 w-full cursor-pointer rounded-md border border-input bg-transparent p-1"
                    />
                    <InputError :message="errors?.emblem_secondary" />
                </div>
            </div>
        </div>

        <figure class="flex flex-col items-center gap-2 sm:pt-7">
            <ClanEmblem
                class="size-32"
                :emblem="emblem"
                label="Emblem preview"
            />
            <figcaption class="text-xs text-muted-foreground">
                Preview
            </figcaption>
        </figure>
    </div>
</template>
