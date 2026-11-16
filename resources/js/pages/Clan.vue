<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { Crown, Flag, LogOut, Trash2, UserMinus, Users } from '@lucide/vue';
import ClanController from '@/actions/App/Http/Controllers/ClanController';
import ClanMemberController from '@/actions/App/Http/Controllers/ClanMemberController';
import ClanEmblem from '@/components/ClanEmblem.vue';
import ClanForm from '@/components/ClanForm.vue';
import ConfirmAction from '@/components/ConfirmAction.vue';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { clan as clanPage } from '@/routes';
import type { ClanSummary } from '@/types';

type Member = {
    id: number;
    name: string;
    username: string;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
    is_leader: boolean;
    is_me: boolean;
};

type MyClan = ClanSummary & {
    description: string | null;
    is_leader: boolean;
    members: Member[];
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
        <template v-if="clan">
            <Card data-test="my-clan">
                <CardHeader class="flex flex-row items-center gap-4">
                    <ClanEmblem class="size-20" :emblem="clan.emblem" />
                    <div class="min-w-0 space-y-1">
                        <CardTitle class="text-2xl">
                            {{ clan.name }}
                            <span
                                class="font-sans text-base text-muted-foreground"
                            >
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

            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center gap-2">
                        <Users class="size-5" />
                        Members
                        <span
                            class="font-sans text-sm font-normal text-muted-foreground"
                        >
                            ({{ clan.members.length }})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul class="divide-y">
                        <li
                            v-for="member in clan.members"
                            :key="member.id"
                            class="flex flex-wrap items-center justify-between gap-3 py-3"
                            data-test="clan-member"
                        >
                            <div class="min-w-0">
                                <p
                                    class="flex items-center gap-1 truncate font-medium"
                                >
                                    <Crown
                                        v-if="member.is_leader"
                                        class="size-4 text-primary"
                                        aria-label="Leader"
                                    />
                                    {{ member.name }}
                                    <span class="text-muted-foreground">
                                        @{{ member.username }}
                                    </span>
                                    <span
                                        v-if="member.is_me"
                                        class="text-xs text-muted-foreground"
                                    >
                                        (you)
                                    </span>
                                </p>
                                <p
                                    class="text-xs text-muted-foreground tabular-nums"
                                >
                                    Rating {{ member.rating }} ·
                                    {{ member.wins }}W {{ member.losses }}L
                                    {{ member.draws }}D
                                </p>
                            </div>
                            <div
                                v-if="clan.is_leader && !member.is_leader"
                                class="flex gap-2"
                            >
                                <ConfirmAction
                                    :action="
                                        ClanMemberController.promote([
                                            clan.id,
                                            member.id,
                                        ])
                                    "
                                    title="Hand over leadership?"
                                    :description="`${member.name} will lead ${clan.name}. You stay on as a member.`"
                                    confirm-label="Hand over"
                                    variant="default"
                                >
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        data-test="promote-member-button"
                                    >
                                        <Crown />
                                        Make leader
                                    </Button>
                                </ConfirmAction>
                                <ConfirmAction
                                    :action="
                                        ClanMemberController.destroy([
                                            clan.id,
                                            member.id,
                                        ])
                                    "
                                    title="Remove this member?"
                                    :description="`${member.name} will no longer be part of ${clan.name}.`"
                                    confirm-label="Remove"
                                >
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        data-test="remove-member-button"
                                    >
                                        <UserMinus />
                                        Remove
                                    </Button>
                                </ConfirmAction>
                            </div>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            <Card v-if="clan.is_leader">
                <CardHeader>
                    <CardTitle>Clan settings</CardTitle>
                    <CardDescription>
                        Change the name, tag, description or emblem.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ClanForm :key="clan.id" :clan="clan" />
                </CardContent>
            </Card>

            <div class="flex justify-end">
                <ConfirmAction
                    v-if="clan.is_leader"
                    :action="ClanController.destroy(clan.id)"
                    title="Disband the clan?"
                    :description="`${clan.name} will be gone for good and every member released. This cannot be undone.`"
                    confirm-label="Disband"
                >
                    <Button
                        variant="destructive"
                        data-test="disband-clan-button"
                    >
                        <Trash2 />
                        Disband clan
                    </Button>
                </ConfirmAction>
                <ConfirmAction
                    v-else
                    :action="ClanMemberController.leave(clan.id)"
                    title="Leave the clan?"
                    :description="`You will need a new invitation to rejoin ${clan.name}.`"
                    confirm-label="Leave"
                >
                    <Button variant="outline" data-test="leave-clan-button">
                        <LogOut />
                        Leave clan
                    </Button>
                </ConfirmAction>
            </div>
        </template>

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
