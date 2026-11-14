<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { Flag, Handshake } from '@lucide/vue';
import { computed } from 'vue';
import GameActionController from '@/actions/App/Http/Controllers/GameActionController';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { PieceColor } from '@/lib/armies';

const props = defineProps<{
    gameId: number;
    myColor: PieceColor;
    drawOfferedBy: PieceColor | null;
}>();

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
