<?php

namespace App\Http\Controllers;

use App\Models\Clan;
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

        $players = User::query()->ranked()
            ->when($user !== null, fn (Builder $query) => $query->with('clan'))
            ->paginate(self::PER_PAGE, ['id', 'name', 'username', 'rating', 'wins', 'losses', 'draws', 'clan_id'])
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
     * Rank clans by the average rating of members who have finished a game.
     *
     * Only signed-in players see how clans compare.
     */
    public function clans(Request $request): Response
    {
        $played = 'users.wins + users.losses + users.draws > 0';

        $clans = Clan::query()
            ->join('users', 'users.clan_id', '=', 'clans.id')
            ->select(['clans.id', 'clans.name', 'clans.tag', 'clans.emblem_shape', 'clans.emblem_icon', 'clans.emblem_primary', 'clans.emblem_secondary'])
            ->selectRaw('count(*) as members_count')
            ->selectRaw("avg(case when {$played} then users.rating end) as average_rating")
            ->selectRaw('sum(users.wins) as wins, sum(users.losses) as losses, sum(users.draws) as draws')
            ->groupBy(['clans.id', 'clans.name', 'clans.tag', 'clans.emblem_shape', 'clans.emblem_icon', 'clans.emblem_primary', 'clans.emblem_secondary'])
            ->havingRaw("sum(case when {$played} then 1 else 0 end) > 0")
            ->orderByDesc('average_rating')
            ->orderByDesc('wins')
            ->orderBy('clans.id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        $offset = ($clans->currentPage() - 1) * $clans->perPage();
        $myClanId = $request->user()->clan_id;

        return Inertia::render('ClanScoreboard', [
            'clans' => [
                'data' => collect($clans->items())->values()->map(fn (Clan $clan, int $index) => [
                    'rank' => $offset + $index + 1,
                    ...$clan->summary(),
                    'members' => (int) $clan->getAttribute('members_count'),
                    'rating' => (int) round((float) $clan->getAttribute('average_rating')),
                    'wins' => (int) $clan->getAttribute('wins'),
                    'losses' => (int) $clan->getAttribute('losses'),
                    'draws' => (int) $clan->getAttribute('draws'),
                    'is_mine' => $clan->id === $myClanId,
                ]),
                'current_page' => $clans->currentPage(),
                'last_page' => $clans->lastPage(),
                'prev_page_url' => $clans->previousPageUrl(),
                'next_page_url' => $clans->nextPageUrl(),
            ],
        ]);
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
     * Scoreboard details for a player, as signed-in players see them.
     *
     * @return array{name: string, username: string, clan: array<string, mixed>|null, rating: int, wins: int, losses: int, draws: int, games: int}
     */
    private function present(User $player): array
    {
        return [
            'name' => $player->name,
            'clan' => $player->clan?->summary(),
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
