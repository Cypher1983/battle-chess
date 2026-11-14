<?php

namespace App\Enums;

enum GameResult: string
{
    case WhiteWins = '1-0';
    case BlackWins = '0-1';
    case Draw = '1/2-1/2';

    /**
     * The result in which the given colour wins.
     */
    public static function winFor(PieceColor $color): self
    {
        return $color === PieceColor::White ? self::WhiteWins : self::BlackWins;
    }
}
