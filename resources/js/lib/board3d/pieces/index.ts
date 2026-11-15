import {
    Box3,
    CanvasTexture,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    SRGBColorSpace,
} from 'three';
import type { Group } from 'three';
import type { ArmyId, PieceColor, PieceType } from '@/lib/armies';
import { disposeObject } from '@/lib/board3d/stage';
import { armyStyles } from '@/lib/board3d/styles';

const templates = new Map<string, Group>();

/** The name of the glow at a piece's feet, which battles leave alone. */
export const SIDE_GLOW = 'side-glow';

/**
 * Any army can play either colour, so a soft glow at each piece's feet
 * shows its side: ivory light for white, a dark haze for black.
 */
const glowGeometry = new PlaneGeometry(0.95, 0.95).rotateX(-Math.PI / 2);
let glows: Record<PieceColor, MeshBasicMaterial> | null = null;

function glowMaterials(): Record<PieceColor, MeshBasicMaterial> {
    glows ??= {
        w: glowMaterial('255, 246, 224', 0.9),
        b: glowMaterial('12, 10, 18', 0.75),
    };

    return glows;
}

function glowMaterial(rgb: string, strength: number): MeshBasicMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    // Brightest in a band round the feet, where the character doesn't hide it.
    gradient.addColorStop(0, `rgba(${rgb}, ${strength * 0.5})`);
    gradient.addColorStop(0.5, `rgba(${rgb}, ${strength})`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;

    return new MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
    });
}

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

    const glow = new Mesh(glowGeometry, glowMaterials()[color]);
    glow.name = SIDE_GLOW;
    glow.position.y = 0.003;
    piece.add(glow);

    return piece;
}

/** Free the shared models, e.g. when the 3D board is closed. */
export function disposePieceModels(): void {
    templates.forEach((template) => disposeObject(template));
    templates.clear();
}
