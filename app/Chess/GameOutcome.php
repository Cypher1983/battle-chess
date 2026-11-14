<?php

namespace App\Chess;

use App\Enums\GameEndReason;
use App\Enums\GameResult;

/**
 * How and why a game ended.
 */
final readonly class GameOutcome
{
    public function __construct(
        public GameResult $result,
        public GameEndReason $reason,
    ) {}
}
