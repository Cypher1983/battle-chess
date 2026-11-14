<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import { ref } from 'vue';
import ArmyController from '@/actions/App/Http/Controllers/Settings/ArmyController';
import Heading from '@/components/Heading.vue';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { ARMY_IDS, armies, pieceImage } from '@/lib/armies';
import type { ArmyId } from '@/lib/armies';
import { edit } from '@/routes/army';

const props = defineProps<{
    army: ArmyId;
}>();

defineOptions({
    layout: {
        breadcrumbs: [
            {
                title: 'Army',
                href: edit(),
            },
        ],
    },
});

const chosen = ref<ArmyId>(props.army);
</script>

<template>
    <Head title="Army" />

    <h1 class="sr-only">Army</h1>

    <div class="space-y-6">
        <Heading
            variant="small"
            title="Your army"
            description="Choose the army you bring to new games. It fights on either side; games already under way keep their armies."
        />

        <Form
            v-bind="ArmyController.update.form()"
            class="space-y-6"
            v-slot="{ errors, processing }"
        >
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
                        name="army"
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

            <InputError :message="errors.army" />

            <Button
                :disabled="processing || chosen === army"
                data-test="choose-army-button"
            >
                March with the {{ armies[chosen].name }}
            </Button>
        </Form>
    </div>
</template>
