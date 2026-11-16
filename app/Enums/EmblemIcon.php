<?php

namespace App\Enums;

/**
 * The charge drawn in the middle of a clan's emblem.
 */
enum EmblemIcon: string
{
    case Crown = 'crown';
    case Sword = 'sword';
    case Tower = 'tower';
    case Wolf = 'wolf';
    case Gear = 'gear';
    case Tree = 'tree';
    case Flame = 'flame';
    case Star = 'star';
    case Moon = 'moon';
    case Skull = 'skull';

    /**
     * The icon's display name.
     */
    public function label(): string
    {
        return match ($this) {
            self::Crown => 'Crown',
            self::Sword => 'Sword',
            self::Tower => 'Tower',
            self::Wolf => 'Wolf',
            self::Gear => 'Gear',
            self::Tree => 'Tree',
            self::Flame => 'Flame',
            self::Star => 'Star',
            self::Moon => 'Moon',
            self::Skull => 'Skull',
        };
    }
}
