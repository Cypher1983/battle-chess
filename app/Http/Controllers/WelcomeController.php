<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    /**
     * Players shown in the landing page leaderboard.
     */
    private const LEADERS = 5;

    /**
     * Show the landing page with the current top players, by username only.
     */
    public function __invoke(): Response
    {
        $leaders = User::query()->ranked()
            ->limit(self::LEADERS)
            ->get(['id', 'username', 'rating', 'wins', 'losses', 'draws'])
            ->values()
            ->map(fn (User $player, int $index) => [
                'rank' => $index + 1,
                'username' => $player->username,
                'rating' => $player->rating,
                'wins' => $player->wins,
                'losses' => $player->losses,
                'draws' => $player->draws,
                'games' => $player->wins + $player->losses + $player->draws,
            ]);

        return Inertia::render('Welcome', ['leaders' => $leaders]);
    }
}
