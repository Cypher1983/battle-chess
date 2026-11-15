import {
    CircleGeometry,
    Group,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    RingGeometry,
} from 'three';
import type { Material } from 'three';
import { squareToPosition } from '@/lib/board3d/coords';

export type HighlightState = {
    lastMove: { from: string; to: string } | null;
    selected: string | null;
    targets: string[];
    /** Squares that hold a piece, so targets there show as rings. */
    occupied: Set<string>;
    check: string | null;
    focused: string | null;
};

function overlay(colour: number, opacity: number): MeshBasicMaterial {
    return new MeshBasicMaterial({
        color: colour,
        transparent: true,
        opacity,
        depthWrite: false,
    });
}

/**
 * Coloured marks painted just above the board: the last move, the selected
 * piece, where it can go, a king in check and the keyboard focus.
 */
export function createHighlights(): {
    group: Group;
    update: (state: HighlightState) => void;
} {
    const group = new Group();
    group.name = 'highlights';

    const tile = new PlaneGeometry(1, 1);
    const dot = new CircleGeometry(0.16, 24);
    const ring = new RingGeometry(0.36, 0.46, 32);
    const frame = new RingGeometry(0.44, 0.5, 4, 1, Math.PI / 4);
    // Along the square's edge, outside the focus frame, so both can show.
    const outline = new RingGeometry(0.62, 0.7, 4, 1, Math.PI / 4);

    const materials = {
        lastMove: overlay(0xfde047, 0.38),
        selected: overlay(0x22c55e, 0.62),
        selectedOutline: overlay(0x15803d, 1),
        target: overlay(0x1c1917, 0.3),
        check: overlay(0xef4444, 0.7),
        focus: overlay(0x2563eb, 0.9),
    };

    function mark(
        square: string,
        geometry: PlaneGeometry | CircleGeometry | RingGeometry,
        material: Material,
        lift: number,
    ): void {
        const mesh = new Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.copy(squareToPosition(square, lift));
        mesh.renderOrder = 1;
        group.add(mesh);
    }

    return {
        group,
        update(state) {
            group.clear();

            if (state.lastMove) {
                mark(state.lastMove.from, tile, materials.lastMove, 0.004);
                mark(state.lastMove.to, tile, materials.lastMove, 0.004);
            }

            if (state.check) {
                mark(state.check, tile, materials.check, 0.005);
            }

            if (state.selected) {
                // Green, unlike the yellow last move, with a bright outline
                // that the piece standing in the middle can't hide.
                mark(state.selected, tile, materials.selected, 0.006);
                mark(state.selected, outline, materials.selectedOutline, 0.007);
            }

            for (const target of state.targets) {
                const occupied = state.occupied.has(target);
                mark(target, occupied ? ring : dot, materials.target, 0.007);
            }

            if (state.focused) {
                // Rotated a quarter turn, the 4-sided ring frames the square.
                mark(state.focused, frame, materials.focus, 0.008);
            }
        },
    };
}
