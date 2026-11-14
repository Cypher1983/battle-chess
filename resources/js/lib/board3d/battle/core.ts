import type { Group, Object3D, PointLight, Scene, Vector3 } from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { ArmyId, PieceColor, PieceType } from '@/lib/armies';
import type { Stage } from '@/lib/board3d/stage';
import { clamp01, easeInOut } from '@/lib/board3d/tweens';

/** Scene time (ms) at which the blow lands. */
export const IMPACT_AT = 1300;

/** Total length of a battle (ms). */
export const DURATION = 2900;

export type Combatant = {
    army: ArmyId;
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
    /** The other pieces, so the camera can see past them. */
    bystanders?: Object3D[];
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
    /** The stage's effect light; switched off when the battle ends. */
    light: PointLight;
    attacker: Combatant;
    defender: Combatant;
    /** Unit vector from attacker to defender, flat on the board. */
    heading: Vector3;
    /** Where the attacker stops when it reaches the defender. */
    contact: Vector3;
    destination: Vector3;
    shake: (strength: number) => void;
    /** Brighten the whole picture for a moment (0.5 = half again). */
    flash: (strength: number) => void;
};

/** Call `strike` once, on the first frame at or after the impact. */
export function onImpact(strike: () => void): (elapsed: number) => void {
    let struck = false;

    return (elapsed) => {
        if (!struck && elapsed >= IMPACT_AT) {
            struck = true;
            strike();
        }
    };
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
