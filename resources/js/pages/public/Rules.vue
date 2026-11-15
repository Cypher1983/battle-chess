<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import MoveDiagram from '@/components/chess/MoveDiagram.vue';
import { armies, pieceImage } from '@/lib/armies';
import type { PieceType } from '@/lib/armies';

/** The army used to illustrate the rules. */
const army = armies.clockwork;

const pieces: { type: PieceType; role: string; moves: string }[] = [
    {
        type: 'k',
        role: 'King',
        moves: 'One square in any direction. Lose your king to checkmate and you lose the battle, so keep it out of danger.',
    },
    {
        type: 'q',
        role: 'Queen',
        moves: 'Any number of squares in a straight line: across, up and down, or diagonally. Your strongest piece.',
    },
    {
        type: 'r',
        role: 'Rook',
        moves: 'Any number of squares across or up and down.',
    },
    {
        type: 'b',
        role: 'Bishop',
        moves: 'Any number of squares diagonally, so it always stays on squares of one colour.',
    },
    {
        type: 'n',
        role: 'Knight',
        moves: 'In an L: two squares one way, then one square to the side. The only piece that jumps over others.',
    },
    {
        type: 'p',
        role: 'Pawn',
        moves: 'One square forward, or two from its starting square. It captures one square diagonally forward (the rings).',
    },
];

const specialMoves = [
    {
        name: 'Castling',
        text: 'Move the king two squares towards a rook, and the rook jumps to the other side of it. Allowed only if neither piece has moved, the squares between are empty, and the king is not in check, crossing an attacked square or landing in check.',
    },
    {
        name: 'En passant',
        text: 'When a pawn moves two squares and lands beside one of your pawns, your pawn may capture it as if it had moved only one square. You must do it straight away, on your next move.',
    },
    {
        name: 'Promotion',
        text: 'A pawn that reaches the far side of the board becomes a queen, rook, bishop or knight of your choice. The game asks which one.',
    },
];
</script>

<template>
    <Head title="Rules" />

    <div class="mx-auto w-full max-w-5xl space-y-14 px-4 py-12">
        <header class="max-w-2xl space-y-3">
            <p
                class="text-xs font-semibold tracking-[0.3em] text-primary uppercase"
            >
                How to play
            </p>
            <h1 class="text-4xl font-bold">Rules of battle</h1>
            <p class="text-muted-foreground">
                Battle Chess is standard chess. White moves first and players
                take turns. Checkmate the enemy king to win. Every army moves
                the same way; the examples below use the
                {{ army.name }}.
            </p>
        </header>

        <section id="pieces" class="space-y-6">
            <h2 class="text-2xl font-semibold">How the pieces move</h2>
            <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <article
                    v-for="piece in pieces"
                    :key="piece.type"
                    class="flex flex-col gap-4 rounded-xl border bg-card/90 p-5 shadow-[inset_0_1px_0_0_var(--card-edge)]"
                    data-test="rules-piece"
                >
                    <MoveDiagram
                        :type="piece.type"
                        :image="pieceImage(army.id, piece.type)"
                    />
                    <div>
                        <h3 class="text-lg font-semibold">{{ piece.role }}</h3>
                        <p class="mb-2 text-xs text-muted-foreground">
                            {{ army.pieces[piece.type] }}
                        </p>
                        <p class="text-sm text-muted-foreground">
                            {{ piece.moves }}
                        </p>
                    </div>
                </article>
            </div>
        </section>

        <section id="special-moves" class="space-y-6">
            <h2 class="text-2xl font-semibold">Special moves</h2>
            <dl class="grid gap-5 md:grid-cols-3">
                <div
                    v-for="move in specialMoves"
                    :key="move.name"
                    class="rounded-xl border bg-card/90 p-5"
                >
                    <dt class="mb-2 font-display text-lg font-semibold">
                        {{ move.name }}
                    </dt>
                    <dd class="text-sm text-muted-foreground">
                        {{ move.text }}
                    </dd>
                </div>
            </dl>
        </section>

        <section id="game-end" class="space-y-6">
            <h2 class="text-2xl font-semibold">How a battle ends</h2>
            <div class="grid gap-5 md:grid-cols-2">
                <div class="rounded-xl border bg-card/90 p-5">
                    <h3 class="mb-3 text-lg font-semibold text-primary">
                        Victory
                    </h3>
                    <ul
                        class="list-disc space-y-2 pl-5 text-sm text-muted-foreground"
                    >
                        <li>
                            <strong class="text-foreground">Checkmate:</strong>
                            the enemy king is attacked (in check) and has no way
                            to escape.
                        </li>
                        <li>
                            <strong class="text-foreground"
                                >Resignation:</strong
                            >
                            your opponent gives up.
                        </li>
                        <li>
                            <strong class="text-foreground"
                                >Missed deadline:</strong
                            >
                            your opponent ran out of time to move and you
                            claimed the win.
                        </li>
                    </ul>
                </div>
                <div class="rounded-xl border bg-card/90 p-5">
                    <h3 class="mb-3 text-lg font-semibold">Draw</h3>
                    <ul
                        class="list-disc space-y-2 pl-5 text-sm text-muted-foreground"
                    >
                        <li>
                            <strong class="text-foreground">Stalemate:</strong>
                            the player to move has no legal move but is not in
                            check.
                        </li>
                        <li>
                            <strong class="text-foreground"
                                >Insufficient material:</strong
                            >
                            neither side has enough pieces left to checkmate.
                        </li>
                        <li>
                            <strong class="text-foreground"
                                >Threefold repetition:</strong
                            >
                            the same position appears three times.
                        </li>
                        <li>
                            <strong class="text-foreground"
                                >Fifty-move rule:</strong
                            >
                            fifty moves each without a capture or a pawn move.
                        </li>
                        <li>
                            <strong class="text-foreground">Agreement:</strong>
                            one player offers a draw and the other accepts.
                        </li>
                    </ul>
                    <p class="mt-3 text-xs text-muted-foreground">
                        The game spots stalemate, insufficient material,
                        repetition and the fifty-move rule for you.
                    </p>
                </div>
            </div>
        </section>
    </div>
</template>
