/** The boards a game can be played on (matches the server's BoardTheme enum). */
export type BoardThemeId = 'classic' | 'marble' | 'tournament';

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
    marble: {
        id: 'marble',
        name: 'Marble',
        light: '#f1efea',
        dark: '#8d939b',
        frame: '#3a3d42',
        trim: '#c8ccd2',
        label: '#e6e8ec',
        plinth: '#2a2c30',
        grain: {
            frame: 'rgba(255,255,255,0.08)',
            light: 'rgba(110,115,125,0.10)',
            dark: 'rgba(255,255,255,0.10)',
            lines: 120,
        },
        finish: { roughness: 0.25, metalness: 0 },
    },
    tournament: {
        id: 'tournament',
        name: 'Tournament green',
        light: '#eeeed2',
        dark: '#769656',
        frame: '#3b2a1e',
        trim: '#d8c38a',
        label: '#eeeed2',
        plinth: '#2a1d14',
        grain: {
            frame: 'rgba(0,0,0,0.14)',
            light: 'rgba(0,0,0,0.03)',
            dark: 'rgba(0,0,0,0.05)',
            lines: 220,
        },
        finish: { roughness: 0.6, metalness: 0 },
    },
};

export const BOARD_THEME_IDS = Object.keys(boardThemes) as BoardThemeId[];
