import type { Group } from 'three';
import type { PieceColor, PieceType } from '@/lib/armies';
import { buildClockwork } from '@/lib/board3d/pieces/clockwork';
import { buildWildwood } from '@/lib/board3d/pieces/wildwood';
import { disposeObject } from '@/lib/board3d/stage';

const templates = new Map<string, Group>();

/** Characters are modelled small; this makes them fill their squares. */
const MODEL_SCALE = 1.3;

/**
 * Scale a model by scaling its parts, so the piece itself keeps a scale of
 * 1 (move, squash and defeat animations set the piece's scale).
 */
function enlarge(model: Group, factor: number): void {
    for (const part of model.children) {
        part.position.multiplyScalar(factor);
        part.scale.multiplyScalar(factor);
    }
}

/**
 * A 3D piece, facing the opponent's side of the board. Each model is built
 * once and then cloned, so all copies share geometry and materials.
 */
export function createPiece(color: PieceColor, type: PieceType): Group {
    const key = `${color}${type}`;
    let template = templates.get(key);

    if (!template) {
        template = color === 'w' ? buildClockwork(type) : buildWildwood(type);
        enlarge(template, MODEL_SCALE);
        templates.set(key, template);
    }

    const piece = template.clone();
    // Turn first, then tilt: battles lean pieces forward and back.
    piece.rotation.order = 'YXZ';
    // Models face +z; white stands on the +z side and faces −z.
    piece.rotation.y = color === 'w' ? Math.PI : 0;
    piece.userData = { color, type };

    return piece;
}

/** Free the shared models, e.g. when the 3D board is closed. */
export function disposePieceModels(): void {
    templates.forEach((template) => disposeObject(template));
    templates.clear();
}
