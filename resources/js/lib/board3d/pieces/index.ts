import { Mesh, MeshStandardMaterial, TorusGeometry } from 'three';
import type { Group } from 'three';
import type { ArmyId, PieceColor, PieceType } from '@/lib/armies';
import { disposeObject } from '@/lib/board3d/stage';
import { armyStyles } from '@/lib/board3d/styles';

const templates = new Map<string, Group>();

/**
 * Any army can play either colour, so every piece wears a rim round its
 * base showing its side: ivory for white, onyx for black.
 */
const rimGeometry = new TorusGeometry(0.43, 0.03, 8, 40);
const rims: Record<PieceColor, MeshStandardMaterial> = {
    w: new MeshStandardMaterial({
        color: 0xf6efdf,
        emissive: 0xf6efdf,
        emissiveIntensity: 0.15,
        roughness: 0.35,
    }),
    b: new MeshStandardMaterial({
        color: 0x16161c,
        metalness: 0.4,
        roughness: 0.3,
    }),
};

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
export function createPiece(
    army: ArmyId,
    color: PieceColor,
    type: PieceType,
): Group {
    const key = `${army}:${type}`;
    let template = templates.get(key);

    if (!template) {
        template = armyStyles[army].build(type);
        enlarge(template, MODEL_SCALE);
        templates.set(key, template);
    }

    const piece = template.clone();
    // Turn first, then tilt: battles lean pieces forward and back.
    piece.rotation.order = 'YXZ';
    // Models face +z; white stands on the +z side and faces −z.
    piece.rotation.y = color === 'w' ? Math.PI : 0;
    piece.userData = { army, color, type };

    const rim = new Mesh(rimGeometry, rims[color]);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.025;
    rim.receiveShadow = true;
    piece.add(rim);

    return piece;
}

/** Free the shared models, e.g. when the 3D board is closed. */
export function disposePieceModels(): void {
    templates.forEach((template) => disposeObject(template));
    templates.clear();
}
