<?php

namespace App\Actions\Games;

use App\Chess\ChessEngine;
use App\Enums\GameStatus;
use App\Events\GameUpdated;
use App\Models\Game;
use App\Models\Move;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MakeMove
{
    /**
     * Validate and apply a move, ending the game if the rules say so.
     *
     * @throws ValidationException when it is not the player's turn or the move is illegal.
     */
    public function __invoke(Game $game, User $player, string $from, string $to, ?string $promotion = null): Move
    {
        return DB::transaction(function () use ($game, $player, $from, $to, $promotion) {
            $game = Game::query()->lockForUpdate()->findOrFail($game->id);

            if (! $game->isTurnOf($player)) {
                throw ValidationException::withMessages(['move' => __('It is not your turn.')]);
            }

            $history = $game->moves()->pluck('san');
            $engine = ChessEngine::replay($history);
            $played = $engine->play($from, $to, $promotion);

            if ($played === null) {
                throw ValidationException::withMessages(['move' => __('That move is not allowed.')]);
            }

            $move = $game->moves()->create([
                'ply' => $history->count() + 1,
                'user_id' => $player->id,
                'from' => $played->from,
                'to' => $played->to,
                'promotion' => $played->promotion,
                'san' => $played->san,
                'fen' => $played->fen,
            ]);

            $outcome = $engine->outcome();

            $game->update([
                'fen' => $played->fen,
                'last_move_at' => now(),
                'draw_offered_by_id' => null,
                ...($outcome === null ? [] : [
                    'status' => GameStatus::Finished,
                    'result' => $outcome->result,
                    'end_reason' => $outcome->reason,
                    'finished_at' => now(),
                ]),
            ]);

            GameUpdated::dispatch($game);

            return $move;
        });
    }
}
