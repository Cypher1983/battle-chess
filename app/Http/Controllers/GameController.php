<?php

namespace App\Http\Controllers;

use App\Enums\GameResult;
use App\Enums\GameStatus;
use App\Enums\PieceColor;
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
     * List the player's active and recently finished games.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $active = Game::involving($user)
            ->active()
            ->with(['white', 'black'])
            ->withCount('moves')
            ->latest('id')
            ->get()
            ->map(fn (Game $game) => [
                ...$this->presentSummary($game, $user),
                'your_turn' => $game->isTurnOf($user),
                'move_count' => $game->moves_count,
            ])
            ->sortByDesc('your_turn')
            ->values();

        $finished = Game::involving($user)
            ->where('status', GameStatus::Finished)
            ->with(['white', 'black'])
            ->latest('finished_at')
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(fn (Game $game) => [
                ...$this->presentSummary($game, $user),
                'outcome' => $this->outcomeFor($game, $user),
                'end_reason' => $game->end_reason?->label(),
                'finished_at' => $game->finished_at?->diffForHumans(),
            ]);

        return Inertia::render('Play', [
            'active' => $active,
            'finished' => $finished,
        ]);
    }

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
                'armies' => [
                    'w' => $game->white_army->value,
                    'b' => $game->black_army->value,
                ],
                'board_theme' => $game->board_theme->value,
                'status' => $game->status->value,
                'result' => $game->result?->value,
                'end_reason' => $game->end_reason?->label(),
                'white' => $this->presentContender($game->white, $game->white_rating_before, $game->white_rating_change),
                'black' => $this->presentContender($game->black, $game->black_rating_before, $game->black_rating_change),
                'moves' => $game->moves->map(fn (Move $move) => [
                    'ply' => $move->ply,
                    'san' => $move->san,
                ]),
                'last_move' => $lastMove ? [
                    'ply' => $lastMove->ply,
                    'from' => $lastMove->from,
                    'to' => $lastMove->to,
                    'color' => $lastMove->ply % 2 === 1 ? 'w' : 'b',
                    'piece' => $lastMove->piece,
                    'captured' => $lastMove->captured,
                ] : null,
                'move_deadline' => $game->isActive() ? $game->moveDeadline()->toIso8601String() : null,
                'draw_offered_by' => $game->draw_offered_by_id === null
                    ? null
                    : ($game->draw_offered_by_id === $game->white_id ? 'w' : 'b'),
            ],
            'myColor' => $game->colorOf($request->user())?->value,
        ]);
    }

    /**
     * A player in a game with their rating: the result of this game once
     * it is finished, otherwise their current rating.
     *
     * @return array{name: string, username: string, rating: int, rating_change: int|null}
     */
    private function presentContender(User $user, ?int $ratingBefore, ?int $ratingChange): array
    {
        return [
            ...$this->presentPlayer($user),
            'rating' => $ratingBefore !== null && $ratingChange !== null
                ? $ratingBefore + $ratingChange
                : $user->rating,
            'rating_change' => $ratingChange,
        ];
    }

    /**
     * The fields shared by every game summary in the list.
     *
     * @return array{id: int, my_color: string, my_army: string, opponent: array{name: string, username: string}}
     */
    private function presentSummary(Game $game, User $user): array
    {
        $color = $game->colorOf($user) ?? PieceColor::White;

        return [
            'id' => $game->id,
            'my_color' => $color->value,
            'my_army' => ($color === PieceColor::White ? $game->white_army : $game->black_army)->value,
            'opponent' => $this->presentPlayer($color === PieceColor::White ? $game->black : $game->white),
        ];
    }

    /**
     * Whether the finished game was a win, loss or draw for the user.
     */
    private function outcomeFor(Game $game, User $user): string
    {
        if ($game->result === GameResult::Draw || $game->result === null) {
            return 'draw';
        }

        return $game->result === GameResult::winFor($game->colorOf($user) ?? PieceColor::White) ? 'win' : 'loss';
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
