<script setup lang="ts">
import { Head, Link, useForm } from '@inertiajs/vue3';
import { Check, Clock, Mail, Swords, X } from '@lucide/vue';
import { ref } from 'vue';
import InvitationController from '@/actions/App/Http/Controllers/InvitationController';
import ArmyPickerDialog from '@/components/chess/ArmyPickerDialog.vue';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ArmyId } from '@/lib/armies';
import { invites } from '@/routes';

type Player = {
    name: string;
    username: string;
};

type ReceivedInvitation = {
    id: number;
    /** The army the challenger brings. */
    army: ArmyId;
    player: Player;
    sent_at: string;
    expires_at: string;
    expires_in: string;
};

type SentInvitation = Omit<ReceivedInvitation, 'player'> & {
    player: Player | null;
    email: string | null;
};

const props = defineProps<{
    my_army: ArmyId;
    received: ReceivedInvitation[];
    sent: SentInvitation[];
}>();

defineOptions({
    layout: {
        breadcrumbs: [
            {
                title: 'Invites',
                href: invites(),
            },
        ],
    },
});

const challenge = useForm({ recipient: '', army: props.my_army });
const pickingChallengeArmy = ref(false);

/** Ask which army to bring before sending the challenge. */
function chooseChallengeArmy(): void {
    challenge.clearErrors();
    pickingChallengeArmy.value = true;
}

function sendChallenge(army: ArmyId): void {
    challenge.army = army;
    challenge.post(InvitationController.store.url(), {
        preserveScroll: true,
        onSuccess: () => {
            pickingChallengeArmy.value = false;
            challenge.reset('recipient');
        },
        onError: (errors) => {
            // A bad recipient is fixed in the form, not the dialog.
            if (errors.recipient) {
                pickingChallengeArmy.value = false;
            }
        },
    });
}
</script>

<template>
    <Head title="Invites" />

    <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
        <Card>
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <Swords class="size-5" />
                    Challenge a player
                </CardTitle>
                <CardDescription>
                    Enter a username, or an email address to invite a friend who
                    hasn't joined yet. Challenges expire after 7 days.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    class="flex flex-col gap-2 sm:flex-row sm:items-start"
                    @submit.prevent="chooseChallengeArmy"
                >
                    <div class="grid flex-1 gap-2">
                        <Label for="recipient" class="sr-only">
                            Username or email
                        </Label>
                        <Input
                            id="recipient"
                            v-model="challenge.recipient"
                            name="recipient"
                            required
                            autocomplete="off"
                            placeholder="Username or email"
                        />
                        <InputError :message="challenge.errors.recipient" />
                    </div>
                    <Button
                        type="submit"
                        :disabled="challenge.processing"
                        data-test="send-challenge-button"
                    >
                        Send challenge
                    </Button>
                </form>

                <ArmyPickerDialog
                    v-model:open="pickingChallengeArmy"
                    title="Choose your army"
                    :description="`The army you lead against ${challenge.recipient}. They pick theirs when they accept.`"
                    :initial="my_army"
                    confirm-label="Challenge"
                    :processing="challenge.processing"
                    :error="challenge.errors.army"
                    @confirm="sendChallenge"
                />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Challenges for you</CardTitle>
                <CardDescription>
                    Players who want to face you on the battlefield.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p
                    v-if="received.length === 0"
                    class="text-sm text-muted-foreground"
                >
                    No open challenges. Why not send one?
                </p>
                <ul v-else class="divide-y">
                    <li
                        v-for="invitation in received"
                        :key="invitation.id"
                        class="flex flex-wrap items-center justify-between gap-3 py-3"
                        data-test="received-invitation"
                    >
                        <div class="min-w-0">
                            <p class="truncate font-medium">
                                {{ invitation.player.name }}
                                <span class="text-muted-foreground">
                                    @{{ invitation.player.username }}
                                </span>
                            </p>
                            <p
                                class="flex items-center gap-1 text-xs text-muted-foreground"
                            >
                                <Clock class="size-3" />
                                Sent {{ invitation.sent_at }} · expires
                                {{ invitation.expires_in }}
                            </p>
                        </div>
                        <div class="flex gap-2">
                            <Button size="sm" as-child>
                                <Link
                                    :href="
                                        InvitationController.accept(
                                            invitation.id,
                                        )
                                    "
                                    as="button"
                                    preserve-scroll
                                    data-test="accept-invitation-button"
                                >
                                    <Check />
                                    Accept
                                </Link>
                            </Button>
                            <Button size="sm" variant="outline" as-child>
                                <Link
                                    :href="
                                        InvitationController.decline(
                                            invitation.id,
                                        )
                                    "
                                    as="button"
                                    preserve-scroll
                                    data-test="decline-invitation-button"
                                >
                                    <X />
                                    Decline
                                </Link>
                            </Button>
                        </div>
                    </li>
                </ul>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Challenges you sent</CardTitle>
                <CardDescription>
                    Waiting for your opponents to answer.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p
                    v-if="sent.length === 0"
                    class="text-sm text-muted-foreground"
                >
                    You have no pending challenges.
                </p>
                <ul v-else class="divide-y">
                    <li
                        v-for="invitation in sent"
                        :key="invitation.id"
                        class="flex flex-wrap items-center justify-between gap-3 py-3"
                        data-test="sent-invitation"
                    >
                        <div class="min-w-0">
                            <p
                                v-if="invitation.player"
                                class="truncate font-medium"
                            >
                                {{ invitation.player.name }}
                                <span class="text-muted-foreground">
                                    @{{ invitation.player.username }}
                                </span>
                            </p>
                            <p
                                v-else
                                class="flex items-center gap-1 truncate font-medium"
                            >
                                <Mail class="size-4" />
                                {{ invitation.email }}
                            </p>
                            <p
                                class="flex items-center gap-1 text-xs text-muted-foreground"
                            >
                                <Clock class="size-3" />
                                Sent {{ invitation.sent_at }} · expires
                                {{ invitation.expires_in }}
                            </p>
                        </div>
                        <Button size="sm" variant="ghost" as-child>
                            <Link
                                :href="
                                    InvitationController.cancel(invitation.id)
                                "
                                as="button"
                                preserve-scroll
                                data-test="cancel-invitation-button"
                            >
                                <X />
                                Cancel
                            </Link>
                        </Button>
                    </li>
                </ul>
            </CardContent>
        </Card>
    </div>
</template>
