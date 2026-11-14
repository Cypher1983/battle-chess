<?php

namespace App\Enums;

enum PieceColor: string
{
    case White = 'w';
    case Black = 'b';

    /**
     * The other side.
     */
    public function opposite(): self
    {
        return $this === self::White ? self::Black : self::White;
    }

    /**
     * The army that plays this colour.
     */
    public function army(): string
    {
        return $this === self::White ? 'Clockwork Legion' : 'Wildwood Court';
    }
}
