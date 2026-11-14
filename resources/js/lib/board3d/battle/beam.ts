import {
    AdditiveBlending,
    Color,
    CylinderGeometry,
    Mesh,
    MeshBasicMaterial,
    Quaternion,
    SphereGeometry,
    Vector3,
} from 'three';
import { IMPACT_AT } from '@/lib/board3d/battle/core';
import type { BattleScene, Beat } from '@/lib/board3d/battle/core';
import { RELEASE_AT } from '@/lib/board3d/battle/spells';
import type { BeamSpell } from '@/lib/board3d/styles';
import { clamp01, easeOut } from '@/lib/board3d/tweens';

/** How long the beam takes to reach the defender (ms). */
const REACH = 140;

/**
 * A straight beam of light (a sunbeam, a laser) shoots from the caster to
 * the defender, burns there with a pulsing flare, then snaps off just after
 * the impact.
 */
export function beam(
    battle: BattleScene,
    from: Vector3,
    to: Vector3,
    spell: BeamSpell,
): Beat {
    const direction = to.clone().sub(from);
    const length = direction.length();
    const turn = new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        direction.clone().normalize(),
    );

    // Brighter than white, so bloom picks the core up.
    const coreMaterial = new MeshBasicMaterial({
        color: new Color(spell.core).multiplyScalar(4),
    });
    const glowMaterial = new MeshBasicMaterial({
        color: spell.glow,
        transparent: true,
        opacity: 0.5,
        blending: AdditiveBlending,
        depthWrite: false,
    });

    // Unit-height cylinders, stretched along the beam each frame.
    const coreGeometry = new CylinderGeometry(0.018, 0.018, 1, 8);
    const glowGeometry = new CylinderGeometry(0.06, 0.06, 1, 10);
    const core = new Mesh(coreGeometry, coreMaterial);
    const halo = new Mesh(glowGeometry, glowMaterial);
    const flare = new Mesh(new SphereGeometry(0.12, 14, 10), glowMaterial);

    for (const mesh of [core, halo]) {
        mesh.quaternion.copy(turn);
        mesh.visible = false;
        battle.props.add(mesh);
    }

    flare.position.copy(to);
    flare.visible = false;
    battle.props.add(flare);

    return {
        update(elapsed) {
            const on = elapsed >= RELEASE_AT && elapsed < IMPACT_AT + 150;
            core.visible = on;
            halo.visible = on;

            if (!on) {
                flare.visible = false;

                return;
            }

            const reach = easeOut(clamp01((elapsed - RELEASE_AT) / REACH));
            const shown = Math.max(length * reach, 0.001);

            for (const mesh of [core, halo]) {
                mesh.scale.set(1, shown, 1);
                mesh.position
                    .copy(from)
                    .addScaledVector(direction, reach * 0.5);
            }

            const pulse = 1 + Math.sin(elapsed / 25) * 0.25;
            halo.scale.x = pulse;
            halo.scale.z = pulse;

            flare.visible = reach >= 1;
            flare.scale.setScalar(pulse);

            battle.light.color.set(spell.glow);
            battle.light.position.copy(to);
            battle.light.intensity = 4 * pulse;
        },
        finish() {
            coreGeometry.dispose();
            glowGeometry.dispose();
            flare.geometry.dispose();
            coreMaterial.dispose();
            glowMaterial.dispose();
        },
    };
}
