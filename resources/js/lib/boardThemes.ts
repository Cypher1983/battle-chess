/** The boards a game can be played on (matches the server's BoardTheme enum). */
export type BoardThemeId = 'classic';

export type BoardTheme = {
    id: BoardThemeId;
    name: string;
    /** Square colours, as CSS colours. */
    light: string;
    dark: string;
    /** The frame round the squares. */
    frame: string;
    /** The thin lines between the squares and the frame. */
    trim: string;
    /** The file and rank letters on the frame. */
    label: string;
    /** The wider base the board stands on in 3D. */
    plinth: string;
    /** Streaks painted over the frame and squares (wood grain, marble veins). */
    grain: {
        frame: string;
        light: string;
        dark: string;
        /** How many streaks across the frame; 0 for none. */
        lines: number;
    };
    /** How the 3D board's surface catches the light. */
    finish: { roughness: number; metalness: number };
};

export const boardThemes: Record<BoardThemeId, BoardTheme> = {
    classic: {
        id: 'classic',
        name: 'Classic walnut',
        light: '#eadfc8',
        dark: '#9c7b54',
        frame: '#5b4632',
        trim: '#c9a46a',
        label: '#eadfc8',
        plinth: '#3d2e20',
        grain: {
            frame: 'rgba(0,0,0,0.12)',
            light: 'rgba(120,90,50,0.06)',
            dark: 'rgba(60,40,20,0.10)',
            lines: 260,
        },
        finish: { roughness: 0.55, metalness: 0 },
    },
};

export const BOARD_THEME_IDS = Object.keys(boardThemes) as BoardThemeId[];
