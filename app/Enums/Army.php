<?php

namespace App\Enums;

/**
 * The armies a player can command. Each player picks one; any army can
 * play either colour.
 */
enum Army: string
{
    case Clockwork = 'clockwork';
    case Wildwood = 'wildwood';
    case Ember = 'ember';
    case Frost = 'frost';
    case Tide = 'tide';
    case Swarm = 'swarm';
    case Kingdom = 'kingdom';
    case Sky = 'sky';

    /**
     * The army's display name.
     */
    public function label(): string
    {
        return match ($this) {
            self::Clockwork => 'Clockwork Legion',
            self::Wildwood => 'Wildwood Court',
            self::Ember => 'Ember Dynasty',
            self::Frost => 'Frost Covenant',
            self::Tide => 'Sunken Fleet',
            self::Swarm => 'Void Swarm',
            self::Kingdom => 'Human Kingdom',
            self::Sky => 'Sky Armada',
        };
    }
}
