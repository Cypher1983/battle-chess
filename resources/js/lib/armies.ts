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

const pieceFiles = import.meta.glob<string>('../assets/pieces/*/*.svg', {
    eager: true,
    query: '?url',
    import: 'default',
});

/**
 * The image URL for a piece. Replace the SVG files in
 * resources/js/assets/pieces to restyle an army.
 */
export function pieceImage(color: PieceColor, type: PieceType): string {
    return pieceFiles[`../assets/pieces/${color}/${type}.svg`];
}

/**
 * The display name of a piece, e.g. "Wildwood Court · Briar Wolf".
 */
export function pieceLabel(color: PieceColor, type: PieceType): string {
    return `${armies[color].name} · ${armies[color].pieces[type]}`;
}
