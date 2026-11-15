<script setup lang="ts">
import { ref, watch } from 'vue';
import ArmyChoices from '@/components/chess/ArmyChoices.vue';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogScrollContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { ARMY_IDS, armies } from '@/lib/armies';
import type { ArmyId } from '@/lib/armies';

/**
 * Pick the army to bring to one game, e.g. when challenging or accepting.
 * The parent sends the request when `confirm` fires.
 */
const props = withDefaults(
    defineProps<{
        title: string;
        description: string;
        /** The army selected when the dialog opens, usually the saved one. */
        initial: ArmyId;
        /** The opponent's army, which can't be picked. */
        opponent?: ArmyId | null;
        confirmLabel: string;
        processing?: boolean;
        error?: string;
    }>(),
    { opponent: null, processing: false, error: undefined },
);

const emit = defineEmits<{ confirm: [army: ArmyId] }>();

const open = defineModel<boolean>('open', { required: true });

const chosen = ref<ArmyId>(props.initial);

watch(open, (isOpen) => {
    if (isOpen) {
        chosen.value =
            props.initial === props.opponent
                ? ARMY_IDS.find((id) => id !== props.opponent)!
                : props.initial;
    }
});
</script>

<template>
    <Dialog v-model:open="open">
        <DialogScrollContent class="sm:max-w-2xl" data-test="army-picker">
            <form class="space-y-6" @submit.prevent="emit('confirm', chosen)">
                <DialogHeader>
                    <DialogTitle>{{ title }}</DialogTitle>
                    <DialogDescription>{{ description }}</DialogDescription>
                </DialogHeader>

                <ArmyChoices
                    v-model="chosen"
                    name="picked-army"
                    :unavailable="opponent"
                    unavailable-note="Your opponent's army"
                />

                <slot />

                <InputError :message="error" />

                <DialogFooter class="gap-2">
                    <DialogClose as-child>
                        <Button type="button" variant="secondary">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        :disabled="processing"
                        data-test="confirm-army-button"
                    >
                        <Spinner v-if="processing" />
                        {{ confirmLabel }} with the {{ armies[chosen].name }}
                    </Button>
                </DialogFooter>
            </form>
        </DialogScrollContent>
    </Dialog>
</template>
