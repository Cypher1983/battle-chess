import { AdditiveBlending, Mesh, MeshBasicMaterial } from 'three';
import type { Object3D } from 'three';
import type { BattleScene, Beat } from '@/lib/board3d/battle/core';
import { armyStyles } from '@/lib/board3d/styles';
import { SIDE_GLOW } from '@/lib/board3d/pieces';

const EVERY = 45;
const FADE = 260;

/**
 * Fading, glowing copies of the attacker left behind while it moves fast
 * (between `from` and `to`, in scene ms).
 */
export function afterimages(
    battle: BattleScene,
    from: number,
    to: number,
): Beat {
    const { attacker, props } = battle;
    const ghosts: {
        object: Object3D;
        material: MeshBasicMaterial;
        bornAt: number;
    }[] = [];
    let lastAt = -Infinity;

    function spawn(elapsed: number): void {
        const material = new MeshBasicMaterial({
            // Tinted with the army's magic.
            color: armyStyles[attacker.army].magic,
            transparent: true,
            opacity: 0.28,
            blending: AdditiveBlending,
            depthWrite: false,
        });
        const object = attacker.object.clone();
        object.getObjectByName(SIDE_GLOW)?.removeFromParent();
        // Slightly smaller, so it hides inside the piece until it moves on.
        object.scale.multiplyScalar(0.96);
        object.traverse((node) => {
            if (node instanceof Mesh) {
                node.material = material;
                node.castShadow = false;
            }
        });
        props.add(object);
        ghosts.push({ object, material, bornAt: elapsed });
    }

    return {
        update(elapsed) {
            if (elapsed >= from && elapsed < to && elapsed - lastAt >= EVERY) {
                lastAt = elapsed;
                spawn(elapsed);
            }

            // A copy: faded ghosts are removed while looping.
            for (const ghost of ghosts.slice()) {
                const age = (elapsed - ghost.bornAt) / FADE;
                ghost.material.opacity = 0.28 * Math.max(1 - age, 0);

                if (age >= 1) {
                    props.remove(ghost.object);
                    ghost.material.dispose();
                    ghosts.splice(ghosts.indexOf(ghost), 1);
                }
            }
        },
        finish() {
            ghosts.forEach((ghost) => ghost.material.dispose());
        },
    };
}
