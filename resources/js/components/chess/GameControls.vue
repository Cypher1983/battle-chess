<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { Clock, Flag, Handshake, Trophy } from '@lucide/vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import GameActionController from '@/actions/App/Http/Controllers/GameActionController';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { PieceColor } from '@/lib/armies';

const props = defineProps<{
    gameId: number;
    myColor: PieceColor;
    turn: PieceColor;
    moveDeadline: string | null;
    drawOfferedBy: PieceColor | null;
}>();

// Re-check the deadline periodically so the claim button appears without a reload.
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => (timer = setInterval(() => (now.value = Date.now()), 30_000)));
onBeforeUnmount(() => clearInterval(timer));

const deadline = computed(() =>
    props.moveDeadline ? new Date(props.moveDeadline) : null,
);
const myTurn = computed(() => props.turn === props.myColor);
const deadlineLabel = computed(() =>
    deadline.value?.toLocaleString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }),
);
const canClaim = computed(
    () =>
        !myTurn.value &&
        deadline.value !== null &&
        deadline.value.getTime() <= now.value,
);

const iOffered = computed(() => props.drawOfferedBy === props.myColor);
const opponentOffered = computed(
    () => props.drawOfferedBy !== null && !iOffered.value,
);

function confirmResign(): boolean {
    return window.confirm('Resign this game? Your opponent will win.');
}
</script>

<template>
    <Card>
        <CardContent class="flex flex-col gap-3">
            <p
                v-if="deadlineLabel"
                class="flex items-center gap-1.5 text-sm text-muted-foreground"
                data-test="move-deadline"
            >
                <Clock class="size-4" />
                {{ myTurn ? 'You must move by' : 'Your opponent must move by' }}
                {{ deadlineLabel }}
            </p>

            <Button v-if="canClaim" size="sm" as-child>
                <Link
                    :href="GameActionController.claimTimeout(gameId)"
                    as="button"
                    preserve-scroll
                    data-test="claim-timeout-button"
                >
                    <Trophy />
                    Claim victory (deadline missed)
                </Link>
            </Button>

            <div
                v-if="opponentOffered"
                class="flex flex-col gap-2 rounded-lg border border-amber-400/60 bg-amber-50 p-3 text-sm dark:bg-amber-950/30"
                data-test="draw-offer"
            >
                <p class="font-medium">Your opponent offers a draw.</p>
                <div class="flex gap-2">
                    <Button size="sm" as-child>
                        <Link
                            :href="GameActionController.acceptDraw(gameId)"
                            as="button"
                            preserve-scroll
                            data-test="accept-draw-button"
                        >
                            Accept
                        </Link>
                    </Button>
                    <Button size="sm" variant="outline" as-child>
                        <Link
                            :href="GameActionController.declineDraw(gameId)"
                            as="button"
                            preserve-scroll
                            data-test="decline-draw-button"
                        >
                            Decline
                        </Link>
                    </Button>
                </div>
            </div>

            <div class="flex gap-2">
                <Button
                    v-if="!opponentOffered"
                    variant="outline"
                    size="sm"
                    class="flex-1"
                    :disabled="iOffered"
                    as-child
                >
                    <Link
                        :href="GameActionController.offerDraw(gameId)"
                        as="button"
                        preserve-scroll
                        :disabled="iOffered"
                        data-test="offer-draw-button"
                    >
                        <Handshake />
                        {{ iOffered ? 'Draw offered' : 'Offer draw' }}
                    </Link>
                </Button>
                <Button variant="destructive" size="sm" class="flex-1" as-child>
                    <Link
                        :href="GameActionController.resign(gameId)"
                        as="button"
                        preserve-scroll
                        data-test="resign-button"
                        :on-before="confirmResign"
                    >
                        <Flag />
                        Resign
                    </Link>
                </Button>
            </div>
        </CardContent>
    </Card>
</template>
