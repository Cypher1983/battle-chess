<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Move;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    /**
     * Show a game board.
     */
    public function show(Request $request, Game $game): Response
    {
        Gate::authorize('view', $game);

        $game->load(['white', 'black', 'moves']);
        $lastMove = $game->moves->last();

        return Inertia::render('games/Show', [
            'game' => [
                'id' => $game->id,
                'fen' => $game->fen,
                'turn' => $game->turn()->value,
                'status' => $game->status->value,
                'result' => $game->result?->value,
                'end_reason' => $game->end_reason?->label(),
                'white' => $this->presentPlayer($game->white),
                'black' => $this->presentPlayer($game->black),
                'moves' => $game->moves->map(fn (Move $move) => [
                    'ply' => $move->ply,
                    'san' => $move->san,
                ]),
                'last_move' => $lastMove ? ['from' => $lastMove->from, 'to' => $lastMove->to] : null,
                'draw_offered_by' => $game->draw_offered_by_id === null
                    ? null
                    : ($game->draw_offered_by_id === $game->white_id ? 'w' : 'b'),
            ],
            'myColor' => $game->colorOf($request->user())?->value,
        ]);
    }

    /**
     * The public details of a player.
     *
     * @return array{name: string, username: string}
     */
    private function presentPlayer(User $user): array
    {
        return [
            'name' => $user->name,
            'username' => $user->username,
        ];
    }
}
