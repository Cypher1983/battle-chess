<script setup lang="ts">
import { useForm } from '@inertiajs/vue3';
import { computed } from 'vue';
import ClanController from '@/actions/App/Http/Controllers/ClanController';
import EmblemBuilder from '@/components/EmblemBuilder.vue';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEFAULT_EMBLEM } from '@/lib/emblems';
import type { Emblem } from '@/lib/emblems';
import type { ClanSummary } from '@/types';

const props = defineProps<{
    /** The clan to edit; omit to found a new one. */
    clan?: ClanSummary & { description: string | null };
}>();

const emit = defineEmits<{ saved: [] }>();

const form = useForm({
    name: props.clan?.name ?? '',
    tag: props.clan?.tag ?? '',
    description: props.clan?.description ?? '',
    emblem: { ...(props.clan?.emblem ?? DEFAULT_EMBLEM) } as Emblem,
});

/** The server names the emblem fields separately from the form's emblem object. */
const emblemErrors = computed(
    () => form.errors as Partial<Record<string, string>>,
);

function submit(): void {
    const request = form.transform((data) => ({
        name: data.name,
        tag: data.tag,
        description: data.description,
        emblem_shape: data.emblem.shape,
        emblem_icon: data.emblem.icon,
        emblem_primary: data.emblem.primary,
        emblem_secondary: data.emblem.secondary,
    }));
    const options = { preserveScroll: true, onSuccess: () => emit('saved') };

    if (props.clan) {
        request.patch(ClanController.update.url(props.clan.id), options);
    } else {
        request.post(ClanController.store.url(), options);
    }
}
</script>

<template>
    <form class="space-y-6" @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <div class="grid gap-2">
                <Label for="clan-name">Name</Label>
                <Input
                    id="clan-name"
                    v-model="form.name"
                    name="name"
                    required
                    minlength="3"
                    maxlength="40"
                    autocomplete="off"
                    placeholder="The Iron Ring"
                />
                <InputError :message="form.errors.name" />
            </div>
            <div class="grid gap-2">
                <Label for="clan-tag">Tag</Label>
                <Input
                    id="clan-tag"
                    v-model="form.tag"
                    name="tag"
                    required
                    minlength="2"
                    maxlength="4"
                    autocomplete="off"
                    class="uppercase"
                    placeholder="IRON"
                />
                <InputError :message="form.errors.tag" />
            </div>
        </div>

        <div class="grid gap-2">
            <Label for="clan-description">
                Description
                <span class="font-normal text-muted-foreground">
                    (optional)
                </span>
            </Label>
            <textarea
                id="clan-description"
                v-model="form.description"
                name="description"
                rows="2"
                maxlength="280"
                class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                placeholder="What your clan stands for"
            />
            <InputError :message="form.errors.description" />
        </div>

        <EmblemBuilder v-model="form.emblem" :errors="emblemErrors" />

        <Button
            type="submit"
            :disabled="form.processing"
            data-test="save-clan-button"
        >
            {{ clan ? 'Save changes' : 'Found clan' }}
        </Button>
    </form>
</template>
