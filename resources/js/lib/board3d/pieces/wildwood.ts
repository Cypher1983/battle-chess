import {
    BoxGeometry,
    ConeGeometry,
    CylinderGeometry,
    DoubleSide,
    Group,
    IcosahedronGeometry,
    SphereGeometry,
    TorusGeometry,
} from 'three';
import type { Mesh } from 'three';
import type { PieceType } from '@/lib/armies';
import {
    capsule,
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
 * The Wildwood Court (black): living bark, moss and thorns with glowing
 * green eyes. Each is a character with a head, limbs (named with RIG) and
 * its own silhouette, rooted on a mossy pad.
 */

const bark = material({ color: 0x5a3d24, roughness: 0.95, flatShading: true });
const darkBark = material({
    color: 0x3b2817,
    roughness: 0.95,
    flatShading: true,
});
const moss = material({ color: 0x3f8f3a, roughness: 0.9, flatShading: true });
const robe = material({ color: 0x2c5e27, roughness: 0.95, flatShading: true });
const leaf = material({
    color: 0x8fcf6a,
    roughness: 0.7,
    side: DoubleSide,
    flatShading: true,
});
const thorn = material({ color: 0xd6336c, roughness: 0.5 });
const antler = material({ color: 0xd9c9a3, roughness: 0.75 });
const fur = material({ color: 0x2f2a22, roughness: 1, flatShading: true });
const mushroom = material({ color: 0xc23b2e, roughness: 0.6 });
const spots = material({ color: 0xf3ead2, roughness: 0.8 });
const hollow = material({ color: 0x120c06, roughness: 1 });
const eye = glow(0xc6ff6a, 0.6);
const amber = glow(0xffcf5a, 0.6);
const blossom = glow(0xff8fc0, 0.35);

const builders: Record<PieceType, () => Group> = {
    p: sproutling,
    n: briarWolf,
    b: mossOracle,
    r: oldBark,
    q: thornmother,
    k: elderStag,
};

export function buildWildwood(type: PieceType): Group {
    const piece = builders[type]();
    piece.name = `b${type}`;

    return piece;
}

/** Every Wildwood character is rooted on a mossy pad. */
function base(): Group {
    const group = new Group();
    group.add(part(new CylinderGeometry(0.28, 0.31, 0.04, 9), bark, 0, 0.02));
    group.add(part(new CylinderGeometry(0.26, 0.28, 0.025, 9), moss, 0, 0.05));

    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + 0.4;
        group.add(
            rod(
                [Math.sin(angle) * 0.24, 0.04, Math.cos(angle) * 0.24],
                [Math.sin(angle) * 0.36, 0.005, Math.cos(angle) * 0.36],
                0.03,
                bark,
                0.01,
                5,
            ),
        );
    }

    return group;
}

/** A leaf: a flattened, pointed blob. */
function leafAt(
    x: number,
    y: number,
    z: number,
    tilt: number,
    turn: number,
    size = 1,
): Mesh {
    const mesh = part(new SphereGeometry(0.1 * size, 8, 6), leaf, x, y, z);
    mesh.scale.set(1, 0.18, 0.5);
    mesh.rotation.set(0, turn, tilt);

    return mesh;
}

function eyes(
    group: Group,
    y: number,
    z: number,
    spread: number,
    size = 0.024,
    mat = eye,
): void {
    for (const side of [-1, 1]) {
        group.add(
            part(new SphereGeometry(size, 10, 8), mat, side * spread, y, z),
        );
    }
}

/** Two stubby root legs, hips at height `hip`. */
function rootLegs(
    piece: Group,
    hip: number,
    spread: number,
    thick: number,
): void {
    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * spread, hip, 0],
            hip - 0.07,
            thick,
            bark,
            darkBark,
        );

        for (const turn of [-0.6, 0, 0.6]) {
            end.add(
                rod(
                    [0, 0, 0],
                    [Math.sin(turn) * 0.07, -0.02, Math.cos(turn) * 0.07],
                    thick * 0.7,
                    darkBark,
                    0.006,
                    5,
                ),
            );
        }

        piece.add(pivot);
    }
}

/** Sproutling (pawn): a round seedling with big eyes and a leaf top. */
function sproutling(): Group {
    const piece = base();
    rootLegs(piece, 0.16, 0.06, 0.025);

    const body = joint(RIG.body, 0, 0.16, 0);
    const bulb = part(new IcosahedronGeometry(0.13, 1), moss, 0, 0.11);
    bulb.scale.set(1, 1.1, 0.95);
    body.add(bulb);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.3, 0);
    eyes(head, 0, 0.1, 0.05, 0.03);
    head.add(part(new BoxGeometry(0.05, 0.012, 0.01), hollow, 0, -0.06, 0.115));
    head.add(rod([0, 0.08, 0], [0.02, 0.2, 0], 0.016, bark, 0.012, 6));
    head.add(leafAt(-0.07, 0.19, 0, 0.5, 0, 1.1));
    head.add(leafAt(0.09, 0.23, 0, -0.5, 0, 1.2));
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const arm = joint(name, side * 0.12, 0.3, 0);
        arm.add(
            rod([0, 0, 0], [side * 0.08, -0.1, 0.02], 0.014, bark, 0.01, 5),
        );
        arm.add(leafAt(side * 0.09, -0.11, 0.02, side * 0.8, 0, 0.5));
        piece.add(arm);
    }

    return piece;
}

/** Briar Wolf (knight): a four-legged bramble wolf with a thorn spine. */
function briarWolf(): Group {
    const piece = base();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.07, 0.14],
        [RIG.legFrontRight, -0.07, 0.14],
        [RIG.legBackLeft, 0.075, -0.13],
        [RIG.legBackRight, -0.075, -0.13],
    ] as const) {
        const { pivot } = limb(name, [x, 0.3, z], 0.24, 0.03, fur, darkBark);
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.36, 0);
    body.add(capsule(0.11, 0.24, fur, 0, 0, 0).rotateX(Math.PI / 2));
    body.add(part(new TorusGeometry(0.1, 0.04, 6, 12), moss, 0, 0.02, 0.12));

    for (let i = 0; i < 6; i++) {
        const z = 0.14 - i * 0.06;
        body.add(
            rod([0, 0.09, z], [0, 0.17, z - 0.05], 0.022, thorn, 0.002, 5),
        );
    }

    const tail = joint(RIG.tail, 0, 0.03, -0.2);
    tail.add(rod([0, 0, 0], [0, 0.08, -0.16], 0.04, fur, 0.015, 6));
    tail.add(leafAt(0, 0.1, -0.18, 0.3, Math.PI / 2, 0.7));
    body.add(tail);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.54, 0.2);
    head.add(part(new BoxGeometry(0.17, 0.15, 0.17), fur, 0, 0, 0));
    head.add(part(new BoxGeometry(0.1, 0.08, 0.16), fur, 0, -0.03, 0.13));
    head.add(
        part(new BoxGeometry(0.045, 0.035, 0.03), hollow, 0, -0.01, 0.215),
    );
    head.add(part(new BoxGeometry(0.09, 0.015, 0.1), thorn, 0, -0.07, 0.13));

    for (const side of [-1, 1]) {
        const ear = part(
            new ConeGeometry(0.035, 0.11, 5),
            fur,
            side * 0.055,
            0.12,
            -0.02,
        );
        ear.rotation.z = -side * 0.25;
        head.add(ear);
    }

    eyes(head, 0.03, 0.085, 0.05, 0.022, amber);
    piece.add(head);

    return piece;
}

/**
 * Moss Oracle (bishop): a hunched, hooded shaman with toadstools on its
 * shoulders and a staff tipped with a glowing seed.
 */
function mossOracle(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.22, 0.05],
                [0.2, 0.12],
                [0.15, 0.35],
                [0.11, 0.5],
                [0, 0.52],
            ],
            robe,
            9,
        ),
    );

    for (const side of [-1, 1]) {
        body.add(
            part(
                new CylinderGeometry(0.012, 0.016, 0.05, 6),
                spots,
                side * 0.12,
                0.5,
                -0.02,
            ),
        );
        const cap = part(
            new SphereGeometry(0.055, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
            mushroom,
            side * 0.12,
            0.52,
            -0.02,
        );
        cap.scale.y = 0.6;
        body.add(cap);
    }

    body.add(leafAt(0, 0.2, 0.16, 0, Math.PI / 2, 0.9));
    body.add(
        part(new TorusGeometry(0.15, 0.018, 6, 14), darkBark, 0, 0.32).rotateX(
            Math.PI / 2,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.6, 0.02);
    const hood = part(new IcosahedronGeometry(0.12, 1), robe);
    hood.scale.set(1, 1.05, 1);
    head.add(hood);
    head.add(part(new SphereGeometry(0.075, 12, 10), hollow, 0, -0.01, 0.06));
    eyes(head, 0, 0.12, 0.03, 0.02);
    head.add(
        part(new ConeGeometry(0.08, 0.22, 7), moss, 0, 0.17, -0.03).rotateX(
            -0.25,
        ),
    );
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.15, 0.44, 0.02],
        0.15,
        0.025,
        moss,
        bark,
    );
    right.end.add(
        rod([0, -0.32, 0.03], [0, 0.38, 0.03], 0.015, darkBark, 0.012, 6),
    );
    right.end.add(
        part(
            new IcosahedronGeometry(0.045, 0),
            glow(0xc6ff6a, 0.6),
            0,
            0.42,
            0.03,
        ),
    );
    right.end.add(leafAt(0.03, 0.34, 0.03, -0.4, 0, 0.5));
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.15, 0.44, 0.02], 0.15, 0.025, moss, bark).pivot,
    );

    return piece;
}

/**
 * Old Bark (rook): a walking treant with a face in its trunk, heavy branch
 * arms and a leafy crown.
 */
function oldBark(): Group {
    const piece = base();
    rootLegs(piece, 0.17, 0.1, 0.045);

    const body = joint(RIG.body, 0, 0.15, 0);
    body.add(part(new CylinderGeometry(0.15, 0.2, 0.5, 8), bark, 0, 0.25));
    body.add(part(new BoxGeometry(0.1, 0.04, 0.03), hollow, 0, 0.22, 0.18));
    eyes(body, 0.36, 0.165, 0.055, 0.026);
    body.add(
        part(
            new BoxGeometry(0.12, 0.02, 0.03),
            darkBark,
            0,
            0.42,
            0.16,
        ).rotateZ(0.15),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.7, 0);

    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.sin(angle);
        const z = Math.cos(angle);
        head.add(
            rod(
                [x * 0.06, -0.06, z * 0.06],
                [x * 0.17, 0.08, z * 0.17],
                0.03,
                darkBark,
                0.015,
                5,
            ),
        );
        head.add(
            part(
                new IcosahedronGeometry(0.1, 0),
                moss,
                x * 0.17,
                0.12,
                z * 0.17,
            ),
        );
    }

    head.add(part(new IcosahedronGeometry(0.14, 0), moss, 0, 0.17));
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.2, 0.58, 0],
            0.22,
            0.045,
            bark,
            darkBark,
        );

        for (const turn of [-0.7, 0, 0.7]) {
            end.add(
                rod(
                    [0, 0, 0],
                    [
                        Math.sin(turn) * 0.07,
                        -0.08,
                        0.04 + Math.cos(turn) * 0.03,
                    ],
                    0.02,
                    darkBark,
                    0.006,
                    5,
                ),
            );
        }

        end.add(
            part(new IcosahedronGeometry(0.06, 0), moss, side * 0.03, 0.06, 0),
        );
        piece.add(pivot);
    }

    return piece;
}

/**
 * Thornmother (queen): a slender dryad in a gown of leaves with a crown of
 * thorns and long vine arms.
 */
function thornmother(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.06, 0.05],
                [0.07, 0.4],
                [0.055, 0.55],
                [0.07, 0.66],
                [0, 0.68],
            ],
            darkBark,
            9,
        ),
    );

    // A layered gown of big leaves.
    for (const [y, radius, count, size] of [
        [0.12, 0.17, 9, 1.4],
        [0.26, 0.13, 8, 1.2],
        [0.4, 0.09, 7, 1],
    ]) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            body.add(
                leafAt(
                    Math.sin(angle) * radius,
                    y,
                    Math.cos(angle) * radius,
                    0.9,
                    angle + Math.PI / 2,
                    size,
                ),
            );
        }
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.78, 0);
    head.add(part(new IcosahedronGeometry(0.085, 1), bark));
    eyes(head, 0.01, 0.075, 0.03, 0.018);
    head.add(capsule(0.035, 0.2, moss, 0, -0.04, -0.07).rotateX(0.3));

    for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        const x = Math.sin(angle);
        const z = Math.cos(angle);
        head.add(
            rod(
                [x * 0.06, 0.05, z * 0.06],
                [x * 0.12, 0.22, z * 0.12],
                0.02,
                thorn,
                0.002,
                5,
            ),
        );
    }

    for (const angle of [0.6, 2.4, 4.4]) {
        head.add(
            part(
                new IcosahedronGeometry(0.03, 0),
                blossom,
                Math.sin(angle) * 0.09,
                0.08,
                Math.cos(angle) * 0.09,
            ),
        );
    }

    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const arm = joint(name, side * 0.07, 0.64, 0);
        arm.add(
            rod([0, 0, 0], [side * 0.1, -0.12, 0.04], 0.016, moss, 0.012, 6),
        );
        arm.add(
            rod(
                [side * 0.1, -0.12, 0.04],
                [side * 0.13, -0.28, 0.08],
                0.012,
                moss,
                0.007,
                6,
            ),
        );
        arm.add(
            rod(
                [side * 0.11, -0.18, 0.05],
                [side * 0.15, -0.17, 0.06],
                0.01,
                thorn,
                0.002,
                5,
            ),
        );
        arm.add(leafAt(side * 0.13, -0.3, 0.08, side * 0.5, 0, 0.5));
        piece.add(arm);
    }

    return piece;
}

/**
 * The Elder Stag (king): an upright stag lord in a mossy cloak, with a
 * great antler crown and a rowan staff.
 */
function elderStag(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.25, 0.05],
                [0.23, 0.12],
                [0.16, 0.42],
                [0.12, 0.6],
                [0.15, 0.66],
                [0, 0.68],
            ],
            moss,
            9,
        ),
    );
    body.add(
        part(new CylinderGeometry(0.11, 0.13, 0.4, 8), darkBark, 0, 0.42, 0.04),
    );
    body.add(
        part(new TorusGeometry(0.13, 0.04, 6, 12), moss, 0, 0.64).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new IcosahedronGeometry(0.03, 0), blossom, 0.06, 0.66, 0.12));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.8, 0.02);
    head.add(part(new BoxGeometry(0.13, 0.14, 0.15), bark, 0, 0, 0));
    head.add(part(new BoxGeometry(0.08, 0.08, 0.13), bark, 0, -0.04, 0.12));
    head.add(part(new BoxGeometry(0.04, 0.03, 0.02), hollow, 0, -0.03, 0.19));
    eyes(head, 0.02, 0.075, 0.05, 0.02);

    for (const side of [-1, 1]) {
        const s = side;
        const ear = part(
            new ConeGeometry(0.03, 0.09, 5),
            bark,
            s * 0.08,
            0.05,
            -0.02,
        );
        ear.rotation.z = -s * 1.1;
        head.add(ear);
        head.add(
            rod(
                [s * 0.04, 0.06, 0],
                [s * 0.17, 0.22, -0.03],
                0.018,
                antler,
                0.013,
                6,
            ),
        );
        head.add(
            rod(
                [s * 0.17, 0.22, -0.03],
                [s * 0.22, 0.36, -0.06],
                0.013,
                antler,
                0.008,
                6,
            ),
        );
        head.add(
            rod(
                [s * 0.1, 0.14, -0.01],
                [s * 0.08, 0.25, 0.05],
                0.011,
                antler,
                0.006,
                6,
            ),
        );
        head.add(
            rod(
                [s * 0.17, 0.22, -0.03],
                [s * 0.28, 0.25, 0.02],
                0.011,
                antler,
                0.006,
                6,
            ),
        );
        head.add(
            rod(
                [s * 0.2, 0.3, -0.05],
                [s * 0.15, 0.4, -0.02],
                0.009,
                antler,
                0.005,
                6,
            ),
        );
    }

    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.17, 0.6, 0.03],
        0.2,
        0.028,
        moss,
        bark,
    );
    right.end.add(
        rod([0, -0.4, 0.03], [0, 0.42, 0.03], 0.016, darkBark, 0.012, 6),
    );
    right.end.add(
        part(
            new IcosahedronGeometry(0.04, 0),
            glow(0xc6ff6a, 0.6),
            0,
            0.46,
            0.03,
        ),
    );

    for (const turn of [-0.8, 0.8]) {
        right.end.add(
            rod(
                [0, 0.42, 0.03],
                [Math.sin(turn) * 0.06, 0.5, 0.03],
                0.008,
                darkBark,
                0.004,
                5,
            ),
        );
    }

    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.17, 0.6, 0.03], 0.2, 0.028, moss, bark).pivot,
    );

    return piece;
}
