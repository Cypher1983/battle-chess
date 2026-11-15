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
    case Lava = 'lava';
    case Ice = 'ice';
    case Ocean = 'ocean';

    /**
     * The board's display name.
     */
    public function label(): string
    {
        return match ($this) {
            self::Classic => 'Classic walnut',
            self::Marble => 'Marble',
            self::Tournament => 'Tournament green',
            self::Lava => 'Lava',
            self::Ice => 'Ice',
            self::Ocean => 'Ocean',
        };
    }
}
