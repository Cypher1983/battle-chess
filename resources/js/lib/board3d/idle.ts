import type { Object3D } from 'three';
import { RIG } from '@/lib/board3d/pieces/parts';

type IdleRig = {
    phase: number;
    body?: { node: Object3D; y: number };
    head?: { node: Object3D; yaw: number };
    arms: { node: Object3D; roll: number; side: number }[];
    spinner?: { node: Object3D; turn: number };
    swinger?: Object3D;
    tail?: { node: Object3D; yaw: number };
};

const rigs = new WeakMap<Object3D, IdleRig>();

/** The parts a character idles with, and their rest positions. */
function rigOf(piece: Object3D): IdleRig {
    let rig = rigs.get(piece);

    if (rig) {
        return rig;
    }

    const find = (name: string): Object3D | undefined =>
        piece.getObjectByName(name);
    const body = find(RIG.body);
    const head = find(RIG.head);
    const spinner = find(RIG.spinner);
    const tail = find(RIG.tail);

    rig = {
        // Spread the characters' rhythms so they don't move in step.
        phase: (piece.id * 2.399) % (Math.PI * 2),
        body: body && { node: body, y: body.position.y },
        head: head && { node: head, yaw: head.rotation.y },
        arms: [
            [RIG.armLeft, 1],
            [RIG.armRight, -1],
        ]
            .map(([name, side]) => ({
                node: find(name as string),
                side: side as number,
            }))
            .filter(
                (arm): arm is { node: Object3D; side: number } =>
                    arm.node !== undefined,
            )
            .map(({ node, side }) => ({ node, side, roll: node.rotation.z })),
        spinner: spinner && { node: spinner, turn: spinner.rotation.y },
        swinger: find(RIG.swinger),
        tail: tail && { node: tail, yaw: tail.rotation.y },
    };
    rigs.set(piece, rig);

    return rig;
}

/**
 * Bring the characters to life while the board is still: they breathe,
 * look around and sway their arms; halos turn, pendulums swing and tails
 * wag. `now` is the time in ms.
 */
export function animateIdle(pieces: Iterable<Object3D>, now: number): void {
    const seconds = now / 1000;

    for (const piece of pieces) {
        const rig = rigOf(piece);
        const t = seconds + rig.phase;

        if (rig.body) {
            rig.body.node.position.y = rig.body.y + Math.sin(t * 2.2) * 0.006;
        }

        if (rig.head) {
            // Mostly still, with an occasional slow look to the side.
            const look = Math.sin(t * 0.45) ** 3;
            rig.head.node.rotation.y = rig.head.yaw + look * 0.45;
        }

        for (const arm of rig.arms) {
            arm.node.rotation.z =
                arm.roll + arm.side * (0.06 + Math.sin(t * 2.2) * 0.04);
        }

        if (rig.spinner) {
            rig.spinner.node.rotation.y = rig.spinner.turn + seconds * 0.8;
        }

        if (rig.swinger) {
            rig.swinger.rotation.z = Math.sin(seconds * Math.PI) * 0.3;
        }

        if (rig.tail) {
            rig.tail.node.rotation.y = rig.tail.yaw + Math.sin(t * 5) * 0.35;
        }
    }
}
