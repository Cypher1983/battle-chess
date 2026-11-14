<?php

namespace App\Chess;

/**
 * A legal move that has just been applied to a position.
 */
final readonly class PlayedMove
{
    public function __construct(
        public string $from,
        public string $to,
        public string $piece,
        public string $san,
        public string $fen,
        public ?string $promotion,
        public ?string $captured,
    ) {}
}
