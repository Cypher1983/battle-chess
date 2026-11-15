<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScoreboardController extends Controller
{
    /**
     * Players listed per page.
     */
    private const PER_PAGE = 25;

    /**
     * Show the ranked leaderboard of everyone who has finished a game.
     *
     * Guests get the public version, which shows usernames only.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $players = $this->ranked()
            ->paginate(self::PER_PAGE, ['id', 'name', 'username', 'rating', 'wins', 'losses', 'draws'])
            ->withQueryString();

        $offset = ($players->currentPage() - 1) * $players->perPage();

        $ranked = collect($players->items())->values()->map(fn (User $player, int $index) => $user === null
            ? [
                'rank' => $offset + $index + 1,
                ...$this->presentPublicly($player),
            ]
            : [
                'rank' => $offset + $index + 1,
                ...$this->present($player),
                'is_me' => $player->id === $user->id,
            ]);

        $page = [
            'data' => $ranked,
            'current_page' => $players->currentPage(),
            'last_page' => $players->lastPage(),
            'prev_page_url' => $players->previousPageUrl(),
            'next_page_url' => $players->nextPageUrl(),
        ];

        if ($user === null) {
            return Inertia::render('public/Scoreboard', ['players' => $page]);
        }

        return Inertia::render('Scoreboard', [
            'players' => $page,
            'me' => [
                'rank' => $this->rankOf($user),
                ...$this->present($user),
            ],
        ]);
    }

    /**
     * Players with at least one finished game, best first.
     *
     * @return Builder<User>
     */
    private function ranked(): Builder
    {
        return User::query()
            ->whereRaw('wins + losses + draws > 0')
            ->orderByDesc('rating')
            ->orderByDesc('wins')
            ->orderBy('id');
    }

    /**
     * The user's position on the scoreboard, or null before their first finished game.
     */
    private function rankOf(User $user): ?int
    {
        if ($user->wins + $user->losses + $user->draws === 0) {
            return null;
        }

        $ahead = User::query()
            ->whereRaw('wins + losses + draws > 0')
            ->where(fn (Builder $query) => $query
                ->where('rating', '>', $user->rating)
                ->orWhere(fn (Builder $query) => $query
                    ->where('rating', $user->rating)
                    ->where('wins', '>', $user->wins))
                ->orWhere(fn (Builder $query) => $query
                    ->where('rating', $user->rating)
                    ->where('wins', $user->wins)
                    ->where('id', '<', $user->id)))
            ->count();

        return $ahead + 1;
    }

    /**
     * Public scoreboard details for a player.
     *
     * @return array{name: string, username: string, rating: int, wins: int, losses: int, draws: int, games: int}
     */
    private function present(User $player): array
    {
        return [
            'name' => $player->name,
            'username' => $player->username,
            'rating' => $player->rating,
            'wins' => $player->wins,
            'losses' => $player->losses,
            'draws' => $player->draws,
            'games' => $player->wins + $player->losses + $player->draws,
        ];
    }

    /**
     * Scoreboard details safe to show to guests: no real names.
     *
     * @return array{username: string, rating: int, wins: int, losses: int, draws: int, games: int}
     */
    private function presentPublicly(User $player): array
    {
        return [
            'username' => $player->username,
            'rating' => $player->rating,
            'wins' => $player->wins,
            'losses' => $player->losses,
            'draws' => $player->draws,
            'games' => $player->wins + $player->losses + $player->draws,
        ];
    }
}
