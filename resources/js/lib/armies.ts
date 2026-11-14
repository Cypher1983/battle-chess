export type PieceColor = 'w' | 'b';
export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';

type Army = {
    name: string;
    pieces: Record<PieceType, string>;
};

/**
 * The two armies of Battle Chess. White is always the Clockwork Legion,
 * black is always the Wildwood Court.
 */
export const armies: Record<PieceColor, Army> = {
    w: {
        name: 'Clockwork Legion',
        pieces: {
            k: 'The Regulator',
            q: 'Arc Duchess',
            r: 'Bulwark Engine',
            b: 'Gearwright',
            n: 'Cog Charger',
            p: 'Tick Soldier',
        },
    },
    b: {
        name: 'Wildwood Court',
        pieces: {
            k: 'The Elder Stag',
            q: 'The Thornmother',
            r: 'Old Bark',
            b: 'Moss Oracle',
            n: 'Briar Wolf',
            p: 'Sproutling',
        },
    },
};

/**
 * Placeholder glyphs until the animated sprites arrive.
 */
export const pieceGlyphs: Record<PieceType, string> = {
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
};
