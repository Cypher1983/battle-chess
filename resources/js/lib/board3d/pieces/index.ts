import { Box3 } from 'three';
import type { Group } from 'three';
import type { ArmyId, PieceColor, PieceType } from '@/lib/armies';
import { disposeObject } from '@/lib/board3d/stage';
import { armyStyles } from '@/lib/board3d/styles';

const templates = new Map<string, Group>();

/** Characters are modelled small; this makes them fill their squares. */
const MODEL_SCALE = 1.3;

/** How far a model may sink: the height of the bases pieces once stood on. */
const MAX_DROP = 0.07;

/**
 * Lower a model until its lowest part touches the board. Models that hover
 * on purpose (floating spirits, balloons) sink by at most `MAX_DROP`.
 */
function ground(model: Group): void {
    const drop = Math.min(new Box3().setFromObject(model).min.y, MAX_DROP);

    if (drop <= 0) {
        return;
    }

    for (const part of model.children) {
        part.position.y -= drop;
    }
}

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
export function createPiece(
    army: ArmyId,
    color: PieceColor,
    type: PieceType,
): Group {
    const key = `${army}:${type}`;
    let template = templates.get(key);

    if (!template) {
        template = armyStyles[army].build(type);
        ground(template);
        enlarge(template, MODEL_SCALE);
        templates.set(key, template);
    }

    const piece = template.clone();
    // Turn first, then tilt: battles lean pieces forward and back.
    piece.rotation.order = 'YXZ';
    // Models face +z; white stands on the +z side and faces −z.
    piece.rotation.y = color === 'w' ? Math.PI : 0;
    piece.userData = { army, color, type };

    return piece;
}

/** Free the shared models, e.g. when the 3D board is closed. */
export function disposePieceModels(): void {
    templates.forEach((template) => disposeObject(template));
    templates.clear();
}
