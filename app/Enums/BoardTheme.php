<?php

namespace App\Enums;

/**
 * The boards a game can be played on. The challenger picks one and both
 * players see it.
 */
enum BoardTheme: string
{
    case Classic = 'classic';

    /**
     * The board's display name.
     */
    public function label(): string
    {
        return match ($this) {
            self::Classic => 'Classic walnut',
        };
    }
}
