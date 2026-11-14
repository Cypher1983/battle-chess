import {
    AdditiveBlending,
    CatmullRomCurve3,
    Color,
    ConeGeometry,
    CylinderGeometry,
    Group,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Quaternion,
    SphereGeometry,
    TubeGeometry,
    Vector3,
} from 'three';
import { IMPACT_AT } from '@/lib/board3d/battle/core';
import type { BattleScene, Beat } from '@/lib/board3d/battle/core';
import { glowBoost } from '@/lib/board3d/pieces/parts';
import type { BoltSpell, TendrilSpell } from '@/lib/board3d/styles';
import { clamp01, easeIn, easeOut } from '@/lib/board3d/tweens';

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
    colours: BoltSpell,
): Beat {
    const SEGMENTS = 14;
    const BRANCH = 5;
    const group = new Group();
    battle.props.add(group);

    // Brighter than white, so bloom picks the bolt up.
    const core = new MeshBasicMaterial({
        color: new Color(colours.core).multiplyScalar(4),
    });
    const glowMaterial = new MeshBasicMaterial({
        color: colours.glow,
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

            battle.light.color.set(colours.glow);
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

/**
 * Wildwood casters call up a thorny vine: it bursts from the ground beside
 * the caster, whips over in an arc into the defender and withers away.
 */
export function vine(
    battle: BattleScene,
    _from: Vector3,
    to: Vector3,
    colours: TendrilSpell,
): Beat {
    const { attacker, heading, props } = battle;
    const side = new Vector3().crossVectors(heading, UP).normalize();
    const root = attacker.position
        .clone()
        .addScaledVector(heading, 0.35)
        .addScaledVector(side, 0.25)
        .setY(-0.05);
    const span = root.distanceTo(to);

    const curve = new CatmullRomCurve3([
        root,
        root
            .clone()
            .add(new Vector3(0, 0.5, 0))
            .addScaledVector(heading, 0.15),
        root
            .clone()
            .lerp(to, 0.45)
            .addScaledVector(side, -0.2)
            .setY(0.7 + span * 0.15),
        root.clone().lerp(to, 0.8).addScaledVector(side, 0.1).setY(0.75),
        to,
    ]);

    const SEGMENTS = 80;
    const RADIAL = 6;
    const tube = new TubeGeometry(curve, SEGMENTS, 0.045, RADIAL, false);
    const indicesPerSegment = RADIAL * 6;
    const bark = new MeshStandardMaterial({
        color: colours.stem,
        roughness: 0.85,
        flatShading: true,
    });
    const stem = new Mesh(tube, bark);
    stem.castShadow = true;
    props.add(stem);

    const thornGeometry = new ConeGeometry(0.022, 0.1, 5);
    const thornMaterial = new MeshStandardMaterial({
        color: colours.thorn,
        roughness: 0.5,
    });
    const thorns = Array.from({ length: 14 }, (_, i) => {
        const t = 0.12 + (i / 14) * 0.82;
        const point = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);
        const out = new Vector3()
            .crossVectors(tangent, i % 2 ? UP : side)
            .normalize()
            .multiplyScalar(i % 3 === 0 ? -1 : 1);
        const thorn = new Mesh(thornGeometry, thornMaterial);
        thorn.position.copy(point).addScaledVector(out, 0.04);
        thorn.quaternion.setFromUnitVectors(UP, out);
        thorn.scale.setScalar(0.001);
        props.add(thorn);

        return { thorn, t };
    });

    const tipMaterial = new MeshStandardMaterial({
        color: colours.tip,
        emissive: colours.tip,
        emissiveIntensity: glowBoost(),
    });
    const tip = new Mesh(new SphereGeometry(0.06, 10, 8), tipMaterial);
    props.add(tip);

    const show = (length: number): void => {
        stem.visible = length > 0.001;
        tube.setDrawRange(0, Math.ceil(length * SEGMENTS) * indicesPerSegment);
        tip.visible = stem.visible;
        tip.position.copy(curve.getPointAt(Math.min(Math.max(length, 0), 1)));
        thorns.forEach(({ thorn, t }) => {
            thorn.scale.setScalar(length > t ? 1 : 0.001);
        });
    };

    show(0);

    return {
        update(elapsed) {
            if (elapsed < RELEASE_AT) {
                show(0);
            } else if (elapsed < IMPACT_AT) {
                // Lashing out: slow from the ground, fast at the end.
                show(
                    easeIn(
                        clamp01(
                            (elapsed - RELEASE_AT) / (IMPACT_AT - RELEASE_AT),
                        ),
                    ),
                );
                battle.light.color.set(colours.tip);
                battle.light.position.copy(tip.position);
                battle.light.intensity = 2.5;
            } else {
                // Withering back into the ground.
                show(1 - easeOut(clamp01((elapsed - IMPACT_AT - 250) / 500)));
            }
        },
        finish() {
            tube.dispose();
            bark.dispose();
            thornGeometry.dispose();
            thornMaterial.dispose();
            tip.geometry.dispose();
            tipMaterial.dispose();
        },
    };
}
