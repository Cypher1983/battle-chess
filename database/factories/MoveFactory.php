<?php

namespace Database\Factories;

use App\Models\Game;
use App\Models\Move;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Move>
 */
class MoveFactory extends Factory
{
    /**
     * Define the model's default state: 1. e4 by white.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'game_id' => Game::factory(),
            'ply' => 1,
            'user_id' => User::factory(),
            'from' => 'e2',
            'to' => 'e4',
            'promotion' => null,
            'san' => 'e4',
            'fen' => 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        ];
    }
}
