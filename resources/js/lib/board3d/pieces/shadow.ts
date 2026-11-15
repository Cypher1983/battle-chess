import {
    BoxGeometry,
    ConeGeometry,
    CylinderGeometry,
    DoubleSide,
    Group,
    IcosahedronGeometry,
    OctahedronGeometry,
    SphereGeometry,
    TorusGeometry,
} from 'three';
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
 * The Night Spirits: ghosts and shadow creatures. Pale lilac phantoms that
 * seem to shine from within, black smoke, tattered violet cloth, old iron
 * and green-white lantern light.
 */

const ghost = material({
    color: 0xe4def4,
    emissive: 0x9688c8,
    emissiveIntensity: 0.35,
    roughness: 0.7,
    flatShading: true,
});
const shroud = material({
    color: 0xb9a8dc,
    emissive: 0x5e4a90,
    emissiveIntensity: 0.3,
    roughness: 0.8,
    side: DoubleSide,
    flatShading: true,
});
const smoke = material({ color: 0x17141f, roughness: 1, flatShading: true });
const soot = material({ color: 0x2e2640, roughness: 1, flatShading: true });
const cloth = material({
    color: 0x45275f,
    roughness: 0.9,
    side: DoubleSide,
    flatShading: true,
});
const iron = material({ color: 0x5a5866, metalness: 0.7, roughness: 0.45 });
const stone = material({ color: 0x77738a, roughness: 1, flatShading: true });
const slate = material({ color: 0x2a2535, roughness: 0.9, flatShading: true });
const bone = material({ color: 0xece4d2, roughness: 0.6 });
const lantern = glow(0xc8ffd8, 0.8);
const eye = glow(0x9effc8, 0.7);
const pane = glow(0x9effc8, 0.45);
const spirit = glow(0xb68cff, 0.6);

const builders: Record<PieceType, () => Group> = {
    p: lanternWisp,
    n: shadowHound,
    b: hollowMonk,
    r: hauntedBelfry,
    q: banshee,
    k: paleKing,
};

export function buildShadow(type: PieceType): Group {
    return builders[type]();
}

/** Every Night Spirit hovers over a slab of grave slate ringed with mist. */
function base(): Group {
    const group = new Group();
    group.add(part(new CylinderGeometry(0.28, 0.3, 0.05, 10), slate, 0, 0.025));
    group.add(
        part(new TorusGeometry(0.23, 0.012, 5, 28), spirit, 0, 0.05).rotateX(
            Math.PI / 2,
        ),
    );

    return group;
}

/** A lump of drifting black smoke. */
function puff(radius: number, x: number, y: number, z: number, mat = smoke) {
    const mesh = part(new IcosahedronGeometry(radius, 0), mat, x, y, z);
    mesh.scale.set(1.2, 0.8, 1);

    return mesh;
}

/** Hollow dark sockets with a glowing point of light in each. */
function eyes(
    group: Group,
    y: number,
    z: number,
    spread: number,
    size = 0.02,
): void {
    for (const side of [-1, 1]) {
        group.add(
            part(new SphereGeometry(size, 8, 6), smoke, side * spread, y, z),
        );
        group.add(
            part(
                new SphereGeometry(size * 0.55, 8, 6),
                eye,
                side * spread,
                y,
                z + size * 0.6,
            ),
        );
    }
}

/** Torn strips hanging down in a ring, like a ragged hem. */
function tatters(
    group: Group,
    radius: number,
    y: number,
    count: number,
    length: number,
    mat = shroud,
): void {
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const strip = part(
            new ConeGeometry(0.035, length * (0.7 + (i % 3) * 0.2), 4),
            mat,
            Math.sin(angle) * radius,
            y,
            Math.cos(angle) * radius,
        );
        strip.rotation.set(Math.PI, angle, 0);
        group.add(strip);
    }
}

/** Lantern Wisp (pawn): a small hovering ghost holding up a lantern. */
function lanternWisp(): Group {
    const piece = base();
    piece.add(puff(0.05, 0.02, 0.08, 0.02, soot));

    const body = joint(RIG.body, 0, 0.1, 0);
    body.add(
        lathe(
            [
                [0.005, 0],
                [0.03, 0.03],
                [0.08, 0.1],
                [0.105, 0.18],
                [0.1, 0.24],
                [0.06, 0.28],
                [0, 0.29],
            ],
            ghost,
            12,
        ),
    );
    tatters(body, 0.085, 0.1, 6, 0.08, ghost);
    body.add(
        part(new TorusGeometry(0.08, 0.02, 6, 12), cloth, 0, 0.25).rotateX(
            Math.PI / 2,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.43, 0);
    head.add(part(new SphereGeometry(0.095, 14, 12), ghost));
    eyes(head, 0.01, 0.075, 0.035, 0.024);
    const mouth = part(new SphereGeometry(0.014, 8, 6), smoke, 0, -0.04, 0.085);
    mouth.scale.set(1, 1.4, 0.6);
    head.add(mouth);
    head.add(
        part(
            new ConeGeometry(0.035, 0.09, 6),
            ghost,
            0.015,
            0.1,
            -0.02,
        ).rotateZ(-0.5),
    );
    piece.add(head);

    const right = limb(RIG.armRight, [-0.1, 0.36, 0.02], 0.1, 0.02, ghost);
    const light = joint(RIG.swinger, 0, -0.01, 0.03);
    light.add(rod([0, 0, 0], [0, -0.04, 0], 0.004, iron));
    light.add(part(new ConeGeometry(0.036, 0.03, 6), iron, 0, -0.05));
    light.add(
        part(new CylinderGeometry(0.024, 0.024, 0.06, 6), lantern, 0, -0.095),
    );

    for (const angle of [0.5, 2.6, 4.7]) {
        light.add(
            part(
                new BoxGeometry(0.006, 0.06, 0.006),
                iron,
                Math.sin(angle) * 0.028,
                -0.095,
                Math.cos(angle) * 0.028,
            ),
        );
    }

    light.add(
        part(new CylinderGeometry(0.034, 0.03, 0.014, 6), iron, 0, -0.13),
    );
    right.end.add(light);
    piece.add(right.pivot);
    piece.add(limb(RIG.armLeft, [0.1, 0.36, 0.02], 0.09, 0.02, ghost).pivot);

    return piece;
}

/** Shadow Hound (knight): a smoky black hound with burning green eyes. */
function shadowHound(): Group {
    const piece = base();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.075, 0.12],
        [RIG.legFrontRight, -0.075, 0.12],
        [RIG.legBackLeft, 0.075, -0.12],
        [RIG.legBackRight, -0.075, -0.12],
    ] as const) {
        const { pivot, end } = limb(name, [x, 0.22, z], 0.14, 0.03, smoke);
        end.add(
            part(new BoxGeometry(0.05, 0.025, 0.07), smoke, 0, -0.02, 0.02),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.26, 0);
    body.add(capsule(0.09, 0.22, smoke, 0, 0, 0).rotateX(Math.PI / 2));

    // Ragged smoke rising off its back like a mane.
    for (let i = 0; i < 6; i++) {
        const z = 0.16 - i * 0.06;
        const tuft = part(
            new ConeGeometry(0.04, 0.12 - i * 0.01, 4),
            i % 2 ? soot : smoke,
            0,
            0.09,
            z,
        );
        tuft.rotation.x = -0.6;
        body.add(tuft);
    }

    body.add(puff(0.05, 0.07, 0.03, 0.1, soot));
    body.add(puff(0.05, -0.07, 0.02, -0.06, soot));
    body.add(part(new OctahedronGeometry(0.03, 0), spirit, 0, -0.02, 0.17));

    const tail = joint(RIG.tail, 0, 0.03, -0.2);
    tail.add(rod([0, 0, 0], [0, 0.12, -0.12], 0.035, smoke, 0.012, 5));
    tail.add(puff(0.04, 0, 0.14, -0.14, soot));
    body.add(tail);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.36, 0.2);
    head.add(part(new BoxGeometry(0.13, 0.11, 0.12), smoke));
    head.add(part(new BoxGeometry(0.08, 0.06, 0.12), smoke, 0, -0.025, 0.1));
    head.add(part(new SphereGeometry(0.018, 8, 6), soot, 0, -0.005, 0.16));

    for (const side of [-1, 1]) {
        head.add(
            part(
                new ConeGeometry(0.03, 0.09, 4),
                smoke,
                side * 0.045,
                0.09,
                -0.03,
            ).rotateZ(side * -0.3),
        );
        head.add(
            part(
                new ConeGeometry(0.008, 0.03, 4),
                bone,
                side * 0.025,
                -0.065,
                0.14,
            ).rotateX(Math.PI),
        );
        head.add(
            part(
                new SphereGeometry(0.018, 8, 6),
                eye,
                side * 0.038,
                0.02,
                0.06,
            ),
        );
    }

    const collar = part(
        new TorusGeometry(0.07, 0.014, 5, 12),
        iron,
        0,
        -0.02,
        -0.06,
    );
    head.add(collar);
    piece.add(head);

    return piece;
}

/** Hollow Monk (bishop): an empty, glowing hood with a censer staff. */
function hollowMonk(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.19, 0.05],
                [0.17, 0.12],
                [0.12, 0.42],
                [0.1, 0.56],
                [0, 0.58],
            ],
            cloth,
            8,
        ),
    );
    tatters(body, 0.17, 0.08, 8, 0.07, cloth);
    body.add(
        part(new TorusGeometry(0.125, 0.014, 6, 14), bone, 0, 0.32).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(rod([0.04, 0.31, 0.12], [0.06, 0.18, 0.15], 0.01, bone));
    body.add(part(new SphereGeometry(0.018, 8, 6), bone, 0.06, 0.17, 0.15));
    body.add(part(new BoxGeometry(0.05, 0.28, 0.015), soot, 0, 0.25, 0.15));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.66, 0.01);
    head.add(part(new ConeGeometry(0.11, 0.3, 8), cloth, 0, 0.06, -0.02));
    head.add(part(new SphereGeometry(0.07, 12, 10), smoke, 0, -0.01, 0.045));
    head.add(
        part(new TorusGeometry(0.068, 0.016, 6, 14), cloth, 0, -0.005, 0.07),
    );
    head.add(part(new SphereGeometry(0.03, 8, 6), spirit, 0, -0.02, 0.06));
    eyes(head, 0.005, 0.1, 0.026, 0.016);
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.13, 0.5, 0.02],
        0.15,
        0.024,
        cloth,
        ghost,
    );
    right.end.add(rod([0, -0.3, 0.03], [0, 0.34, 0.03], 0.012, iron));
    right.end.add(rod([0, 0.34, 0.03], [0, 0.36, 0.1], 0.008, iron));

    // The censer hangs from a hook and swings, trailing violet smoke.
    const censer = joint(RIG.swinger, 0, 0.36, 0.1);
    censer.add(rod([0, 0, 0], [0, -0.08, 0], 0.004, iron));
    censer.add(part(new SphereGeometry(0.035, 10, 8), iron, 0, -0.11));
    censer.add(
        part(new TorusGeometry(0.036, 0.007, 5, 12), spirit, 0, -0.11).rotateX(
            Math.PI / 2,
        ),
    );
    censer.add(part(new ConeGeometry(0.02, 0.03, 6), iron, 0, -0.08));
    censer.add(puff(0.025, 0.01, -0.04, 0.02, shroud));
    right.end.add(censer);
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.13, 0.5, 0.02], 0.15, 0.024, cloth, ghost).pivot,
    );

    return piece;
}

/**
 * Haunted Belfry (rook): a walking stone bell tower whose windows glow
 * with ghost light and whose bell still tolls.
 */
function hauntedBelfry(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.09, 0.17, 0],
            0.08,
            0.05,
            stone,
        );
        end.add(part(new BoxGeometry(0.11, 0.05, 0.13), stone, 0, -0.02, 0.02));
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.17, 0);
    body.add(part(new BoxGeometry(0.32, 0.38, 0.28), stone, 0, 0.19));
    body.add(part(new BoxGeometry(0.34, 0.025, 0.3), slate, 0, 0.12));
    body.add(part(new BoxGeometry(0.36, 0.04, 0.32), slate, 0, 0.39));

    // Two ghost-lit arched windows are its eyes; the door is its mouth.
    for (const side of [-1, 1]) {
        body.add(
            part(
                new BoxGeometry(0.05, 0.07, 0.01),
                pane,
                side * 0.07,
                0.27,
                0.141,
            ),
        );
        body.add(
            part(
                new CylinderGeometry(0.025, 0.025, 0.01, 10),
                pane,
                side * 0.07,
                0.305,
                0.141,
            ).rotateX(Math.PI / 2),
        );
        body.add(
            part(
                new BoxGeometry(0.01, 0.08, 0.05),
                pane,
                side * 0.161,
                0.27,
                0,
            ),
        );
    }

    body.add(part(new BoxGeometry(0.09, 0.1, 0.01), smoke, 0, 0.06, 0.141));
    body.add(
        part(
            new CylinderGeometry(0.045, 0.045, 0.01, 12),
            smoke,
            0,
            0.11,
            0.141,
        ).rotateX(Math.PI / 2),
    );
    body.add(part(new BoxGeometry(0.06, 0.01, 0.012), eye, 0, 0.08, 0.145));
    piece.add(body);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.2, 0.5, 0],
            0.16,
            0.045,
            stone,
        );
        end.add(part(new IcosahedronGeometry(0.06, 0), stone));
        piece.add(pivot);
    }

    // The bell chamber is its head: pillars, a slate spire and the bell.
    const head = joint(RIG.head, 0, 0.58, 0);

    for (const [x, z] of [
        [0.12, 0.1],
        [-0.12, 0.1],
        [0.12, -0.1],
        [-0.12, -0.1],
    ]) {
        head.add(part(new BoxGeometry(0.045, 0.17, 0.045), stone, x, 0.075, z));
    }

    head.add(part(new BoxGeometry(0.2, 0.15, 0.01), slate, 0, 0.075, -0.1));
    head.add(part(new SphereGeometry(0.025, 8, 6), lantern, 0, 0.1, -0.08));
    head.add(part(new BoxGeometry(0.31, 0.035, 0.27), slate, 0, 0.17));
    const spire = part(new ConeGeometry(0.22, 0.26, 4), slate, 0, 0.31);
    spire.rotation.y = Math.PI / 4;
    head.add(spire);
    head.add(rod([0, 0.42, 0], [0, 0.52, 0], 0.008, iron));
    head.add(part(new OctahedronGeometry(0.022, 0), spirit, 0, 0.53));

    const bell = joint(RIG.swinger, 0, 0.15, 0);
    bell.add(
        lathe(
            [
                [0.065, -0.12],
                [0.055, -0.105],
                [0.04, -0.05],
                [0.03, -0.02],
                [0, -0.015],
            ],
            iron,
            12,
        ),
    );
    bell.add(part(new SphereGeometry(0.018, 8, 6), iron, 0, -0.125));
    head.add(bell);
    piece.add(head);

    return piece;
}

/**
 * The Banshee (queen): a floating, wailing spirit woman with long hair
 * and a gown that dissolves into tatters.
 */
function banshee(): Group {
    const piece = base();
    piece.add(puff(0.07, 0.05, 0.08, -0.03, soot));
    piece.add(puff(0.05, -0.08, 0.07, 0.05, soot));

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.19, 0.12],
                [0.16, 0.2],
                [0.1, 0.42],
                [0.065, 0.56],
                [0.09, 0.64],
                [0, 0.66],
            ],
            ghost,
            12,
        ),
    );
    tatters(body, 0.16, 0.08, 9, 0.14);
    body.add(
        part(new TorusGeometry(0.075, 0.014, 6, 14), cloth, 0, 0.5).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new BoxGeometry(0.03, 0.3, 0.012), cloth, 0, 0.33, 0.12).rotateX(
            -0.22,
        ),
    );
    body.add(
        lathe(
            [
                [0.1, 0.6],
                [0.13, 0.68],
                [0.12, 0.72],
            ],
            shroud,
            10,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.76, 0);
    head.add(part(new SphereGeometry(0.07, 14, 12), ghost));
    eyes(head, 0.012, 0.055, 0.025, 0.017);
    const mouth = part(new SphereGeometry(0.018, 8, 6), smoke, 0, -0.035, 0.06);
    mouth.scale.set(0.8, 1.5, 0.6);
    head.add(mouth);
    head.add(part(new SphereGeometry(0.078, 12, 10), shroud, 0, 0.018, -0.02));

    // Long hair streaming down behind her.
    for (const x of [-0.06, -0.03, 0, 0.03, 0.06]) {
        head.add(
            rod(
                [x, 0.03, -0.05],
                [x * 2, -0.5 + Math.abs(x), -0.2],
                0.024,
                shroud,
                0.006,
                5,
            ),
        );
    }

    head.add(
        part(
            new TorusGeometry(0.072, 0.008, 5, 18),
            iron,
            0,
            0.035,
            0.005,
        ).rotateX(Math.PI / 2 - 0.3),
    );
    head.add(part(new OctahedronGeometry(0.02, 0), spirit, 0, 0.07, 0.06));
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.1, 0.63, 0],
            0.2,
            0.018,
            shroud,
            ghost,
        );
        end.add(
            part(
                new ConeGeometry(0.045, 0.16, 5),
                shroud,
                side * 0.01,
                0.04,
                -0.03,
            ),
        );
        piece.add(pivot);
    }

    return piece;
}

/**
 * The Pale King (king): a crowned phantom king in a tattered royal cloak,
 * bearing a sceptre that holds a captive spirit light.
 */
function paleKing(): Group {
    const piece = base();
    piece.add(puff(0.06, 0.1, 0.08, 0.05, soot));

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.21, 0.1],
                [0.19, 0.18],
                [0.14, 0.46],
                [0.15, 0.66],
                [0.1, 0.72],
                [0, 0.73],
            ],
            ghost,
            12,
        ),
    );
    tatters(body, 0.19, 0.08, 9, 0.12);
    body.add(
        part(new TorusGeometry(0.155, 0.018, 6, 16), iron, 0, 0.44).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new OctahedronGeometry(0.03, 0), eye, 0, 0.44, 0.16));

    // The royal cloak, rotted into ragged strips at the hem.
    const cloak = part(
        new BoxGeometry(0.42, 0.55, 0.02),
        cloth,
        0,
        0.42,
        -0.17,
    );
    cloak.rotation.x = 0.12;
    body.add(cloak);

    for (let i = 0; i < 5; i++) {
        const strip = part(
            new ConeGeometry(0.045, 0.1 + (i % 2) * 0.06, 4),
            cloth,
            -0.16 + i * 0.08,
            0.1 - (i % 2) * 0.03,
            -0.2,
        );
        strip.rotation.x = Math.PI;
        body.add(strip);
    }

    body.add(part(new BoxGeometry(0.46, 0.06, 0.18), shroud, 0, 0.68, -0.02));

    for (const side of [-1, 1]) {
        body.add(
            part(
                new SphereGeometry(0.025, 8, 6),
                iron,
                side * 0.12,
                0.66,
                0.08,
            ),
        );
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.84, 0);
    head.add(part(new IcosahedronGeometry(0.08, 1), ghost));
    eyes(head, 0.01, 0.06, 0.03, 0.02);
    head.add(
        part(new ConeGeometry(0.055, 0.2, 6), shroud, 0, -0.12, 0.05).rotateX(
            Math.PI - 0.25,
        ),
    );

    const crown = new Group();
    crown.position.y = 0.075;
    crown.rotation.z = 0.12;
    crown.add(part(new CylinderGeometry(0.075, 0.07, 0.05, 10), iron));

    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.sin(angle) * 0.07;
        const z = Math.cos(angle) * 0.07;
        crown.add(part(new ConeGeometry(0.02, 0.09, 4), iron, x, 0.065, z));
        crown.add(part(new SphereGeometry(0.012, 6, 5), eye, x, 0.11, z));
    }

    head.add(crown);
    piece.add(head);

    const right = limb(RIG.armRight, [-0.2, 0.66, 0], 0.22, 0.03, cloth, ghost);
    right.end.add(rod([0, -0.12, 0.03], [0, 0.4, 0.03], 0.013, iron));
    right.end.add(
        part(new TorusGeometry(0.05, 0.008, 5, 14), iron, 0, 0.46, 0.03),
    );
    right.end.add(
        part(new SphereGeometry(0.038, 12, 10), lantern, 0, 0.46, 0.03),
    );
    right.end.add(part(new ConeGeometry(0.015, 0.05, 4), iron, 0, 0.53, 0.03));
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.2, 0.66, 0], 0.22, 0.03, cloth, ghost).pivot,
    );

    return piece;
}
