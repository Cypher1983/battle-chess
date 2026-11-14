import { Group, Vector3 } from 'three';
import type { Object3D, PerspectiveCamera, Scene } from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { PieceColor, PieceType } from '@/lib/armies';
import type { Stage } from '@/lib/board3d/stage';
import { clamp01, easeInOut, lerp } from '@/lib/board3d/tweens';

/** Scene time (ms) at which the blow lands. */
export const IMPACT_AT = 1300;

/** Total length of a battle (ms). */
export const DURATION = 2900;

export type Combatant = {
    color: PieceColor;
    type: PieceType;
    object: Object3D;
    /** Where the piece stands when the battle starts. */
    position: Vector3;
};

export type BattleOptions = {
    attacker: Combatant;
    defender: Combatant;
    /** Where the attacker ends up (the square it moved to). */
    destination: Vector3;
    signal?: AbortSignal;
    /** Called every frame with the scene time, e.g. to sync sounds. */
    onProgress?: (elapsedMs: number) => void;
};

/** What a battle needs from the board. */
export type BattleContext = {
    stage: Stage;
    controls: OrbitControls;
};

/**
 * Everything that happens in a battle is a "beat": a function called every
 * frame with the scene time, plus an optional clean-up for when the battle
 * ends (or is skipped).
 */
export type Beat = {
    update: (elapsed: number) => void;
    finish?: () => void;
};

export type BattleScene = {
    scene: Scene;
    /** A group for temporary objects (effects, debris); removed at the end. */
    props: Group;
    attacker: Combatant;
    defender: Combatant;
    /** Unit vector from attacker to defender, flat on the board. */
    heading: Vector3;
    /** Where the attacker stops when it reaches the defender. */
    contact: Vector3;
    destination: Vector3;
    shake: (strength: number) => void;
};

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
    );
    const steps = [camera, ...beats(battle)];

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
): Beat {
    const homePosition = camera.position.clone();
    const homeTarget = controls.target.clone();

    const middle = from.clone().add(to).multiplyScalar(0.5);
    const along = to.clone().sub(from).setY(0);

    if (along.lengthSq() === 0) {
        along.set(0, 0, -1);
    }

    along.normalize();
    const side = new Vector3(-along.z, 0, along.x);

    if (side.dot(homePosition.clone().sub(middle)) < 0) {
        side.negate();
    }

    const span = Math.max(from.distanceTo(to), 1);
    const fightPosition = middle
        .clone()
        .addScaledVector(side, 3.4 + span * 0.5)
        .add(new Vector3(0, 2.0 + span * 0.25, 0));
    const fightTarget = middle.clone().setY(0.45);

    const place = (position: Vector3, target: Vector3): void => {
        camera.position.copy(position);
        controls.target.copy(target);
        camera.lookAt(target);
    };

    const blend = (from: Vector3, to: Vector3, t: number): Vector3 =>
        from.clone().lerp(to, easeInOut(clamp01(t)));

    return {
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
}

/** Until attack styles exist: walk up, strike, then take the square. */
function defaultBeats(battle: BattleScene): Beat[] {
    return [
        faceOff(battle),
        approach(battle),
        takeSquare(battle),
        vanish(battle),
    ];
}

/**
 * The two pieces turn to face each other, and the attacker turns back to
 * face the enemy lines once it has taken the square.
 */
export function faceOff(battle: BattleScene): Beat {
    const { attacker, defender, heading } = battle;
    const attackerHome = attacker.object.rotation.y;
    const defenderHome = defender.object.rotation.y;
    const towardsDefender = Math.atan2(heading.x, heading.z);
    const towardsAttacker = Math.atan2(-heading.x, -heading.z);

    const turn = (from: number, to: number, t: number): number => {
        const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));

        return from + delta * easeInOut(clamp01(t));
    };

    return {
        update(elapsed) {
            if (elapsed < IMPACT_AT) {
                const t = (elapsed - 250) / 350;
                attacker.object.rotation.y = turn(
                    attackerHome,
                    towardsDefender,
                    t,
                );
                defender.object.rotation.y = turn(
                    defenderHome,
                    towardsAttacker,
                    t,
                );
            } else {
                const t = (elapsed - (IMPACT_AT + 1000)) / 400;
                attacker.object.rotation.y = turn(
                    towardsDefender,
                    attackerHome,
                    t,
                );
            }
        },
        finish() {
            attacker.object.rotation.y = attackerHome;
        },
    };
}

/** The attacker walks up to the defender, arriving at the moment of impact. */
export function approach(battle: BattleScene): Beat {
    const { attacker, contact } = battle;

    return {
        update(elapsed) {
            const t = clamp01((elapsed - 550) / (IMPACT_AT - 550));
            attacker.object.position.lerpVectors(
                attacker.position,
                contact,
                easeInOut(t),
            );
        },
    };
}

/** After the blow, the attacker steps onto the captured square. */
export function takeSquare(battle: BattleScene): Beat {
    const { attacker, destination } = battle;
    const start = IMPACT_AT + 450;
    let from: Vector3 | null = null;

    return {
        update(elapsed) {
            if (elapsed < start) {
                return;
            }

            from ??= attacker.object.position.clone();
            const t = easeInOut(clamp01((elapsed - start) / 550));
            attacker.object.position.lerpVectors(from, destination, t);
            attacker.object.position.y =
                from.y * (1 - t) + Math.sin(Math.PI * t) * 0.12;
        },
    };
}

/** Until the defeat animation exists: the defender disappears on impact. */
function vanish(battle: BattleScene): Beat {
    return {
        update(elapsed) {
            battle.defender.object.visible = elapsed < IMPACT_AT;
        },
    };
}
