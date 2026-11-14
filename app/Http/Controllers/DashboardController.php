<?php

namespace App\Http\Controllers;

use App\Models\Game;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the player's rating, record and games needing attention.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $activeGames = Game::involving($user)->active()->get(['id', 'white_id', 'black_id', 'fen', 'status']);

        return Inertia::render('Dashboard', [
            'stats' => [
                'rating' => $user->rating,
                'wins' => $user->wins,
                'losses' => $user->losses,
                'draws' => $user->draws,
                'active_games' => $activeGames->count(),
                'your_turn' => $activeGames->filter(fn (Game $game) => $game->isTurnOf($user))->count(),
            ],
        ]);
    }
}
