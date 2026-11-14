<?php

namespace App\Actions\Games;

use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Enums\GameStatus;
use App\Models\Game;

class FinishGame
{
    /**
     * End a game with the given result.
     *
     * Call inside a transaction that has locked the game row.
     */
    public function __invoke(Game $game, GameResult $result, GameEndReason $reason): void
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
