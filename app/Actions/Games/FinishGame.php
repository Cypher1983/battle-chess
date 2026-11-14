<?php

namespace App\Actions\Games;

use App\Chess\EloCalculator;
use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Enums\GameStatus;
use App\Models\Game;
use App\Models\User;

class FinishGame
{
    public function __construct(private readonly EloCalculator $elo) {}

    /**
     * End a game with the given result and update both players' ratings and records.
     *
     * Call inside a transaction that has locked the game row.
     */
    public function __invoke(Game $game, GameResult $result, GameEndReason $reason): void
    {
        // Lock both players in id order so concurrent finishes cannot deadlock.
        $players = User::query()
            ->whereIn('id', [$game->white_id, $game->black_id])
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        $white = $players->get($game->white_id);
        $black = $players->get($game->black_id);

        if ($white === null || $black === null) {
            throw new \RuntimeException("Game {$game->id} is missing a player.");
        }

        $change = $this->elo->whiteChange($white->rating, $black->rating, $result);

        $game->update([
            'status' => GameStatus::Finished,
            'result' => $result,
            'end_reason' => $reason,
            'draw_offered_by_id' => null,
            'finished_at' => now(),
            'white_rating_before' => $white->rating,
            'black_rating_before' => $black->rating,
            'white_rating_change' => $change,
            'black_rating_change' => -$change,
        ]);

        $this->record($white, $change, match ($result) {
            GameResult::WhiteWins => 'wins',
            GameResult::BlackWins => 'losses',
            GameResult::Draw => 'draws',
        });

        $this->record($black, -$change, match ($result) {
            GameResult::WhiteWins => 'losses',
            GameResult::BlackWins => 'wins',
            GameResult::Draw => 'draws',
        });
    }

    /**
     * Apply a rating change and count the result for a player.
     *
     * @param  'wins'|'losses'|'draws'  $column
     */
    private function record(User $player, int $ratingChange, string $column): void
    {
        $player->forceFill([
            'rating' => $player->rating + $ratingChange,
            $column => $player->{$column} + 1,
        ])->save();
    }
}
