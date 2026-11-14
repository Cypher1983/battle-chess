<?php

namespace App\Enums;

enum GameEndReason: string
{
    case Checkmate = 'checkmate';
    case Resignation = 'resignation';
    case Stalemate = 'stalemate';
    case DrawAgreed = 'draw_agreed';
    case InsufficientMaterial = 'insufficient_material';
    case ThreefoldRepetition = 'threefold_repetition';
    case FiftyMoveRule = 'fifty_move_rule';

    /**
     * A human-readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Checkmate => __('Checkmate'),
            self::Resignation => __('Resignation'),
            self::Stalemate => __('Stalemate'),
            self::DrawAgreed => __('Draw agreed'),
            self::InsufficientMaterial => __('Insufficient material'),
            self::ThreefoldRepetition => __('Threefold repetition'),
            self::FiftyMoveRule => __('Fifty-move rule'),
        };
    }
}
