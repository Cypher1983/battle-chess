import {
    AdditiveBlending,
    BoxGeometry,
    ConeGeometry,
    CylinderGeometry,
    Group,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    SphereGeometry,
    Vector3,
} from 'three';
import type { Material } from 'three';
import { IMPACT_AT } from '@/lib/board3d/battle/core';
import type { BattleScene, Beat } from '@/lib/board3d/battle/core';
import { RELEASE_AT } from '@/lib/board3d/battle/spells';
import { glowBoost } from '@/lib/board3d/pieces/parts';
import type { MissileSpell } from '@/lib/board3d/styles';
import { clamp01 } from '@/lib/board3d/tweens';

/** Build one missile of the given shape, pointing along +z. */
function missileShape(
    spell: MissileSpell,
    core: Material,
    halo: Material,
): Group {
    const group = new Group();

    switch (spell.shape) {
        case 'fireball':
        case 'glob': {
            group.add(new Mesh(new SphereGeometry(0.07, 12, 10), core));
            group.add(new Mesh(new SphereGeometry(0.13, 12, 10), halo));
            break;
        }
        case 'shard': {
            const shard = new Mesh(new ConeGeometry(0.045, 0.28, 5), core);
            shard.rotation.x = Math.PI / 2;
            group.add(shard);
            break;
        }
        case 'arrow': {
            const shaft = new Mesh(
                new CylinderGeometry(0.008, 0.008, 0.3, 5),
                core,
            );
            shaft.rotation.x = Math.PI / 2;
            const head = new Mesh(new ConeGeometry(0.022, 0.06, 5), core);
            head.rotation.x = Math.PI / 2;
            head.position.z = 0.17;
            group.add(shaft, head);
            break;
        }
        case 'axe': {
            const haft = new Mesh(
                new CylinderGeometry(0.012, 0.012, 0.26, 6),
                core,
            );
            const blade = new Mesh(new BoxGeometry(0.02, 0.1, 0.12), halo);
            blade.position.set(0, 0.1, 0.05);
            group.add(haft, blade);
            break;
        }
        case 'bottle': {
            group.add(
                new Mesh(new CylinderGeometry(0.035, 0.04, 0.1, 8), core),
            );
            const flame = new Mesh(new ConeGeometry(0.025, 0.08, 6), halo);
            flame.position.y = 0.09;
            group.add(flame);
            break;
        }
    }

    return group;
}

/**
 * One or more missiles (a fireball, a volley of arrows, ice shards...)
 * arc from the caster to the defender, leaving a glowing trail, and land
 * at the moment of impact.
 */
export function missile(
    battle: BattleScene,
    from: Vector3,
    to: Vector3,
    spell: MissileSpell,
): Beat {
    const count = spell.count ?? 1;
    const tumbles = spell.shape === 'axe' || spell.shape === 'bottle';
    const pointed = spell.shape === 'shard' || spell.shape === 'arrow';
    const height = spell.shape === 'arrow' ? 1.1 : 0.5;

    const core = new MeshStandardMaterial({
        color: spell.colour,
        emissive: spell.colour,
        emissiveIntensity: spell.glow === false ? 0 : glowBoost(),
        roughness: 0.4,
    });
    const halo = new MeshBasicMaterial({
        color: spell.trail,
        transparent: true,
        opacity: 0.45,
        blending: AdditiveBlending,
        depthWrite: false,
    });
    const trailMaterial = halo.clone();
    const puff = new SphereGeometry(0.04, 6, 5);

    const shots = Array.from({ length: count }, (_, i) => {
        const object = missileShape(spell, core, halo);
        object.visible = false;
        battle.props.add(object);
        const spread = count > 1 ? (i - (count - 1) / 2) * 0.14 : 0;

        return {
            object,
            start: RELEASE_AT + i * 45,
            from: from.clone().add(new Vector3(spread, 0, 0)),
            to: to.clone().add(new Vector3(spread * 0.6, 0, spread * 0.4)),
        };
    });

    const trail: { mesh: Mesh; bornAt: number }[] = [];
    let trailAt = 0;

    const positionAt = (shot: (typeof shots)[number], t: number): Vector3 =>
        shot.from
            .clone()
            .lerp(shot.to, t)
            .add(new Vector3(0, Math.sin(Math.PI * t) * height, 0));

    return {
        update(elapsed) {
            for (const shot of shots) {
                const t = clamp01(
                    (elapsed - shot.start) / (IMPACT_AT - shot.start),
                );
                shot.object.visible =
                    elapsed >= shot.start && elapsed < IMPACT_AT;

                if (!shot.object.visible) {
                    continue;
                }

                shot.object.position.copy(positionAt(shot, t));

                if (pointed) {
                    shot.object.lookAt(positionAt(shot, Math.min(t + 0.05, 1)));
                } else if (tumbles) {
                    shot.object.rotation.x = elapsed / 50;
                } else {
                    shot.object.scale.setScalar(
                        1 + Math.sin(elapsed / 30) * 0.12,
                    );
                }
            }

            const lead = shots[0];

            if (lead.object.visible) {
                battle.light.color.set(spell.trail);
                battle.light.position.copy(lead.object.position);
                battle.light.intensity = 3;

                // A puff of trail every few frames behind each missile.
                if (elapsed - trailAt > 25) {
                    trailAt = elapsed;

                    for (const shot of shots) {
                        if (shot.object.visible) {
                            const mesh = new Mesh(puff, trailMaterial);
                            mesh.position.copy(shot.object.position);
                            battle.props.add(mesh);
                            trail.push({ mesh, bornAt: elapsed });
                        }
                    }
                }
            }

            for (const bit of trail) {
                const age = clamp01((elapsed - bit.bornAt) / 320);
                bit.mesh.scale.setScalar(Math.max(1 - age, 0.001) * 1.4);
                bit.mesh.visible = age < 1;
            }
        },
        finish() {
            core.dispose();
            halo.dispose();
            trailMaterial.dispose();
            puff.dispose();
            shots.forEach((shot) =>
                shot.object.traverse((node) => {
                    if (node instanceof Mesh) {
                        node.geometry.dispose();
                    }
                }),
            );
        },
    };
}
