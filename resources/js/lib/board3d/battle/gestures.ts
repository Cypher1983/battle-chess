import type { Object3D } from 'three';
import type { PieceType } from '@/lib/armies';
import { IMPACT_AT } from '@/lib/board3d/battle/core';
import type { BattleScene, Beat } from '@/lib/board3d/battle/core';
import { RIG } from '@/lib/board3d/pieces/parts';
import { clamp01, easeInOut, easeOut, lerp } from '@/lib/board3d/tweens';

/**
 * A pose: how far (radians, around x) each named joint is turned from
 * rest. Negative swings an arm forward and up; positive swings it back.
 */
type Pose = Partial<Record<string, number>>;

/** Keyframes: [scene time (ms), pose], played in order. */
type Moves = [number, Pose][];

const REST: Pose = {};

/** Spear thrust (pawn): pull back, then drive forward. */
const thrust: Moves = [
    [550, REST],
    [850, { [RIG.armRight]: 0.6, [RIG.armLeft]: -0.4, [RIG.head]: -0.1 }],
    [IMPACT_AT, { [RIG.armRight]: -1.5, [RIG.armLeft]: 0.3, [RIG.head]: 0.15 }],
];

/** Overhead chop (king and others with a weapon arm). */
const chop: Moves = [
    [550, REST],
    [850, { [RIG.armRight]: -2.7, [RIG.armLeft]: -0.5, [RIG.head]: -0.15 }],
    [IMPACT_AT, { [RIG.armRight]: -0.7, [RIG.armLeft]: 0.2, [RIG.head]: 0.2 }],
];

/** Casting: both arms rise while gathering, then fling forward. */
const cast: Moves = [
    [550, REST],
    [950, { [RIG.armRight]: -2.6, [RIG.armLeft]: -2.6, [RIG.head]: -0.25 }],
    [IMPACT_AT, { [RIG.armRight]: -1.4, [RIG.armLeft]: -1.4, [RIG.head]: 0.1 }],
];

/** Slam: arms up and legs tucked in the leap, arms crash down on landing. */
const pound: Moves = [
    [550, REST],
    [700, { [RIG.armRight]: -2.9, [RIG.armLeft]: -2.9 }],
    [
        1000,
        {
            [RIG.armRight]: -3,
            [RIG.armLeft]: -3,
            [RIG.legLeft]: -0.7,
            [RIG.legRight]: -0.7,
        },
    ],
    [IMPACT_AT, { [RIG.armRight]: -0.3, [RIG.armLeft]: -0.3 }],
];

/** Rear up before charging (four-legged pieces). */
const rear: Moves = [
    [550, REST],
    [
        850,
        {
            [RIG.legFrontLeft]: -0.9,
            [RIG.legFrontRight]: -0.7,
            [RIG.head]: -0.3,
            [RIG.tail]: 0.6,
        },
    ],
    [IMPACT_AT, { [RIG.head]: 0.3, [RIG.tail]: -0.3 }],
];

const attackMoves: Record<PieceType, Moves> = {
    p: thrust,
    n: rear,
    b: cast,
    q: cast,
    r: pound,
    k: chop,
};

/** The defender raises a guard and leans back as the blow comes in. */
const guard: Moves = [
    [IMPACT_AT - 350, REST],
    [
        IMPACT_AT - 50,
        { [RIG.armRight]: -1.6, [RIG.armLeft]: -1.6, [RIG.head]: -0.35 },
    ],
];

/** Every joint a pose can turn. */
const JOINTS: string[] = [
    RIG.head,
    RIG.armLeft,
    RIG.armRight,
    RIG.legLeft,
    RIG.legRight,
    RIG.legFrontLeft,
    RIG.legFrontRight,
    RIG.legBackLeft,
    RIG.legBackRight,
    RIG.tail,
];

type Joint = { name: string; node: Object3D; rest: number };

/** How long the attacker takes to settle back to rest after the blow. */
const SETTLE = 450;

/** The legs that run, and the dash during which they do. */
const RUN_FROM = 850;

function poseAt(moves: Moves, elapsed: number, joint: string): number {
    if (elapsed <= moves[0][0]) {
        return moves[0][1][joint] ?? 0;
    }

    for (let i = 1; i < moves.length; i++) {
        const [time, pose] = moves[i];
        const [before, previous] = moves[i - 1];

        if (elapsed < time) {
            const t = easeInOut(clamp01((elapsed - before) / (time - before)));

            return lerp(previous[joint] ?? 0, pose[joint] ?? 0, t);
        }
    }

    return moves[moves.length - 1][1][joint] ?? 0;
}

/**
 * Characters act out the fight with their limbs: the attacker winds up and
 * strikes (or casts, or pounds), runs on the dash, and settles afterwards;
 * the defender throws up a guard.
 */
export function gestures(battle: BattleScene): Beat {
    const { attacker, defender } = battle;
    const moves = attackMoves[attacker.type];
    const charges =
        attacker.type === 'p' || attacker.type === 'k' || attacker.type === 'n';

    const rig = (piece: Object3D): Joint[] => {
        const joints: Joint[] = [];

        for (const name of JOINTS) {
            const node = piece.getObjectByName(name);

            if (node) {
                joints.push({ name, node, rest: node.rotation.x });
            }
        }

        return joints;
    };

    const attackerRig = rig(attacker.object);
    const defenderRig = rig(defender.object);

    return {
        update(elapsed) {
            const settle =
                1 - easeOut(clamp01((elapsed - IMPACT_AT - 150) / SETTLE));
            const running =
                charges && elapsed >= RUN_FROM && elapsed < IMPACT_AT;
            const stride = Math.sin(elapsed / 45) * 0.8;

            for (const { name, node, rest } of attackerRig) {
                let turn =
                    poseAt(moves, elapsed, name) *
                    (elapsed > IMPACT_AT ? settle : 1);

                if (running) {
                    if (
                        name === RIG.legLeft ||
                        name === RIG.legFrontLeft ||
                        name === RIG.legBackRight
                    ) {
                        turn += stride;
                    } else if (
                        name === RIG.legRight ||
                        name === RIG.legFrontRight ||
                        name === RIG.legBackLeft
                    ) {
                        turn -= stride;
                    }
                }

                node.rotation.x = rest + turn;
            }

            if (elapsed < IMPACT_AT) {
                for (const { name, node, rest } of defenderRig) {
                    node.rotation.x = rest + poseAt(guard, elapsed, name);
                }
            }
        },
        finish() {
            attackerRig.forEach(({ node, rest }) => (node.rotation.x = rest));
        },
    };
}
