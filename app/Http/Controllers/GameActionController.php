<?php

namespace App\Http\Controllers;

use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Enums\GameStatus;
use App\Enums\PieceColor;
use App\Events\GameUpdated;
use App\Models\Game;
use App\Models\User;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class GameActionController extends Controller
{
    /**
     * Concede the game to the opponent.
     */
    public function resign(Request $request, Game $game): RedirectResponse
    {
        return $this->act($request, $game, function (Game $game, PieceColor $color) {
            $this->finish($game, GameResult::winFor($color->opposite()), GameEndReason::Resignation);

            return 'You resigned.';
        });
    }

    /**
     * Offer a draw, or accept one if the opponent already offered.
     */
    public function offerDraw(Request $request, Game $game): RedirectResponse
    {
        return $this->act($request, $game, function (Game $game, PieceColor $color, User $user) {
            if ($this->opponentOffered($game, $user)) {
                $this->finish($game, GameResult::Draw, GameEndReason::DrawAgreed);

                return 'Draw agreed.';
            }

            $game->update(['draw_offered_by_id' => $user->id]);

            return 'Draw offered.';
        });
    }

    /**
     * Accept the opponent's draw offer.
     */
    public function acceptDraw(Request $request, Game $game): RedirectResponse
    {
        return $this->act($request, $game, function (Game $game, PieceColor $color, User $user) {
            if (! $this->opponentOffered($game, $user)) {
                return null;
            }

            $this->finish($game, GameResult::Draw, GameEndReason::DrawAgreed);

            return 'Draw agreed.';
        });
    }

    /**
     * Decline the opponent's draw offer.
     */
    public function declineDraw(Request $request, Game $game): RedirectResponse
    {
        return $this->act($request, $game, function (Game $game, PieceColor $color, User $user) {
            if (! $this->opponentOffered($game, $user)) {
                return null;
            }

            $game->update(['draw_offered_by_id' => null]);

            return 'Draw declined.';
        });
    }

    /**
     * Run a game action on a locked, active game for one of its players.
     *
     * The action returns an untranslated success message, or null if it does not apply.
     *
     * @param  Closure(Game, PieceColor, User): ?string  $action
     */
    private function act(Request $request, Game $game, Closure $action): RedirectResponse
    {
        Gate::authorize('view', $game);

        $user = $request->user();

        $message = DB::transaction(function () use ($game, $user, $action) {
            $game = Game::query()->lockForUpdate()->findOrFail($game->id);
            $color = $game->colorOf($user);

            if (! $game->isActive() || $color === null) {
                return null;
            }

            $message = $action($game, $color, $user);

            if ($message !== null) {
                GameUpdated::dispatch($game);
            }

            return $message;
        });

        Inertia::flash('toast', $message === null
            ? ['type' => 'error', 'message' => __('That is not possible right now.')]
            : ['type' => 'success', 'message' => __($message)]);

        return to_route('games.show', $game);
    }

    /**
     * Whether the other player has a draw offer on the table.
     */
    private function opponentOffered(Game $game, User $user): bool
    {
        return $game->draw_offered_by_id !== null && $game->draw_offered_by_id !== $user->id;
    }

    /**
     * End the game with the given result.
     */
    private function finish(Game $game, GameResult $result, GameEndReason $reason): void
    {
        $game->update([
            'status' => GameStatus::Finished,
            'result' => $result,
            'end_reason' => $reason,
            'draw_offered_by_id' => null,
            'finished_at' => now(),
        ]);
    }
}
