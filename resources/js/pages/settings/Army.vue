<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import { ref } from 'vue';
import ArmyController from '@/actions/App/Http/Controllers/Settings/ArmyController';
import ArmyChoices from '@/components/chess/ArmyChoices.vue';
import Heading from '@/components/Heading.vue';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { armies } from '@/lib/armies';
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
            <ArmyChoices v-model="chosen" />

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
