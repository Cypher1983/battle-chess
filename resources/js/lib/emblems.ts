/** Emblem outlines (matches the server's EmblemShape enum). */
export type EmblemShapeId = 'shield' | 'round' | 'banner' | 'hex';

/** Emblem charges (matches the server's EmblemIcon enum). */
export type EmblemIconId =
    | 'crown'
    | 'sword'
    | 'tower'
    | 'wolf'
    | 'gear'
    | 'tree'
    | 'flame'
    | 'star'
    | 'moon'
    | 'skull';

/** A clan's emblem, as the server sends it. */
export type Emblem = {
    shape: EmblemShapeId;
    icon: EmblemIconId;
    /** The field colour, as #rrggbb. */
    primary: string;
    /** The border and charge colour, as #rrggbb. */
    secondary: string;
};

/** A circle as a path, so it can be cut out of a shape with evenodd. */
function circle(cx: number, cy: number, r: number): string {
    return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
}

/** A cog with square teeth and a hole in the middle, in a 24×24 box. */
function gear(): string {
    const teeth = 8;
    const points: string[] = [];

    for (let i = 0; i < teeth * 4; i++) {
        const radius = i % 4 < 2 ? 10.5 : 7.5;
        const angle = ((i - 0.5) * Math.PI * 2) / (teeth * 4);
        points.push(
            `${(12 + radius * Math.cos(angle)).toFixed(2)} ${(12 + radius * Math.sin(angle)).toFixed(2)}`,
        );
    }

    return `M${points.join('L')}Z${circle(12, 12, 3.2)}`;
}

/** Outlines in a 100×100 box, with their display names. */
export const emblemShapes: Record<
    EmblemShapeId,
    { name: string; path: string }
> = {
    shield: {
        name: 'Shield',
        path: 'M10 8H90V48C90 74 70 88 50 96C30 88 10 74 10 48Z',
    },
    round: { name: 'Round', path: circle(50, 50, 44) },
    banner: { name: 'Banner', path: 'M14 6H86V94L50 78L14 94Z' },
    hex: { name: 'Hex', path: 'M50 4L90 27V73L50 96L10 73V27Z' },
};

/** Charges in a 24×24 box (drawn with evenodd fill), with their display names. */
export const emblemIcons: Record<EmblemIconId, { name: string; path: string }> =
    {
        crown: {
            name: 'Crown',
            path: 'M3 17.5L4 6.5L8.5 10.5L12 3.5L15.5 10.5L20 6.5L21 17.5ZM3 19H21V21.5H3Z',
        },
        sword: {
            name: 'Sword',
            path: 'M11 2H13L13.6 14H10.4ZM6.5 14H17.5V16H6.5ZM11 16H13V19.5H11ZM10.2 19.5H13.8V22H10.2Z',
        },
        tower: {
            name: 'Tower',
            path: 'M5 3H8V5H10.5V3H13.5V5H16V3H19V9L17 11V19L19 21.5H5L7 19V11L5 9ZM10.5 21.5V17A1.5 1.5 0 0 1 13.5 17V21.5Z',
        },
        wolf: {
            name: 'Wolf',
            path: 'M4 3L9 8H15L20 3L19.5 11L17 16L12 21.5L7 16L4.5 11ZM8.2 11.2L10.8 12.6L8.6 13.4ZM15.8 11.2L13.2 12.6L15.4 13.4ZM10.8 17H13.2L12 18.6Z',
        },
        gear: { name: 'Gear', path: gear() },
        tree: {
            name: 'Tree',
            path: 'M12 2L18 9H15L19.5 14.5H14V21.5H10V14.5H4.5L9 9H6Z',
        },
        flame: {
            name: 'Flame',
            path: 'M12 2C13 6 18 8.5 18 14.5C18 18.5 15.3 22 12 22C8.7 22 6 18.5 6 14.5C6 11.5 8 9.5 9 7.5C9.6 9.5 10.5 10.5 11.5 11C11.5 8 11 5 12 2ZM12 20.5C10.3 20.5 9.4 19.2 9.4 17.8C9.4 16 11 14.8 12 13.2C13 14.8 14.6 16 14.6 17.8C14.6 19.2 13.7 20.5 12 20.5Z',
        },
        star: {
            name: 'Star',
            path: 'M12 2L14.9 8.6L22 9.3L16.6 14L18.2 21L12 17.3L5.8 21L7.4 14L2 9.3L9.1 8.6Z',
        },
        moon: {
            name: 'Moon',
            path: 'M14 2.2A10 10 0 1 0 21.8 15A8 8 0 1 1 14 2.2Z',
        },
        skull: {
            name: 'Skull',
            path: `M12 2.5C7 2.5 4 6 4 10.5C4 13.5 5.5 15.5 7.5 16.5V21H16.5V16.5C18.5 15.5 20 13.5 20 10.5C20 6 17 2.5 12 2.5Z${circle(9, 11, 2)}${circle(15, 11, 2)}M12 13.5L13.2 15.8H10.8ZM10 18H11V21H10ZM13 18H14V21H13Z`,
        },
    };

export const EMBLEM_SHAPE_IDS = Object.keys(emblemShapes) as EmblemShapeId[];
export const EMBLEM_ICON_IDS = Object.keys(emblemIcons) as EmblemIconId[];

/** The emblem a new clan starts with. */
export const DEFAULT_EMBLEM: Emblem = {
    shape: 'shield',
    icon: 'crown',
    primary: '#b8860b',
    secondary: '#1f2937',
};
