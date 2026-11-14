<?php

namespace App\Chess;

use App\Enums\GameResult;

/**
 * Standard Elo rating updates.
 *
 * Changes are zero-sum: whatever white gains, black loses, and vice versa.
 */
final class EloCalculator
{
    /**
     * How strongly a single game moves a rating.
     */
    public const K_FACTOR = 32;

    /**
     * Ratings never drop below this floor.
     */
    public const MINIMUM_RATING = 100;

    /**
     * White's expected score (0 to 1) against black.
     */
    public function expectedScore(int $whiteRating, int $blackRating): float
    {
        return 1 / (1 + 10 ** (($blackRating - $whiteRating) / 400));
    }

    /**
     * The rating change for white; black's change is the negation.
     */
    public function whiteChange(int $whiteRating, int $blackRating, GameResult $result): int
    {
        $score = match ($result) {
            GameResult::WhiteWins => 1.0,
            GameResult::BlackWins => 0.0,
            GameResult::Draw => 0.5,
        };

        $change = (int) round(self::K_FACTOR * ($score - $this->expectedScore($whiteRating, $blackRating)));

        // Keep both players above the floor while staying zero-sum.
        $change = max($change, self::MINIMUM_RATING - $whiteRating);

        return min($change, $blackRating - self::MINIMUM_RATING);
    }
}
