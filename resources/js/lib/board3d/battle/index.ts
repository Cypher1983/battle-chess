import { Group, Mesh, Vector3 } from 'three';
import type { Material, Object3D, PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { attack } from '@/lib/board3d/battle/attacks';
import {
    DURATION,
    faceOff,
    IMPACT_AT,
    takeSquare,
} from '@/lib/board3d/battle/core';
import type {
    BattleContext,
    BattleOptions,
    BattleScene,
    Beat,
} from '@/lib/board3d/battle/core';
import { clamp01, easeInOut, lerp } from '@/lib/board3d/tweens';

export { DURATION, IMPACT_AT } from '@/lib/board3d/battle/core';
export type { BattleOptions } from '@/lib/board3d/battle/core';

/**
 * Play a capture battle on the board: the camera swoops in, the attacker
 * strikes, the defender falls, the attacker takes the square and the camera
 * returns. Resolves when the battle is over or skipped (via `signal`); the
 * attacker is always left on its destination.
 */
export function playBattle(
    context: BattleContext,
    options: BattleOptions,
    beats: (battle: BattleScene) => Beat[] = defaultBeats,
): Promise<void> {
    const { stage, controls } = context;
    const { attacker, defender, destination } = options;

    const heading = defender.position.clone().sub(attacker.position).setY(0);

    if (heading.lengthSq() === 0) {
        heading.set(0, 0, -1);
    }

    heading.normalize();

    const props = new Group();
    props.name = 'battle';
    stage.scene.add(props);

    let shakeUntil = 0;
    let shakeStrength = 0;
    let elapsed = 0;

    const battle: BattleScene = {
        scene: stage.scene,
        props,
        attacker,
        defender,
        heading,
        contact: defender.position.clone().addScaledVector(heading, -0.55),
        destination,
        shake: (strength) => {
            shakeStrength = strength;
            shakeUntil = elapsed + 260;
        },
    };

    const camera = cameraMove(
        stage.camera,
        controls,
        attacker.position,
        defender.position,
        options.bystanders ?? [],
    );
    const steps = [...camera, ...beats(battle)];

    const wasEnabled = controls.enabled;
    controls.enabled = false;

    return new Promise((resolve) => {
        let finished = false;

        const finish = (): void => {
            if (finished) {
                return;
            }

            finished = true;
            stopFrames();
            options.signal?.removeEventListener('abort', finish);
            steps.forEach((step) => step.finish?.());

            attacker.object.position.copy(destination);
            attacker.object.rotation.x = 0;
            attacker.object.rotation.z = 0;
            attacker.object.scale.setScalar(1);
            defender.object.removeFromParent();

            stage.scene.remove(props);
            controls.enabled = wasEnabled;
            resolve();
        };

        const stopFrames = stage.onFrame((delta) => {
            elapsed += delta;
            steps.forEach((step) => step.update(Math.min(elapsed, DURATION)));

            if (elapsed < shakeUntil) {
                const fade = (shakeUntil - elapsed) / 260;
                stage.camera.position.x +=
                    (Math.random() - 0.5) * shakeStrength * fade;
                stage.camera.position.y +=
                    (Math.random() - 0.5) * shakeStrength * fade;
            }

            options.onProgress?.(elapsed);

            if (elapsed >= DURATION) {
                finish();
            }
        });

        if (options.signal?.aborted) {
            finish();
        } else {
            options.signal?.addEventListener('abort', finish);
        }
    });
}

/**
 * Swoop from the player's view to a low side view of the fight, then back.
 * The camera goes to whichever side of the fight is nearer, so the swoop
 * stays short.
 */
function cameraMove(
    camera: PerspectiveCamera,
    controls: OrbitControls,
    from: Vector3,
    to: Vector3,
    bystanders: Object3D[],
): Beat[] {
    const homePosition = camera.position.clone();
    const homeTarget = controls.target.clone();

    // Long attacks are framed towards the defender, where the blow lands.
    const distance = from.distanceTo(to);
    const middle = from
        .clone()
        .lerp(to, 0.5 + clamp01((distance - 2) / 6) * 0.3);
    const along = to.clone().sub(from).setY(0);

    if (along.lengthSq() === 0) {
        along.set(0, 0, -1);
    }

    along.normalize();
    const span = Math.min(Math.max(distance, 1), 3.5);
    const fightTarget = middle.clone().setY(0.45);

    // Look from the side of the fight with fewer pieces in the way; on a
    // tie, the side nearer the player's view.
    const shotFrom = (side: Vector3): Vector3 =>
        middle
            .clone()
            .addScaledVector(side, 3.6 + span * 0.9)
            .add(new Vector3(0, 2.3 + span * 0.45, 0));

    const left = new Vector3(-along.z, 0, along.x);
    const right = left.clone().negate();
    const blocked = (side: Vector3): number =>
        bystanders.filter((piece) =>
            nearSegment(piece.position, shotFrom(side), fightTarget, 0.55),
        ).length;
    const towardsHome = homePosition.clone().sub(middle);
    const leftFirst =
        blocked(left) < blocked(right) ||
        (blocked(left) === blocked(right) && left.dot(towardsHome) >= 0);
    const fightPosition = shotFrom(leftFirst ? left : right);

    const place = (position: Vector3, target: Vector3): void => {
        camera.position.copy(position);
        controls.target.copy(target);
        camera.lookAt(target);
    };

    const blend = (from: Vector3, to: Vector3, t: number): Vector3 =>
        from.clone().lerp(to, easeInOut(clamp01(t)));

    const swoop: Beat = {
        update(elapsed) {
            if (elapsed < 550) {
                const t = elapsed / 550;
                place(
                    blend(homePosition, fightPosition, t),
                    blend(homeTarget, fightTarget, t),
                );
            } else if (elapsed < DURATION - 650) {
                // A slow push in keeps the shot alive.
                const t = (elapsed - 550) / (DURATION - 1200);
                place(
                    fightPosition.clone().lerp(fightTarget, lerp(0, 0.12, t)),
                    fightTarget,
                );
            } else {
                const t = (elapsed - (DURATION - 650)) / 650;
                const pushed = fightPosition.clone().lerp(fightTarget, 0.12);
                place(
                    blend(pushed, homePosition, t),
                    blend(fightTarget, homeTarget, t),
                );
            }
        },
        finish() {
            place(homePosition, homeTarget);
        },
    };

    const inTheWay = bystanders.filter((piece) =>
        nearSegment(piece.position, fightPosition, fightTarget, 0.75),
    );

    return [swoop, seeThrough(inTheWay)];
}

/**
 * Pieces standing between the camera and the fight fade to ghosts while
 * the camera is close, then come back.
 */
function seeThrough(pieces: Object3D[]): Beat {
    const swaps: {
        mesh: Mesh;
        original: Material | Material[];
        ghost: Material;
    }[] = [];

    for (const piece of pieces) {
        piece.traverse((object) => {
            if (object instanceof Mesh && !Array.isArray(object.material)) {
                const ghost = object.material.clone();
                ghost.transparent = true;
                ghost.depthWrite = false;
                swaps.push({ mesh: object, original: object.material, ghost });
                object.material = ghost;
            }
        });
    }

    return {
        update(elapsed) {
            const fadeOut = clamp01(elapsed / 450);
            const fadeIn = clamp01((elapsed - (DURATION - 500)) / 500);
            const opacity = lerp(1, 0.18, fadeOut * (1 - fadeIn));
            swaps.forEach(({ ghost }) => (ghost.opacity = opacity));
        },
        finish() {
            for (const { mesh, original, ghost } of swaps) {
                mesh.material = original;
                ghost.dispose();
            }
        },
    };
}

/** Face off, attack, defeat the defender and take the square. */
function defaultBeats(battle: BattleScene): Beat[] {
    return [
        faceOff(battle),
        attack(battle),
        takeSquare(battle),
        vanish(battle),
    ];
}

/** Until the defeat animation exists: the defender disappears on impact. */
function vanish(battle: BattleScene): Beat {
    return {
        update(elapsed) {
            battle.defender.object.visible = elapsed < IMPACT_AT;
        },
    };
}

/** Whether `point` is within `radius` of the line from `start` to `end`. */
function nearSegment(
    point: Vector3,
    start: Vector3,
    end: Vector3,
    radius: number,
): boolean {
    // Pieces are about a unit tall: test their middle.
    const middle = point.clone().setY(0.45);
    const line = end.clone().sub(start);
    const t = clamp01(middle.clone().sub(start).dot(line) / line.lengthSq());

    return start.clone().addScaledVector(line, t).distanceTo(middle) < radius;
}
