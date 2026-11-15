export type PieceColor = 'w' | 'b';
export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';

/** The armies players can command (matches the server's Army enum). */
export type ArmyId =
    | 'clockwork'
    | 'wildwood'
    | 'ember'
    | 'frost'
    | 'tide'
    | 'swarm'
    | 'kingdom'
    | 'sky'
    | 'sun'
    | 'shadow'
    | 'mechs'
    | 'greek';

/** Which army plays each colour in a game. */
export type GameArmies = Record<PieceColor, ArmyId>;

export type Army = {
    id: ArmyId;
    name: string;
    /** One line of flavour for the army picker. */
    tagline: string;
    pieces: Record<PieceType, string>;
    /** Effect colours (sparks, debris) for battle scenes. */
    palette: number[];
};

export const armies: Record<ArmyId, Army> = {
    clockwork: {
        id: 'clockwork',
        name: 'Clockwork Legion',
        tagline: 'Brass automatons that march to the tick of the Regulator.',
        pieces: {
            k: 'The Regulator',
            q: 'Arc Duchess',
            r: 'Bulwark Engine',
            b: 'Gearwright',
            n: 'Cog Charger',
            p: 'Tick Soldier',
        },
        palette: [0xffd75e, 0xfff1b8, 0x7fd4ff, 0xc9952b],
    },
    wildwood: {
        id: 'wildwood',
        name: 'Wildwood Court',
        tagline: 'The living forest, rooted, thorned and slow to forgive.',
        pieces: {
            k: 'The Elder Stag',
            q: 'The Thornmother',
            r: 'Old Bark',
            b: 'Moss Oracle',
            n: 'Briar Wolf',
            p: 'Sproutling',
        },
        palette: [0x3f8f3a, 0x8fcf6a, 0x6b4a2b, 0xd6336c],
    },
    ember: {
        id: 'ember',
        name: 'Ember Dynasty',
        tagline: 'Obsidian and living flame, ruled from a burning throne.',
        pieces: {
            k: 'The Cinder King',
            q: 'Phoenix Empress',
            r: 'Obsidian Golem',
            b: 'Flame Priest',
            n: 'Magma Salamander',
            p: 'Cinder Imp',
        },
        palette: [0xff6a00, 0xffc23a, 0x3a3230, 0xff2e1a],
    },
    frost: {
        id: 'frost',
        name: 'Frost Covenant',
        tagline:
            'Glacier-born sorcerers who freeze the board one square at a time.',
        pieces: {
            k: 'The Glacier King',
            q: 'The Rime Matriarch',
            r: 'Ice Golem',
            b: 'Crystal Mage',
            n: 'Snow Bear',
            p: 'Frostling',
        },
        palette: [0x9cd3f2, 0xe8f6ff, 0x4f94c4, 0x7fe8ff],
    },
    tide: {
        id: 'tide',
        name: 'Sunken Fleet',
        tagline: 'Drowned crews risen from the deep to claim the board.',
        pieces: {
            k: 'The Drowned Admiral',
            q: 'The Sea Witch',
            r: 'Shipwreck Hulk',
            b: 'Tide Priest',
            n: 'Coral Crab',
            p: 'Barnacle Deckhand',
        },
        palette: [0x3fe0c8, 0xe0675a, 0xcfc6ae, 0x3f6b3a],
    },
    swarm: {
        id: 'swarm',
        name: 'Void Swarm',
        tagline:
            'Chitin, acid and one vast mind: the hive hungers for the board.',
        pieces: {
            k: 'The Overmind',
            q: 'The Hive Queen',
            r: 'Carapace Hulk',
            b: 'Psionic Brood',
            n: 'Burrower',
            p: 'Skitterling',
        },
        palette: [0x7dff3a, 0x4fd11f, 0x7a45a0, 0x3b1d52],
    },
    kingdom: {
        id: 'kingdom',
        name: 'Human Kingdom',
        tagline:
            'Steel, banners and oaths sworn to the crown of blue and gold.',
        pieces: {
            k: 'The King',
            q: 'The Queen',
            r: 'Siege Tower',
            b: 'Cleric',
            n: 'Mounted Knight',
            p: 'Footman',
        },
        palette: [0xe0b040, 0xb9c0cb, 0x1f3f95, 0xa31f24],
    },
    sky: {
        id: 'sky',
        name: 'Sky Armada',
        tagline: 'Aeronauts of brass and canvas who ride the thunder.',
        pieces: {
            k: 'The Cloud Admiral',
            q: 'The Storm Captain',
            r: 'Balloon Golem',
            b: 'Storm Caller',
            n: 'Storm Hawk',
            p: 'Aeronaut Cadet',
        },
        palette: [0x4f9ad8, 0xf2ece0, 0xd2a23c, 0x8fe3ff],
    },
    sun: {
        id: 'sun',
        name: 'Sun Pharaohs',
        tagline: 'Gold-masked rulers of the dunes, blessed by the burning sun.',
        pieces: {
            k: 'The Sun Pharaoh',
            q: 'The Serpent Queen',
            r: 'Obelisk Colossus',
            b: 'Sun Priest',
            n: 'Sphinx Hound',
            p: 'Sandstone Guard',
        },
        palette: [0xd9b47a, 0xe6b43c, 0x2a4fa8, 0x34bfae],
    },
    shadow: {
        id: 'shadow',
        name: 'Night Spirits',
        tagline: 'Lanterns gutter, bells toll, and the dead march at midnight.',
        pieces: {
            k: 'The Pale King',
            q: 'The Banshee',
            r: 'Haunted Belfry',
            b: 'Hollow Monk',
            n: 'Shadow Hound',
            p: 'Lantern Wisp',
        },
        palette: [0xe4def4, 0xb68cff, 0x45275f, 0x17141f],
    },
    mechs: {
        id: 'mechs',
        name: 'Star Mechs',
        tagline: 'Visors lit, thrusters hot: the Star Mechs roll out.',
        pieces: {
            k: 'Command Core',
            q: 'Laser Valkyrie',
            r: 'Siege Walker',
            b: 'Signal Tech',
            n: 'Hover Strider',
            p: 'Drone Trooper',
        },
        palette: [0xe9edf2, 0x4a5260, 0x39e6ff, 0xff3048],
    },
    greek: {
        id: 'greek',
        name: 'Greek Polis',
        tagline: 'Bronze and marble march out from the shining city.',
        pieces: {
            k: 'The Archon',
            q: 'The Huntress',
            r: 'Bronze Colossus',
            b: 'Oracle',
            n: 'Centaur',
            p: 'Hoplite',
        },
        palette: [0xb8803a, 0xe0b54a, 0x2f6fa8, 0xc0582f],
    },
};

export const ARMY_IDS = Object.keys(armies) as ArmyId[];

/** Games from before armies could be chosen. */
export const CLASSIC_ARMIES: GameArmies = { w: 'clockwork', b: 'wildwood' };

const pieceFiles = import.meta.glob<string>('../assets/pieces/*/*.svg', {
    eager: true,
    query: '?url',
    import: 'default',
});

/**
 * The image URL for a piece. Replace the SVG files in
 * resources/js/assets/pieces/<army> to restyle an army.
 */
export function pieceImage(army: ArmyId, type: PieceType): string {
    return pieceFiles[`../assets/pieces/${army}/${type}.svg`];
}

/**
 * The display name of a piece, e.g. "Wildwood Court · Briar Wolf".
 */
export function pieceLabel(army: ArmyId, type: PieceType): string {
    return `${armies[army].name} · ${armies[army].pieces[type]}`;
}
