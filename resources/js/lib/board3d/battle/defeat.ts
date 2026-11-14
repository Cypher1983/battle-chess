import { Box3, Mesh, Vector3 } from 'three';
import type { Material, Object3D } from 'three';
import { IMPACT_AT } from '@/lib/board3d/battle/core';
import type { BattleScene, Beat } from '@/lib/board3d/battle/core';
import { clamp01, easeIn, easeOut, lerp } from '@/lib/board3d/tweens';

type Chunk = {
    object: Object3D;
    velocity: Vector3;
    spin: Vector3;
    /** Half the chunk's height, so it rests on the board, not in it. */
    rest: number;
};

const GRAVITY = 6;

/**
 * The defender flinches as the blow comes in, then breaks apart: its
 * parts fly away from the attacker, tumble, bounce and fade.
 */
export function defeat(battle: BattleScene): Beat {
    const { defender, heading, props } = battle;
    const object = defender.object;
    const chunks: Chunk[] = [];
    const ghosts: Material[] = [];
    let broken = false;
    let previous = 0;

    function breakApart(): void {
        object.updateWorldMatrix(true, true);

        // A copy: attaching a part elsewhere removes it from `children`.
        for (const part of object.children.slice()) {
            props.attach(part);

            part.traverse((node) => {
                if (node instanceof Mesh && !Array.isArray(node.material)) {
                    const ghost = node.material.clone();
                    ghost.transparent = true;
                    ghosts.push(ghost);
                    node.material = ghost;
                }
            });

            const box = new Box3().setFromObject(part);
            const centre = box.getCenter(new Vector3());
            const outward = centre
                .clone()
                .sub(object.position)
                .setY(0)
                .normalize()
                .multiplyScalar(0.8);
            const speed = 1.2 + Math.random() * 1.6;

            chunks.push({
                object: part,
                velocity: heading
                    .clone()
                    .multiplyScalar(speed)
                    .add(outward)
                    .add(
                        new Vector3(
                            0,
                            1.4 + Math.random() * 2 + centre.y * 1.5,
                            0,
                        ),
                    ),
                spin: new Vector3(
                    Math.random() * 10 - 5,
                    Math.random() * 6 - 3,
                    Math.random() * 10 - 5,
                ),
                rest: Math.max((box.max.y - box.min.y) / 2, 0.02),
            });
        }
    }

    return {
        update(elapsed) {
            const dt = Math.max(elapsed - previous, 0) / 1000;
            previous = elapsed;

            if (elapsed < IMPACT_AT) {
                // Brace for the blow.
                const t = clamp01((elapsed - (IMPACT_AT - 250)) / 250);
                object.rotation.x = lerp(0, -0.2, easeIn(t));

                return;
            }

            if (!broken) {
                broken = true;
                breakApart();
            }

            for (const chunk of chunks) {
                const { object: part, velocity, spin, rest } = chunk;
                velocity.y -= GRAVITY * dt;
                part.position.addScaledVector(velocity, dt);

                if (part.position.y < rest) {
                    part.position.y = rest;
                    velocity.y = Math.abs(velocity.y) * 0.3;
                    velocity.x *= 0.5;
                    velocity.z *= 0.5;
                    spin.multiplyScalar(0.5);
                }

                part.rotation.x += spin.x * dt;
                part.rotation.y += spin.y * dt;
                part.rotation.z += spin.z * dt;
            }

            const fade =
                1 - easeOut(clamp01((elapsed - (IMPACT_AT + 500)) / 600));
            ghosts.forEach((ghost) => (ghost.opacity = fade));
            chunks.forEach((chunk) => (chunk.object.visible = fade > 0.01));
        },
        finish() {
            // The parts are inside `props`, which the battle removes.
            ghosts.forEach((ghost) => ghost.dispose());
        },
    };
}
