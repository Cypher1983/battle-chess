export type PieceColor = 'w' | 'b';
export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';

/** The armies players can command (matches the server's Army enum). */
export type ArmyId = 'clockwork' | 'wildwood' | 'ember' | 'frost';

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
