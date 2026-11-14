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
}
