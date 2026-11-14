import {
    AdditiveBlending,
    Mesh,
    MeshBasicMaterial,
    SphereGeometry,
    Vector3,
} from 'three';
import { IMPACT_AT } from '@/lib/board3d/battle/core';
import type { BattleScene, Beat } from '@/lib/board3d/battle/core';
import { RELEASE_AT } from '@/lib/board3d/battle/spells';
import type { GustSpell } from '@/lib/board3d/styles';
import { clamp01, easeOut } from '@/lib/board3d/tweens';

const UP = new Vector3(0, 1, 0);
const BITS = 54;

/**
 * A spiralling gust (wind, a water spout) whirls from the caster to the
 * defender: a corkscrew of glowing motes that widens as it travels and
 * scatters after the impact.
 */
export function gust(
    battle: BattleScene,
    from: Vector3,
    to: Vector3,
    spell: GustSpell,
): Beat {
    const along = to.clone().sub(from);
    const side = new Vector3().crossVectors(along, UP).normalize();
    const lift = new Vector3().crossVectors(side, along).normalize();

    const material = new MeshBasicMaterial({
        color: spell.colour,
        transparent: true,
        opacity: 0.7,
        blending: AdditiveBlending,
        depthWrite: false,
    });
    const geometry = new SphereGeometry(0.045, 6, 5);

    const motes = Array.from({ length: BITS }, (_, i) => {
        const mesh = new Mesh(geometry, material);
        mesh.visible = false;
        battle.props.add(mesh);

        return {
            mesh,
            // Where along the path this mote sits, and on which of three strands.
            at: i / BITS,
            strand: (i % 3) * ((Math.PI * 2) / 3),
        };
    });

    return {
        update(elapsed) {
            if (elapsed < RELEASE_AT) {
                return;
            }

            // The head of the gust races out; after impact it scatters.
            const front = clamp01(
                (elapsed - RELEASE_AT) / (IMPACT_AT - RELEASE_AT),
            );
            const scatter = easeOut(clamp01((elapsed - IMPACT_AT) / 400));

            for (const { mesh, at, strand } of motes) {
                const s = at * front;
                mesh.visible = scatter < 1;

                if (!mesh.visible) {
                    continue;
                }

                const radius = (0.08 + s * 0.22) * (1 + scatter * 2);
                const angle = s * 14 + strand - elapsed / 70;
                mesh.position
                    .copy(from)
                    .addScaledVector(along, s)
                    .addScaledVector(side, Math.cos(angle) * radius)
                    .addScaledVector(lift, Math.sin(angle) * radius);
                mesh.scale.setScalar((0.6 + s) * (1 - scatter));
            }

            material.opacity = 0.7 * (1 - scatter);
            battle.light.color.set(spell.colour);
            battle.light.position.copy(from).addScaledVector(along, front);
            battle.light.intensity = 2.5 * (1 - scatter);
        },
        finish() {
            geometry.dispose();
            material.dispose();
        },
    };
}
