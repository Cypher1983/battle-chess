import {
    AdditiveBlending,
    Color,
    CylinderGeometry,
    Group,
    Mesh,
    MeshBasicMaterial,
    Quaternion,
    Vector3,
} from 'three';
import { IMPACT_AT } from '@/lib/board3d/battle/core';
import type { BattleScene, Beat } from '@/lib/board3d/battle/core';
import { clamp01, easeOut } from '@/lib/board3d/tweens';

/** When the gathered energy is released at the defender (ms). */
export const RELEASE_AT = 950;

const UP = new Vector3(0, 1, 0);

/**
 * Point a unit-height cylinder from `start` to `end`. The cylinder's
 * geometry must run along y from −0.5 to 0.5.
 */
function stretch(mesh: Mesh, start: Vector3, end: Vector3): void {
    const direction = end.clone().sub(start);
    mesh.position.copy(start).addScaledVector(direction, 0.5);
    mesh.scale.set(1, direction.length(), 1);
    mesh.quaternion.copy(
        new Quaternion().setFromUnitVectors(UP, direction.normalize()),
    );
}

/**
 * Clockwork casters release a forked lightning bolt: a white-hot jagged
 * core in a blue glow that re-strikes every few frames until just after
 * the impact.
 */
export function lightning(
    battle: BattleScene,
    from: Vector3,
    to: Vector3,
): Beat {
    const SEGMENTS = 14;
    const BRANCH = 5;
    const group = new Group();
    battle.props.add(group);

    // Brighter than white, so bloom picks the bolt up.
    const core = new MeshBasicMaterial({
        color: new Color(0xe8fbff).multiplyScalar(4),
    });
    const glowMaterial = new MeshBasicMaterial({
        color: 0x5fc8ff,
        transparent: true,
        opacity: 0.45,
        blending: AdditiveBlending,
        depthWrite: false,
    });
    const thin = new CylinderGeometry(0.014, 0.014, 1, 5);
    const thick = new CylinderGeometry(0.05, 0.05, 1, 6);

    const make = (
        geometry: CylinderGeometry,
        material: MeshBasicMaterial,
    ): Mesh => {
        const mesh = new Mesh(geometry, material);
        group.add(mesh);

        return mesh;
    };

    const bolt = Array.from({ length: SEGMENTS }, () => ({
        core: make(thin, core),
        glow: make(thick, glowMaterial),
    }));
    const fork = Array.from({ length: BRANCH }, () => make(thin, core));

    let points: Vector3[] = [];
    let struckAt = -Infinity;

    /** A new jagged path from `from` to `to`, widest in the middle. */
    function strike(): void {
        const along = to.clone().sub(from);
        const side = new Vector3().crossVectors(along, UP).normalize();
        points = Array.from({ length: SEGMENTS + 1 }, (_, i) => {
            const t = i / SEGMENTS;
            const wobble = Math.sin(Math.PI * t) * 0.22;

            return from
                .clone()
                .addScaledVector(along, t)
                .addScaledVector(side, (Math.random() - 0.5) * wobble)
                .add(new Vector3(0, (Math.random() - 0.5) * wobble, 0));
        });

        // A short fork splitting off part way along.
        const split =
            points[Math.floor(SEGMENTS * (0.3 + Math.random() * 0.3))];
        let tip = split.clone();
        const away = side.clone().multiplyScalar(Math.random() < 0.5 ? 1 : -1);

        fork.forEach((mesh) => {
            const next = tip
                .clone()
                .addScaledVector(along, 0.05)
                .addScaledVector(away, 0.06 + Math.random() * 0.05)
                .add(new Vector3(0, (Math.random() - 0.6) * 0.08, 0));
            stretch(mesh, tip, next);
            tip = next;
        });
    }

    group.visible = false;

    return {
        update(elapsed) {
            const end = IMPACT_AT + 180;
            group.visible = elapsed >= RELEASE_AT && elapsed < end;

            if (!group.visible) {
                return;
            }

            if (elapsed - struckAt > 60) {
                struckAt = elapsed;
                strike();
            }

            // The bolt races out to the target, then flickers.
            const reach = easeOut(clamp01((elapsed - RELEASE_AT) / 150));
            const shown = Math.ceil(reach * SEGMENTS);

            bolt.forEach((segment, i) => {
                const visible = i < shown;
                segment.core.visible = visible;
                segment.glow.visible = visible;

                if (visible) {
                    stretch(segment.core, points[i], points[i + 1]);
                    stretch(segment.glow, points[i], points[i + 1]);
                }
            });

            fork.forEach((mesh) => (mesh.visible = reach > 0.6));
            glowMaterial.opacity = 0.25 + Math.random() * 0.3;

            battle.light.color.set(0x8fdcff);
            battle.light.position.copy(to);
            battle.light.intensity = 3 + Math.random() * 4;
        },
        finish() {
            thin.dispose();
            thick.dispose();
            core.dispose();
            glowMaterial.dispose();
        },
    };
}
