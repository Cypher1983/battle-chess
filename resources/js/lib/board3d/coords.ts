import type { Square } from 'chess.js';
import { Vector3 } from 'three';

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

/**
 * Board layout in world units: every square is 1×1, the board's centre is
 * the origin and its playing surface is at y = 0. File a is at −x and
 * rank 1 at +z, so white sits on the +z side.
 */
export function squareToPosition(square: string, y = 0): Vector3 {
    const file = FILES.indexOf(square[0] as (typeof FILES)[number]);
    const rank = Number(square[1]) - 1;

    return new Vector3(file - 3.5, y, 3.5 - rank);
}

/**
 * The square under a point on the board, or null when the point is off it.
 */
export function positionToSquare(x: number, z: number): Square | null {
    const file = Math.floor(x + 4);
    const rank = Math.floor(4 - z);

    if (file < 0 || file > 7 || rank < 0 || rank > 7) {
        return null;
    }

    return `${FILES[file]}${rank + 1}` as Square;
}
