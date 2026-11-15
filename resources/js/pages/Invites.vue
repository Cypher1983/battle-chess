<script setup lang="ts">
import { Head, Link, useForm } from '@inertiajs/vue3';
import { Check, Clock, Mail, Swords, X } from '@lucide/vue';
import { computed, ref } from 'vue';
import InvitationController from '@/actions/App/Http/Controllers/InvitationController';
import ArmyPickerDialog from '@/components/chess/ArmyPickerDialog.vue';
import BoardThemeChoices from '@/components/chess/BoardThemeChoices.vue';
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
import { armies } from '@/lib/armies';
import type { ArmyId } from '@/lib/armies';
import { boardThemes } from '@/lib/boardThemes';
import type { BoardThemeId } from '@/lib/boardThemes';
import { invites } from '@/routes';

type Player = {
    name: string;
    username: string;
};

type ReceivedInvitation = {
    id: number;
    /** The army the challenger brings. */
    army: ArmyId;
    /** The board the challenger picked. */
    board_theme: BoardThemeId;
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

const challenge = useForm({
    recipient: '',
    army: props.my_army,
    board_theme: 'classic' as BoardThemeId,
});
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

const acceptance = useForm({ army: props.my_army });
const accepting = ref<ReceivedInvitation | null>(null);
const pickingAcceptArmy = computed({
    get: () => accepting.value !== null,
    set: (open: boolean) => {
        if (!open) {
            accepting.value = null;
        }
    },
});

/** Ask which army to bring before accepting the challenge. */
function chooseAcceptArmy(invitation: ReceivedInvitation): void {
    acceptance.clearErrors();
    accepting.value = invitation;
}

function acceptChallenge(army: ArmyId): void {
    if (!accepting.value) {
        return;
    }

    acceptance.army = army;
    acceptance.post(InvitationController.accept.url(accepting.value.id), {
        preserveScroll: true,
        onSuccess: () => (accepting.value = null),
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
                    :error="
                        challenge.errors.army ?? challenge.errors.board_theme
                    "
                    @confirm="sendChallenge"
                >
                    <BoardThemeChoices v-model="challenge.board_theme" />
                </ArmyPickerDialog>
            </CardContent>
        </Card>

        <Card
            :class="
                received.length > 0 &&
                'border-primary/50 shadow-[0_0_24px_-12px_var(--primary)]'
            "
        >
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    Challenges for you
                    <span
                        v-if="received.length > 0"
                        class="rounded-full bg-primary px-2 py-0.5 font-sans text-xs font-semibold text-primary-foreground"
                    >
                        {{ received.length }}
                    </span>
                </CardTitle>
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
                            <p
                                class="text-xs text-muted-foreground"
                                data-test="challenger-army"
                            >
                                Leads the {{ armies[invitation.army].name }}
                            </p>
                        </div>
                        <div class="flex gap-2">
                            <Button
                                size="sm"
                                data-test="accept-invitation-button"
                                @click="chooseAcceptArmy(invitation)"
                            >
                                <Check />
                                Accept
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

                <ArmyPickerDialog
                    v-model:open="pickingAcceptArmy"
                    title="Choose your army"
                    :description="
                        accepting
                            ? `${accepting.player.name} leads the ${armies[accepting.army].name} on the ${boardThemes[accepting.board_theme].name} board. Pick the army you bring against them.`
                            : ''
                    "
                    :initial="my_army"
                    :opponent="accepting?.army ?? null"
                    confirm-label="Accept"
                    :processing="acceptance.processing"
                    :error="acceptance.errors.army"
                    @confirm="acceptChallenge"
                />
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
