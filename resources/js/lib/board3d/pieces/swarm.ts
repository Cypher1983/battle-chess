import {
    BoxGeometry,
    ConeGeometry,
    DoubleSide,
    Group,
    IcosahedronGeometry,
    OctahedronGeometry,
    SphereGeometry,
    TorusGeometry,
} from 'three';
import type { Material } from 'three';
import type { PieceType } from '@/lib/armies';
import {
    glow,
    joint,
    lathe,
    limb,
    material,
    part,
    RIG,
    rod,
} from '@/lib/board3d/pieces/parts';

/**
 * The Void Swarm: an alien hive of glossy purple-black chitin, swollen
 * acid-green sacs, clicking mandibles and thin shimmering wings.
 */

const chitin = material({
    color: 0x3b1d52,
    roughness: 0.25,
    metalness: 0.35,
    flatShading: true,
});
const plate = material({
    color: 0x7a45a0,
    roughness: 0.35,
    metalness: 0.3,
    flatShading: true,
});
const bone = material({ color: 0xcfc6a4, roughness: 0.6, flatShading: true });
const membrane = material({
    color: 0xa8e6d0,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.45,
    side: DoubleSide,
    depthWrite: false,
});
const acid = glow(0x7dff3a, 0.55);
const eye = glow(0xc6ff4a, 0.65);
const sac = glow(0x4fd11f, 0.35);
sac.transparent = true;
sac.opacity = 0.9;

const builders: Record<PieceType, () => Group> = {
    p: skitterling,
    n: burrower,
    b: psionicBrood,
    r: carapaceHulk,
    q: hiveQueen,
    k: overmind,
};

export function buildSwarm(type: PieceType): Group {
    return builders[type]();
}

/** An egg-shaped mesh. */
function blob(
    radius: number,
    mat: Material,
    at: [number, number, number],
    stretch: [number, number, number],
    detail = 1,
): ReturnType<typeof part> {
    const mesh = part(new IcosahedronGeometry(radius, detail), mat, ...at);
    mesh.scale.set(...stretch);

    return mesh;
}

function eyes(
    group: Group,
    y: number,
    z: number,
    spread: number,
    size = 0.018,
): void {
    for (const side of [-1, 1]) {
        group.add(
            part(new SphereGeometry(size, 10, 8), eye, side * spread, y, z),
        );
    }
}

/** A pair of hooked jaws closing in front of the face. */
function mandibles(group: Group, y: number, z: number, size: number): void {
    for (const side of [-1, 1]) {
        const jaw = part(
            new ConeGeometry(size * 0.25, size, 4),
            bone,
            side * size * 0.35,
            y,
            z + size * 0.4,
        );
        jaw.rotation.set(Math.PI / 2, 0, side * 0.5);
        group.add(jaw);
    }
}

function antennae(group: Group, y: number, spread: number, length: number) {
    for (const side of [-1, 1]) {
        group.add(
            rod(
                [side * spread, y, 0.02],
                [side * (spread + length * 0.4), y + length, 0.06],
                0.006,
                chitin,
                0.003,
                4,
            ),
        );
    }
}

/** Thin, see-through wings folded up behind the back. */
function wings(
    group: Group,
    y: number,
    z: number,
    length: number,
    pairs = 1,
): void {
    for (let i = 0; i < pairs; i++) {
        for (const side of [-1, 1]) {
            const wing = part(
                new SphereGeometry(length / 2, 10, 6),
                membrane,
                side * (0.05 + length * 0.3),
                y + length * 0.3 - i * length * 0.25,
                z,
            );
            wing.scale.set(0.38, 1, 0.06);
            wing.rotation.set(-0.25, side * 0.35, side * (-0.55 - i * 0.5));
            group.add(wing);
        }
    }
}

/** A bug leg that does not move, bent at the knee. */
function staticLeg(
    group: Group,
    from: [number, number, number],
    knee: [number, number, number],
    foot: [number, number, number],
    radius: number,
): void {
    group.add(rod(from, knee, radius, chitin, radius * 0.8, 5));
    group.add(rod(knee, foot, radius * 0.8, chitin, radius * 0.3, 5));
}

/** Skitterling (pawn): a small two-legged bug soldier with blade forelimbs. */
function skitterling(): Group {
    const piece = new Group();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.05, 0.19, 0],
            0.12,
            0.02,
            chitin,
            plate,
        );
        end.add(
            part(new ConeGeometry(0.02, 0.07, 4), bone, 0, -0.01, 0.03).rotateX(
                Math.PI / 2,
            ),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.19, 0);
    body.add(blob(0.075, chitin, [0, 0.09, 0], [0.95, 1.2, 0.85]));
    body.add(blob(0.04, plate, [0, 0.12, 0.05], [1, 1, 0.6], 0));
    body.add(blob(0.07, chitin, [0, 0.04, -0.1], [0.9, 0.85, 1.3]));
    body.add(part(new SphereGeometry(0.03, 8, 6), sac, 0, 0.09, -0.12));
    body.add(part(new SphereGeometry(0.02, 8, 6), sac, 0.03, 0.06, -0.16));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.39, 0.03);
    head.add(blob(0.055, chitin, [0, 0, 0], [1, 0.85, 1.15]));
    eyes(head, 0.015, 0.05, 0.03, 0.016);
    mandibles(head, -0.025, 0.04, 0.05);
    antennae(head, 0.04, 0.02, 0.09);
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.08, 0.33, 0.02],
            0.1,
            0.015,
            chitin,
            plate,
        );
        end.add(
            part(new ConeGeometry(0.018, 0.2, 4), bone, 0, 0.055, 0.085)
                .rotateX(1.0)
                .rotateY(Math.PI / 4),
        );
        piece.add(pivot);
    }

    return piece;
}

/** Burrower (knight): a big six-legged digging beetle with a horn. */
function burrower(): Group {
    const piece = new Group();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.11, 0.12],
        [RIG.legFrontRight, -0.11, 0.12],
        [RIG.legBackLeft, 0.11, -0.12],
        [RIG.legBackRight, -0.11, -0.12],
    ] as const) {
        const { pivot } = limb(name, [x, 0.24, z], 0.2, 0.026, chitin, plate);
        pivot.rotation.z = x > 0 ? -0.5 : 0.5;
        piece.add(pivot);
    }

    for (const side of [-1, 1]) {
        staticLeg(
            piece,
            [side * 0.12, 0.24, 0],
            [side * 0.24, 0.2, 0.01],
            [side * 0.27, 0.06, 0.0],
            0.02,
        );
    }

    const body = joint(RIG.body, 0, 0.28, 0);
    const shell = part(
        new SphereGeometry(0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        chitin,
        0,
        0,
        -0.02,
    );
    shell.scale.set(1, 0.85, 1.3);
    body.add(shell);
    body.add(blob(0.18, plate, [0, -0.01, -0.02], [1, 0.4, 1.25]));
    body.add(part(new BoxGeometry(0.012, 0.012, 0.46), acid, 0, 0.17, -0.02));

    for (const [x, z] of [
        [0.08, -0.08],
        [-0.08, -0.08],
        [0.06, 0.06],
        [-0.06, 0.06],
    ]) {
        body.add(part(new SphereGeometry(0.022, 8, 6), sac, x, 0.14, z));
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.28, 0.25);
    head.add(blob(0.085, chitin, [0, 0, 0.02], [1.15, 0.8, 1]));
    head.add(rod([0, 0.03, 0.05], [0, 0.11, 0.12], 0.03, plate, 0.018, 6));
    head.add(rod([0, 0.11, 0.12], [0, 0.2, 0.1], 0.018, plate, 0.003, 6));
    eyes(head, 0.02, 0.08, 0.05, 0.016);
    mandibles(head, -0.03, 0.06, 0.07);
    piece.add(head);

    return piece;
}

/** Psionic Brood (bishop): a bug with a huge glowing brain and a spine staff. */
function psionicBrood(): Group {
    const piece = new Group();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.055, 0.2, 0],
            0.14,
            0.02,
            chitin,
            plate,
        );
        end.add(
            part(new ConeGeometry(0.02, 0.07, 4), bone, 0, -0.01, 0.03).rotateX(
                Math.PI / 2,
            ),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.2, 0);
    body.add(blob(0.08, chitin, [0, 0.05, -0.02], [1, 0.8, 1.1]));
    body.add(blob(0.07, plate, [0, 0.17, 0], [1, 1.35, 0.85]));
    body.add(blob(0.06, chitin, [0, 0.27, 0], [1.4, 0.5, 1], 0));
    body.add(part(new SphereGeometry(0.025, 8, 6), sac, 0, 0.17, 0.055));
    wings(body, 0.2, -0.07, 0.24);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.52, 0.01);
    head.add(blob(0.05, chitin, [0, -0.01, 0.04], [1, 0.9, 1.1]));
    eyes(head, 0, 0.085, 0.025, 0.014);
    mandibles(head, -0.04, 0.07, 0.04);
    head.add(blob(0.12, sac, [0, 0.12, -0.02], [1.05, 0.95, 1.1], 2));
    head.add(
        part(
            new TorusGeometry(0.1, 0.018, 6, 14),
            chitin,
            0,
            0.06,
            -0.02,
        ).rotateX(Math.PI / 2),
    );

    for (const side of [-1, 1]) {
        head.add(
            part(
                new TorusGeometry(0.09, 0.008, 4, 12, Math.PI),
                plate,
                0,
                0.13,
                -0.02,
            ).rotateY(Math.PI / 2 + side * 0.4),
        );
    }

    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.1, 0.44, 0.01],
        0.13,
        0.016,
        chitin,
        plate,
    );
    right.end.add(rod([0, -0.28, 0.03], [0, 0.3, 0.03], 0.012, bone, 0.009, 6));

    for (const [y, side] of [
        [-0.12, 1],
        [0.02, -1],
        [0.14, 1],
    ]) {
        right.end.add(
            part(
                new ConeGeometry(0.012, 0.06, 4),
                bone,
                side * 0.02,
                y,
                0.03,
            ).rotateZ(-side * 1.1),
        );
    }

    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        right.end.add(
            rod(
                [0, 0.29, 0.03],
                [Math.sin(angle) * 0.045, 0.37, 0.03 + Math.cos(angle) * 0.045],
                0.008,
                bone,
                0.003,
                4,
            ),
        );
    }

    right.end.add(part(new IcosahedronGeometry(0.035, 1), acid, 0, 0.34, 0.03));
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.1, 0.44, 0.01], 0.13, 0.016, chitin, plate).pivot,
    );

    return piece;
}

/** Carapace Hulk (rook): a heavily armoured beetle brute with crushing claws. */
function carapaceHulk(): Group {
    const piece = new Group();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.1, 0.18, 0],
            0.11,
            0.048,
            chitin,
            plate,
        );

        for (const turn of [-0.5, 0, 0.5]) {
            end.add(
                part(
                    new ConeGeometry(0.02, 0.07, 4),
                    bone,
                    Math.sin(turn) * 0.04,
                    -0.04,
                    Math.cos(turn) * 0.04,
                ).rotateX(Math.PI / 2),
            );
        }

        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.18, 0);
    body.add(blob(0.21, chitin, [0, 0.2, 0], [1.1, 1, 0.9]));
    const shell = part(
        new SphereGeometry(0.22, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        plate,
        0,
        0.18,
        -0.05,
    );
    shell.scale.set(1.12, 1.05, 0.9);
    shell.rotation.x = -0.5;
    body.add(shell);

    for (const y of [0.1, 0.18, 0.26]) {
        body.add(
            part(
                new BoxGeometry(0.2 - (y - 0.1), 0.05, 0.03),
                plate,
                0,
                y,
                0.18,
            ),
        );
        body.add(
            part(
                new BoxGeometry(0.14 - (y - 0.1), 0.01, 0.02),
                acid,
                0,
                y + 0.035,
                0.18,
            ),
        );
    }

    // Spiked shoulder plates like battlements.
    for (const side of [-1, 1]) {
        for (const z of [-0.06, 0.04]) {
            body.add(
                part(
                    new ConeGeometry(0.035, 0.1, 5),
                    plate,
                    side * 0.17,
                    0.4,
                    z,
                ),
            );
        }
    }

    body.add(part(new SphereGeometry(0.04, 8, 6), sac, 0.08, 0.3, -0.17));
    body.add(part(new SphereGeometry(0.03, 8, 6), sac, -0.09, 0.22, -0.18));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.52, 0.13);
    head.add(blob(0.07, chitin, [0, 0, 0], [1.2, 0.8, 1]));

    for (const x of [-0.03, 0, 0.03]) {
        head.add(
            part(
                new SphereGeometry(0.013, 8, 6),
                eye,
                x,
                0.02 - Math.abs(x) * 0.4,
                0.06,
            ),
        );
    }

    mandibles(head, -0.03, 0.05, 0.06);
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.27, 0.48, 0],
            0.17,
            0.045,
            chitin,
            plate,
        );
        const upper = part(
            new ConeGeometry(0.055, 0.16, 5),
            plate,
            0,
            -0.07,
            0.03,
        );
        upper.rotation.x = Math.PI - 0.45;
        end.add(upper);
        const lower = part(
            new ConeGeometry(0.04, 0.12, 5),
            bone,
            0,
            -0.06,
            -0.04,
        );
        lower.rotation.x = Math.PI + 0.45;
        end.add(lower);
        piece.add(pivot);
    }

    return piece;
}

/** The Hive Queen (queen): a tall regal insect queen with a crest and wings. */
function hiveQueen(): Group {
    const piece = new Group();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.2, 0.05],
                [0.21, 0.1],
                [0.16, 0.15],
                [0.18, 0.2],
                [0.13, 0.27],
                [0.145, 0.31],
                [0.1, 0.4],
                [0.065, 0.5],
                [0.085, 0.58],
                [0.095, 0.66],
                [0, 0.7],
            ],
            chitin,
            10,
        ),
    );

    for (const [y, r] of [
        [0.15, 0.16],
        [0.27, 0.13],
    ]) {
        body.add(
            part(new TorusGeometry(r, 0.01, 4, 16), acid, 0, y).rotateX(
                Math.PI / 2,
            ),
        );
    }

    body.add(blob(0.08, plate, [0, 0.6, 0.02], [1.1, 1, 0.8], 0));
    body.add(part(new SphereGeometry(0.03, 8, 6), sac, 0, 0.6, 0.085));
    wings(body, 0.6, -0.1, 0.4, 2);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.79, 0.01);
    head.add(blob(0.06, chitin, [0, 0, 0.01], [0.9, 1.25, 1]));
    head.add(blob(0.022, eye, [-0.032, 0.015, 0.05], [0.8, 1.3, 0.8]));
    head.add(blob(0.022, eye, [0.032, 0.015, 0.05], [0.8, 1.3, 0.8]));
    mandibles(head, -0.05, 0.04, 0.045);

    for (let i = 0; i < 5; i++) {
        const angle = ((i - 2) / 4) * 1.4;
        const spike = part(
            new ConeGeometry(0.02, 0.16 - Math.abs(i - 2) * 0.025, 4),
            plate,
            Math.sin(angle) * 0.06,
            0.09,
            -0.03,
        );
        spike.rotation.set(-0.35, 0, -angle * 0.7);
        head.add(spike);
        head.add(
            part(
                new OctahedronGeometry(0.012, 0),
                acid,
                Math.sin(angle) * 0.1,
                0.16 - Math.abs(i - 2) * 0.02,
                -0.06,
            ),
        );
    }

    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.11, 0.64, 0.01],
            0.2,
            0.015,
            chitin,
            plate,
        );
        end.add(
            part(
                new ConeGeometry(0.015, 0.09, 4),
                bone,
                0,
                -0.03,
                0.03,
            ).rotateX(2.4),
        );
        piece.add(pivot);
    }

    return piece;
}

/**
 * The Overmind (king): a huge pulsing brain crowned in chitin, carried on
 * spider legs and wielding a stinger sceptre.
 */
function overmind(): Group {
    const piece = new Group();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.12, 0.08],
        [RIG.legFrontRight, -0.12, 0.08],
        [RIG.legBackLeft, 0.12, -0.1],
        [RIG.legBackRight, -0.12, -0.1],
    ] as const) {
        const { pivot } = limb(name, [x, 0.27, z], 0.24, 0.026, chitin, plate);
        pivot.rotation.z = x > 0 ? -0.55 : 0.55;
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.27, 0);
    body.add(blob(0.13, chitin, [0, 0.02, -0.12], [1, 0.85, 1.3]));
    body.add(part(new SphereGeometry(0.04, 8, 6), sac, 0.06, 0.1, -0.17));
    body.add(part(new SphereGeometry(0.035, 8, 6), sac, -0.06, 0.07, -0.21));
    body.add(
        lathe(
            [
                [0.12, 0],
                [0.15, 0.08],
                [0.11, 0.2],
                [0.16, 0.34],
                [0.09, 0.43],
                [0, 0.44],
            ],
            chitin,
            9,
        ),
    );
    body.add(blob(0.06, plate, [0, 0.27, 0.1], [1.4, 1, 0.5], 0));
    body.add(part(new SphereGeometry(0.03, 8, 6), sac, 0, 0.27, 0.13));

    for (const side of [-1, 1]) {
        const spike = part(
            new ConeGeometry(0.04, 0.16, 5),
            chitin,
            side * 0.16,
            0.4,
            -0.02,
        );
        spike.rotation.z = -side * 0.6;
        body.add(spike);
    }

    wings(body, 0.36, -0.12, 0.34);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.77, 0.02);
    head.add(blob(0.065, chitin, [0, 0, 0.03], [1, 0.95, 1.05]));

    for (const [x, y] of [
        [-0.03, 0.01],
        [0.03, 0.01],
        [-0.017, 0.035],
        [0.017, 0.035],
    ]) {
        head.add(part(new SphereGeometry(0.013, 8, 6), eye, x, y, 0.085));
    }

    mandibles(head, -0.045, 0.06, 0.05);
    head.add(blob(0.14, sac, [0, 0.15, -0.02], [1.1, 0.9, 1.1], 2));
    head.add(
        part(
            new TorusGeometry(0.12, 0.02, 6, 16),
            plate,
            0,
            0.08,
            -0.02,
        ).rotateX(Math.PI / 2),
    );

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const spike = part(
            new ConeGeometry(0.018, 0.12, 4),
            chitin,
            Math.sin(angle) * 0.12,
            0.13,
            Math.cos(angle) * 0.12 - 0.02,
        );
        spike.rotation.set(Math.cos(angle) * 0.4, 0, -Math.sin(angle) * 0.4);
        head.add(spike);
    }

    const motes = joint(RIG.spinner, 0, 0.18, -0.02);

    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        motes.add(
            part(
                new OctahedronGeometry(0.02, 0),
                acid,
                Math.sin(angle) * 0.2,
                0,
                Math.cos(angle) * 0.2,
            ),
        );
    }

    head.add(motes);
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.18, 0.67, 0],
        0.22,
        0.028,
        chitin,
        plate,
    );
    right.end.add(
        rod([0, -0.12, 0.03], [0, 0.36, 0.03], 0.014, chitin, 0.012, 6),
    );
    right.end.add(part(new SphereGeometry(0.04, 10, 8), sac, 0, 0.39, 0.03));
    right.end.add(rod([0, 0.42, 0.03], [0, 0.48, 0.07], 0.022, bone, 0.012, 5));
    right.end.add(rod([0, 0.48, 0.07], [0, 0.46, 0.13], 0.012, acid, 0.002, 5));
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.18, 0.67, 0], 0.22, 0.028, chitin, plate).pivot,
    );

    return piece;
}
