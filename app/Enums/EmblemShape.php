<?php

namespace App\Enums;

/**
 * The outline of a clan's emblem.
 */
enum EmblemShape: string
{
    case Shield = 'shield';
    case Round = 'round';
    case Banner = 'banner';
    case Hex = 'hex';

    /**
     * The shape's display name.
     */
    public function label(): string
    {
        return match ($this) {
            self::Shield => 'Shield',
            self::Round => 'Round',
            self::Banner => 'Banner',
            self::Hex => 'Hex',
        };
    }
}
