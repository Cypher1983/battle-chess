<?php

namespace App\Enums;

/**
 * The boards a game can be played on. The challenger picks one and both
 * players see it.
 */
enum BoardTheme: string
{
    case Classic = 'classic';
    case Marble = 'marble';
    case Tournament = 'tournament';

    /**
     * The board's display name.
     */
    public function label(): string
    {
        return match ($this) {
            self::Classic => 'Classic walnut',
            self::Marble => 'Marble',
            self::Tournament => 'Tournament green',
        };
    }
}
