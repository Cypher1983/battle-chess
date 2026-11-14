<?php

namespace Database\Factories;

use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Enums\GameStatus;
use App\Models\Game;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Game>
 */
class GameFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'white_id' => User::factory(),
            'black_id' => User::factory(),
            'invitation_id' => null,
            'fen' => Game::START_FEN,
            'status' => GameStatus::Active,
        ];
    }

    /**
     * A game that has ended.
     */
    public function finished(GameResult $result = GameResult::WhiteWins, GameEndReason $reason = GameEndReason::Checkmate): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => GameStatus::Finished,
            'result' => $result,
            'end_reason' => $reason,
            'finished_at' => now(),
        ]);
    }

    /**
     * A game starting from the given position.
     */
    public function atPosition(string $fen): static
    {
        return $this->state(fn (array $attributes) => ['fen' => $fen]);
    }
}
