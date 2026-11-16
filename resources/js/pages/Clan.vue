<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { Flag } from '@lucide/vue';
import ClanEmblem from '@/components/ClanEmblem.vue';
import ClanForm from '@/components/ClanForm.vue';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { clan as clanPage } from '@/routes';
import type { ClanSummary } from '@/types';

type MyClan = ClanSummary & {
    description: string | null;
    is_leader: boolean;
};

defineProps<{
    clan: MyClan | null;
}>();

defineOptions({
    layout: {
        breadcrumbs: [
            {
                title: 'Clan',
                href: clanPage(),
            },
        ],
    },
});
</script>

<template>
    <Head title="Clan" />

    <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
        <Card v-if="clan" data-test="my-clan">
            <CardHeader class="flex flex-row items-center gap-4">
                <ClanEmblem class="size-20" :emblem="clan.emblem" />
                <div class="min-w-0 space-y-1">
                    <CardTitle class="text-2xl">
                        {{ clan.name }}
                        <span class="font-sans text-base text-muted-foreground">
                            [{{ clan.tag }}]
                        </span>
                    </CardTitle>
                    <CardDescription v-if="clan.description">
                        {{ clan.description }}
                    </CardDescription>
                    <p v-if="clan.is_leader" class="text-xs text-primary">
                        You lead this clan.
                    </p>
                </div>
            </CardHeader>
        </Card>

        <Card v-else>
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <Flag class="size-5" />
                    Found a clan
                </CardTitle>
                <CardDescription>
                    Gather players under one banner. You lead the clan and
                    invite players to join it. You can only be in one clan at a
                    time.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ClanForm />
            </CardContent>
        </Card>
    </div>
</template>
