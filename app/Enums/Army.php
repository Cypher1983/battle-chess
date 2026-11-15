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
    case Sun = 'sun';
    case Shadow = 'shadow';
    case Mechs = 'mechs';
    case Greek = 'greek';
    case Viking = 'viking';
    case Zombie = 'zombie';

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
            self::Sun => 'Sun Pharaohs',
            self::Shadow => 'Night Spirits',
            self::Mechs => 'Star Mechs',
            self::Greek => 'Greek Polis',
            self::Viking => 'Viking Clans',
            self::Zombie => 'Zombie Horde',
        };
    }
}
