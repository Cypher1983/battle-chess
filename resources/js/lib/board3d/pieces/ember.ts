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
 * The Ember Dynasty: creatures of obsidian and living fire. Black glassy
 * stone split by glowing lava seams, gold regalia and burning eyes.
 */

const obsidian = material({
    color: 0x1f1b22,
    roughness: 0.35,
    metalness: 0.2,
    flatShading: true,
});
const basalt = material({ color: 0x3a3230, roughness: 1, flatShading: true });
const scale = material({ color: 0x7a2614, roughness: 0.6, flatShading: true });
const gold = material({ color: 0xd9a441, metalness: 0.85, roughness: 0.3 });
const robe = material({ color: 0x5c1410, roughness: 0.85, flatShading: true });
const wing = material({
    color: 0xff7a1a,
    roughness: 0.5,
    side: DoubleSide,
    flatShading: true,
});
const lava = glow(0xff5a1a, 0.7);
const flame = glow(0xffb02e, 0.8);
const eye = glow(0xffd23a, 0.6);

const builders: Record<PieceType, () => Group> = {
    p: cinderImp,
    n: magmaSalamander,
    b: flamePriest,
    r: obsidianGolem,
    q: phoenixEmpress,
    k: cinderKing,
};

export function buildEmber(type: PieceType): Group {
    return builders[type]();
}

/** Every Ember character stands on a cracked basalt slab. */
function base(): Group {
    const group = new Group();
    group.add(part(new CylinderGeometry(0.28, 0.3, 0.05, 7), basalt, 0, 0.025));

    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + 0.3;
        const seam = part(
            new BoxGeometry(0.2, 0.012, 0.02),
            lava,
            Math.sin(angle) * 0.13,
            0.051,
            Math.cos(angle) * 0.13,
        );
        seam.rotation.y = angle;
        group.add(seam);
    }

    return group;
}

/** A flickering flame: two stacked glowing cones. */
function fire(size: number): Group {
    const group = new Group();
    group.add(
        part(
            new ConeGeometry(0.05 * size, 0.16 * size, 7),
            flame,
            0,
            0.08 * size,
        ),
    );
    group.add(
        part(
            new ConeGeometry(0.03 * size, 0.1 * size, 6),
            lava,
            0.02 * size,
            0.06 * size,
            0.01,
        ),
    );

    return group;
}

function eyes(
    group: Group,
    y: number,
    z: number,
    spread: number,
    size = 0.02,
): void {
    for (const side of [-1, 1]) {
        group.add(
            part(new SphereGeometry(size, 10, 8), eye, side * spread, y, z),
        );
    }
}

function horns(group: Group, y: number, spread: number, length: number): void {
    for (const side of [-1, 1]) {
        group.add(
            rod(
                [side * spread, y, 0],
                [side * (spread + length * 0.5), y + length, -0.03],
                0.02,
                obsidian,
                0.004,
                6,
            ),
        );
    }
}

/** Cinder Imp (pawn): a small horned imp with a trident. */
function cinderImp(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.05, 0.2, 0],
            0.13,
            0.026,
            obsidian,
            obsidian,
        );
        end.add(
            part(
                new ConeGeometry(0.035, 0.06, 5),
                obsidian,
                0,
                -0.01,
                0.03,
            ).rotateX(Math.PI / 2),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.2, 0);
    const belly = part(new IcosahedronGeometry(0.09, 1), obsidian, 0, 0.08);
    belly.scale.set(1, 1.15, 0.9);
    body.add(belly);
    body.add(
        part(new BoxGeometry(0.08, 0.012, 0.02), lava, 0, 0.1, 0.08).rotateZ(
            0.4,
        ),
    );
    body.add(
        part(
            new BoxGeometry(0.06, 0.012, 0.02),
            lava,
            0.02,
            0.05,
            0.085,
        ).rotateZ(-0.5),
    );

    // A pointed tail flicking out behind.
    body.add(rod([0, 0.03, -0.07], [0, 0.1, -0.2], 0.012, obsidian, 0.006, 5));
    body.add(part(new ConeGeometry(0.025, 0.05, 4), lava, 0, 0.12, -0.21));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.42, 0);
    head.add(part(new IcosahedronGeometry(0.075, 1), obsidian));
    eyes(head, 0.01, 0.06, 0.03);
    head.add(part(new BoxGeometry(0.05, 0.01, 0.01), lava, 0, -0.035, 0.065));
    horns(head, 0.04, 0.04, 0.09);
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.1, 0.36, 0],
        0.12,
        0.02,
        obsidian,
        obsidian,
    );
    right.end.add(rod([0, -0.15, 0.03], [0, 0.32, 0.03], 0.01, gold));

    for (const offset of [-0.035, 0, 0.035]) {
        right.end.add(
            part(new ConeGeometry(0.012, 0.06, 5), gold, offset, 0.35, 0.03),
        );
    }

    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.1, 0.36, 0], 0.12, 0.02, obsidian, obsidian).pivot,
    );

    return piece;
}

/** Magma Salamander (knight): a four-legged lizard with a ridge of fire. */
function magmaSalamander(): Group {
    const piece = base();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.1, 0.12],
        [RIG.legFrontRight, -0.1, 0.12],
        [RIG.legBackLeft, 0.1, -0.1],
        [RIG.legBackRight, -0.1, -0.1],
    ] as const) {
        const { pivot } = limb(name, [x, 0.2, z], 0.14, 0.032, scale, obsidian);
        pivot.rotation.z = x > 0 ? -0.35 : 0.35;
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.24, 0);
    body.add(capsule(0.09, 0.26, scale, 0, 0, 0).rotateX(Math.PI / 2));

    for (let i = 0; i < 5; i++) {
        const z = 0.14 - i * 0.07;
        body.add(
            part(
                new ConeGeometry(0.03, 0.09 - Math.abs(i - 2) * 0.012, 5),
                flame,
                0,
                0.1,
                z,
            ),
        );
    }

    const tail = joint(RIG.tail, 0, 0, -0.2);
    tail.add(rod([0, 0, 0], [0, -0.06, -0.22], 0.05, scale, 0.01, 6));
    tail.add(fire(0.7).translateY(-0.04).translateZ(-0.24));
    body.add(tail);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.3, 0.22);
    head.add(part(new BoxGeometry(0.13, 0.08, 0.16), scale, 0, 0, 0.04));
    head.add(part(new BoxGeometry(0.1, 0.03, 0.08), obsidian, 0, -0.04, 0.09));
    head.add(part(new BoxGeometry(0.08, 0.01, 0.06), lava, 0, -0.025, 0.1));
    eyes(head, 0.035, 0.07, 0.05, 0.018);
    piece.add(head);

    return piece;
}

/** Flame Priest (bishop): a hooded fire-priest with a brazier staff. */
function flamePriest(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.2, 0.05],
                [0.18, 0.12],
                [0.12, 0.42],
                [0.09, 0.56],
                [0, 0.58],
            ],
            robe,
            8,
        ),
    );
    body.add(
        part(new TorusGeometry(0.135, 0.016, 6, 14), gold, 0, 0.3).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new BoxGeometry(0.03, 0.3, 0.015), gold, 0, 0.27, 0.155).rotateX(
            -0.2,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.66, 0.01);
    head.add(part(new ConeGeometry(0.1, 0.26, 8), robe, 0, 0.06, -0.02));
    head.add(part(new SphereGeometry(0.065, 12, 10), obsidian, 0, -0.01, 0.04));
    eyes(head, 0, 0.095, 0.025, 0.016);
    horns(head, 0.04, 0.06, 0.08);
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.13, 0.5, 0.02],
        0.15,
        0.022,
        robe,
        obsidian,
    );
    right.end.add(rod([0, -0.3, 0.03], [0, 0.32, 0.03], 0.012, obsidian));
    right.end.add(
        part(new CylinderGeometry(0.05, 0.03, 0.05, 8), gold, 0, 0.34, 0.03),
    );
    right.end.add(fire(0.9).translateY(0.36).translateZ(0.03));
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.13, 0.5, 0.02], 0.15, 0.022, robe, obsidian).pivot,
    );

    return piece;
}

/** Obsidian Golem (rook): a hulking stone golem with a molten core. */
function obsidianGolem(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.1, 0.19, 0],
            0.12,
            0.055,
            obsidian,
            basalt,
        );
        end.add(
            part(new BoxGeometry(0.12, 0.05, 0.14), basalt, 0, -0.02, 0.02),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.2, 0);
    const chest = part(new IcosahedronGeometry(0.2, 0), obsidian, 0, 0.2);
    chest.scale.set(1.05, 1.1, 0.85);
    body.add(chest);
    body.add(part(new OctahedronGeometry(0.06, 0), lava, 0, 0.22, 0.15));

    for (const [x, y, turn] of [
        [-0.08, 0.3, 0.6],
        [0.09, 0.12, -0.5],
        [0.05, 0.33, -0.9],
    ]) {
        body.add(
            part(new BoxGeometry(0.1, 0.012, 0.02), lava, x, y, 0.15).rotateZ(
                turn,
            ),
        );
    }

    // Shoulder boulders like battlements.
    for (const side of [-1, 1]) {
        body.add(
            part(
                new IcosahedronGeometry(0.08, 0),
                basalt,
                side * 0.17,
                0.38,
                0,
            ),
        );
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.62, 0.02);
    head.add(part(new BoxGeometry(0.12, 0.09, 0.1), basalt));
    head.add(part(new BoxGeometry(0.08, 0.02, 0.02), lava, 0, 0.01, 0.05));
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.24, 0.52, 0],
            0.2,
            0.05,
            obsidian,
            basalt,
        );
        end.add(part(new IcosahedronGeometry(0.08, 0), basalt));
        piece.add(pivot);
    }

    return piece;
}

/**
 * Phoenix Empress (queen): a regal fire-bird woman with blazing wings and
 * a crown of flame.
 */
function phoenixEmpress(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.21, 0.05],
                [0.19, 0.12],
                [0.11, 0.4],
                [0.07, 0.56],
                [0.09, 0.66],
                [0, 0.68],
            ],
            robe,
            12,
        ),
    );

    // Tongues of flame licking up the gown.
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        body.add(
            part(
                new ConeGeometry(0.04, 0.16, 5),
                flame,
                Math.sin(angle) * 0.17,
                0.14,
                Math.cos(angle) * 0.17,
            ),
        );
    }

    for (const side of [-1, 1]) {
        const feathers = new Group();
        feathers.position.set(side * 0.06, 0.6, -0.08);
        feathers.rotation.set(0.2, side * 0.5, side * -0.3);

        for (let i = 0; i < 4; i++) {
            const feather = part(
                new ConeGeometry(0.05, 0.34 - i * 0.05, 4),
                wing,
                side * (0.07 + i * 0.06),
                0.1 - i * 0.05,
                0,
            );
            feather.rotation.z = side * (-0.9 + i * 0.25);
            feather.scale.z = 0.25;
            feathers.add(feather);
        }

        body.add(feathers);
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.77, 0);
    head.add(part(new SphereGeometry(0.07, 14, 10), gold));
    eyes(head, 0.01, 0.06, 0.025, 0.015);
    head.add(
        part(new ConeGeometry(0.02, 0.05, 4), gold, 0, -0.005, 0.075).rotateX(
            Math.PI / 2,
        ),
    );

    for (let i = 0; i < 5; i++) {
        const angle = ((i - 2) / 4) * 1.2;
        const crest = fire(0.6);
        crest.position.set(
            Math.sin(angle) * 0.05,
            0.05,
            Math.cos(angle) * 0.01 - 0.02,
        );
        crest.rotation.z = -angle * 0.6;
        head.add(crest);
    }

    piece.add(head);

    piece.add(
        limb(RIG.armRight, [-0.1, 0.62, 0], 0.18, 0.018, robe, gold).pivot,
    );
    piece.add(limb(RIG.armLeft, [0.1, 0.62, 0], 0.18, 0.018, robe, gold).pivot);

    return piece;
}

/**
 * The Cinder King (king): an armoured obsidian monarch with a burning
 * crown, a mantle of embers and a molten sceptre.
 */
function cinderKing(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.23, 0.05],
                [0.2, 0.15],
                [0.15, 0.45],
                [0.16, 0.62],
                [0.1, 0.68],
                [0, 0.69],
            ],
            obsidian,
            10,
        ),
    );
    body.add(
        part(new TorusGeometry(0.17, 0.02, 6, 16), gold, 0, 0.42).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new BoxGeometry(0.44, 0.05, 0.14), gold, 0, 0.64, -0.02));
    body.add(part(new BoxGeometry(0.38, 0.42, 0.02), robe, 0, 0.4, -0.15));

    for (const [x, y] of [
        [0.05, 0.3],
        [-0.06, 0.2],
        [0.0, 0.52],
    ]) {
        body.add(part(new OctahedronGeometry(0.025, 0), lava, x, y, 0.15));
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.8, 0);
    head.add(part(new IcosahedronGeometry(0.085, 1), obsidian));
    head.add(part(new BoxGeometry(0.09, 0.018, 0.02), eye, 0, 0.01, 0.075));
    head.add(part(new CylinderGeometry(0.08, 0.075, 0.05, 8), gold, 0, 0.08));

    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const point = fire(0.55);
        point.position.set(Math.sin(angle) * 0.07, 0.1, Math.cos(angle) * 0.07);
        head.add(point);
    }

    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.21, 0.62, 0],
        0.22,
        0.032,
        obsidian,
        gold,
    );
    right.end.add(rod([0, -0.1, 0.03], [0, 0.42, 0.03], 0.014, gold));
    right.end.add(part(new OctahedronGeometry(0.05, 0), lava, 0, 0.47, 0.03));
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.21, 0.62, 0], 0.22, 0.032, obsidian, gold).pivot,
    );

    return piece;
}
