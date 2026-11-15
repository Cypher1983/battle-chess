import {
    BoxGeometry,
    ConeGeometry,
    CylinderGeometry,
    DoubleSide,
    Group,
    OctahedronGeometry,
    SphereGeometry,
    TorusGeometry,
} from 'three';
import type { PieceType } from '@/lib/armies';
import {
    capsule,
    glow,
    joint,
    limb,
    lathe,
    material,
    part,
    RIG,
    rod,
} from '@/lib/board3d/pieces/parts';

/**
 * The Greek Polis: citizens of a sunlit city-state. Polished bronze armour,
 * white marble and linen, laurel green, Aegean blue and terracotta, with
 * gold for those who rule.
 */

const bronze = material({ color: 0xb8803a, metalness: 0.75, roughness: 0.35 });
const darkBronze = material({
    color: 0x7a5228,
    metalness: 0.7,
    roughness: 0.45,
    flatShading: true,
});
const marble = material({ color: 0xece6da, roughness: 0.55 });
const linen = material({ color: 0xf3eee2, roughness: 0.85, flatShading: true });
const veil = material({
    color: 0x2f6fa8,
    roughness: 0.75,
    side: DoubleSide,
    flatShading: true,
});
const skin = material({ color: 0xd9a07a, roughness: 0.75 });
const hair = material({ color: 0x3e2a1c, roughness: 0.9, flatShading: true });
const silver = material({ color: 0xcfcac0, roughness: 0.9, flatShading: true });
const laurel = material({ color: 0x5f8a3a, roughness: 0.7, flatShading: true });
const aegean = material({ color: 0x2f6fa8, roughness: 0.6 });
const terracotta = material({
    color: 0xc0582f,
    roughness: 0.8,
    flatShading: true,
});
const gold = material({ color: 0xe0b54a, metalness: 0.85, roughness: 0.3 });
const hide = material({ color: 0x8a5a34, roughness: 0.85, flatShading: true });
const wood = material({ color: 0x6b4a2c, roughness: 0.9 });
const ink = material({ color: 0x1e1712, roughness: 0.6 });
const sight = glow(0x8fdcff, 0.6);
const smoke = glow(0xb7e4ff, 0.5);
const bolt = glow(0xffe27a, 0.6);
const statueEye = glow(0x6fd0ff, 0.55);
const moon = glow(0xbfe6ff, 0.45);

const builders: Record<PieceType, () => Group> = {
    p: hoplite,
    n: centaur,
    b: oracle,
    r: bronzeColossus,
    q: huntress,
    k: archon,
};

export function buildGreek(type: PieceType): Group {
    return builders[type]();
}

/** Every Greek character stands on a marble disc banded in Aegean blue. */
function base(): Group {
    const group = new Group();
    group.add(
        part(new CylinderGeometry(0.28, 0.3, 0.05, 24), marble, 0, 0.025),
    );
    group.add(
        part(new TorusGeometry(0.29, 0.012, 6, 28), aegean, 0, 0.035).rotateX(
            Math.PI / 2,
        ),
    );

    return group;
}

function eyes(
    group: Group,
    y: number,
    z: number,
    spread: number,
    size = 0.008,
    mat = ink,
): void {
    for (const side of [-1, 1]) {
        group.add(
            part(new SphereGeometry(size, 8, 6), mat, side * spread, y, z),
        );
    }
}

/** A cap covering the top and back of a head: hair, helmet or hood. */
function dome(radius: number, mat: typeof bronze, y = 0, z = 0) {
    return part(
        new SphereGeometry(radius, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
        mat,
        0,
        y,
        z,
    );
}

/** A ring of upright leaves around a head, open at the front. */
function wreath(
    group: Group,
    radius: number,
    y: number,
    mat: typeof laurel,
    count: number,
    tall: number,
): void {
    group.add(
        part(new TorusGeometry(radius, 0.008, 6, 18), mat, 0, y).rotateX(
            Math.PI / 2,
        ),
    );

    for (let i = 0; i < count; i++) {
        const angle = 0.6 + (i / (count - 1)) * (Math.PI * 2 - 1.2);
        const leaf = part(
            new SphereGeometry(1, 6, 4),
            mat,
            Math.sin(angle) * radius,
            y + tall * 0.45,
            Math.cos(angle) * radius,
        );
        leaf.scale.set(0.009, tall / 2, 0.016);
        leaf.rotation.y = angle;
        leaf.rotation.x = -0.25;
        group.add(leaf);
    }
}

/** A round hoplite shield facing +z, with a bronze rim and a boss. */
function shield(radius: number, face: typeof aegean, emblem: typeof gold) {
    const group = new Group();
    group.add(
        part(new CylinderGeometry(radius, radius, 0.02, 22), face).rotateX(
            Math.PI / 2,
        ),
    );
    group.add(
        part(new TorusGeometry(radius, radius * 0.1, 6, 22), bronze, 0, 0, 0),
    );
    group.add(
        part(
            new CylinderGeometry(radius * 0.32, radius * 0.32, 0.024, 14),
            emblem,
        ).rotateX(Math.PI / 2),
    );

    return group;
}

/** A horsehair crest: a half disc running front to back over a helmet. */
function crest(radius: number, width: number, mat: typeof aegean, y: number) {
    return part(
        new CylinderGeometry(radius, radius, width, 14, 1, false, 0, Math.PI),
        mat,
        0,
        y,
        -0.01,
    ).rotateZ(Math.PI / 2);
}

function spear(group: Group, from: number, to: number): void {
    group.add(rod([0, from, 0.02], [0, to, 0.02], 0.007, wood));
    group.add(
        part(new ConeGeometry(0.016, 0.06, 6), bronze, 0, to + 0.03, 0.02),
    );
}

/** Hoplite (pawn): a citizen soldier with crested helm, shield and spear. */
function hoplite(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.04, 0.16, 0],
            0.11,
            0.022,
            skin,
            bronze,
        );
        end.add(part(new BoxGeometry(0.04, 0.02, 0.06), wood, 0, -0.012, 0.01));
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.16, 0);
    body.add(part(new CylinderGeometry(0.065, 0.08, 0.06, 10), terracotta));
    body.add(
        part(new CylinderGeometry(0.072, 0.06, 0.13, 10), bronze, 0, 0.09),
    );
    body.add(part(new BoxGeometry(0.13, 0.15, 0.012), aegean, 0, 0.08, -0.068));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.36, 0);
    head.add(part(new SphereGeometry(0.05, 12, 10), skin));
    eyes(head, 0.0, 0.047, 0.018);
    head.add(dome(0.058, bronze, 0.01));

    for (const side of [-1, 1]) {
        head.add(
            part(
                new BoxGeometry(0.014, 0.045, 0.035),
                bronze,
                side * 0.043,
                -0.012,
                0.022,
            ),
        );
    }

    head.add(part(new BoxGeometry(0.008, 0.03, 0.02), bronze, 0, 0.005, 0.054));
    head.add(part(new BoxGeometry(0.012, 0.02, 0.04), bronze, 0, 0.068, 0));
    head.add(crest(0.07, 0.022, terracotta, 0.055));
    piece.add(head);

    const right = limb(RIG.armRight, [-0.085, 0.3, 0], 0.1, 0.02, skin, skin);
    spear(right.end, -0.14, 0.32);
    piece.add(right.pivot);

    const left = limb(RIG.armLeft, [0.085, 0.3, 0], 0.1, 0.02, skin, skin);
    const aspis = shield(0.095, aegean, terracotta);
    aspis.position.set(0.02, 0.03, 0.05);
    left.end.add(aspis);
    piece.add(left.pivot);

    return piece;
}

/** Centaur (knight): a horse body carrying the torso of a spearman. */
function centaur(): Group {
    const piece = base();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.065, 0.11],
        [RIG.legFrontRight, -0.065, 0.11],
        [RIG.legBackLeft, 0.065, -0.12],
        [RIG.legBackRight, -0.065, -0.12],
    ] as const) {
        const { pivot } = limb(name, [x, 0.24, z], 0.16, 0.024, hide, ink);
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.27, -0.01);
    body.add(capsule(0.085, 0.2, hide).rotateX(Math.PI / 2));
    body.add(
        part(new CylinderGeometry(0.06, 0.08, 0.1, 10), hide, 0, 0.08, 0.13),
    );
    body.add(capsule(0.052, 0.09, skin, 0, 0.16, 0.13));
    body.add(
        part(
            new CylinderGeometry(0.064, 0.058, 0.1, 10),
            bronze,
            0,
            0.18,
            0.13,
        ),
    );
    body.add(
        part(
            new TorusGeometry(0.062, 0.01, 6, 14),
            aegean,
            0,
            0.12,
            0.13,
        ).rotateX(Math.PI / 2),
    );

    const tail = joint(RIG.tail, 0, 0.03, -0.18);
    tail.add(rod([0, 0, 0], [0, -0.14, -0.08], 0.026, hair, 0.008, 6));
    body.add(tail);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.6, 0.12);
    head.add(part(new SphereGeometry(0.05, 12, 10), skin));
    eyes(head, 0.0, 0.047, 0.018);
    head.add(dome(0.054, hair, 0.008, -0.004));
    const beard = part(
        new SphereGeometry(0.035, 10, 8),
        hair,
        0,
        -0.035,
        0.025,
    );
    beard.scale.set(1, 1.1, 0.7);
    head.add(beard);
    wreath(head, 0.055, 0.02, laurel, 6, 0.03);
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.08, 0.52, 0.12],
        0.12,
        0.02,
        skin,
        skin,
    );
    spear(right.end, -0.2, 0.36);
    piece.add(right.pivot);

    const left = limb(RIG.armLeft, [0.08, 0.52, 0.12], 0.12, 0.02, skin, skin);
    const pelte = shield(0.07, terracotta, gold);
    pelte.position.set(0.02, 0.01, 0.04);
    left.end.add(pelte);
    piece.add(left.pivot);

    return piece;
}

/** Oracle (bishop): a veiled seer with a smoking tripod-staff. */
function oracle(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.19, 0.05],
                [0.17, 0.12],
                [0.11, 0.4],
                [0.08, 0.52],
                [0, 0.54],
            ],
            linen,
            14,
        ),
    );
    body.add(
        part(new TorusGeometry(0.175, 0.014, 6, 20), aegean, 0, 0.09).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.112, 0.012, 6, 16), gold, 0, 0.37).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(
            new BoxGeometry(0.035, 0.28, 0.012),
            aegean,
            0,
            0.24,
            0.14,
        ).rotateX(-0.2),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.6, 0.01);
    head.add(part(new SphereGeometry(0.055, 12, 10), skin, 0, 0, 0.012));
    eyes(head, 0.0, 0.062, 0.02, 0.009, sight);
    head.add(dome(0.07, aegean, 0.008, -0.004));
    head.add(
        part(
            new CylinderGeometry(
                0.07,
                0.1,
                0.16,
                14,
                1,
                true,
                Math.PI * 0.32,
                Math.PI * 1.36,
            ),
            veil,
            0,
            -0.07,
            -0.004,
        ),
    );
    wreath(head, 0.071, 0.03, laurel, 7, 0.032);
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.12, 0.48, 0.02],
        0.14,
        0.021,
        aegean,
        skin,
    );
    right.end.add(rod([0, -0.26, 0.03], [0, 0.2, 0.03], 0.01, wood));

    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        right.end.add(
            rod(
                [0, 0.18, 0.03],
                [Math.sin(angle) * 0.045, 0.27, 0.03 + Math.cos(angle) * 0.045],
                0.006,
                bronze,
            ),
        );
    }

    right.end.add(
        part(
            new CylinderGeometry(0.055, 0.03, 0.04, 12),
            bronze,
            0,
            0.28,
            0.03,
        ),
    );

    for (const [x, y, size] of [
        [0, 0.32, 0.032],
        [0.015, 0.37, 0.026],
        [-0.01, 0.415, 0.02],
    ]) {
        right.end.add(part(new SphereGeometry(size, 8, 6), smoke, x, y, 0.03));
    }

    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.12, 0.48, 0.02], 0.14, 0.021, aegean, skin).pivot,
    );

    return piece;
}

/** Bronze Colossus (rook): a giant walking statue with glowing eyes. */
function bronzeColossus(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.09, 0.2, 0],
            0.13,
            0.05,
            bronze,
            darkBronze,
        );
        end.add(
            part(new BoxGeometry(0.11, 0.04, 0.15), darkBronze, 0, -0.03, 0.02),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.2, 0);
    body.add(
        part(new CylinderGeometry(0.13, 0.16, 0.09, 10), darkBronze, 0, 0.02),
    );
    const chest = part(new SphereGeometry(0.18, 16, 12), bronze, 0, 0.21);
    chest.scale.set(1.05, 1, 0.75);
    body.add(chest);

    for (const side of [-1, 1]) {
        const pec = part(
            new SphereGeometry(0.07, 12, 8),
            bronze,
            side * 0.06,
            0.27,
            0.09,
        );
        pec.scale.set(1, 0.75, 0.6);
        body.add(pec);
        body.add(
            part(
                new SphereGeometry(0.08, 12, 8),
                darkBronze,
                side * 0.18,
                0.36,
                0,
            ),
        );
    }

    body.add(
        part(new TorusGeometry(0.15, 0.016, 6, 18), gold, 0, 0.09).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new BoxGeometry(0.34, 0.36, 0.02), aegean, 0, 0.2, -0.14));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.63, 0.01);
    head.add(part(new SphereGeometry(0.075, 14, 10), bronze));
    head.add(dome(0.084, darkBronze, 0.012, -0.004));
    head.add(
        part(new BoxGeometry(0.08, 0.014, 0.02), statueEye, 0, 0.005, 0.07),
    );
    head.add(
        part(new BoxGeometry(0.014, 0.04, 0.02), darkBronze, 0, -0.02, 0.078),
    );
    head.add(part(new BoxGeometry(0.02, 0.03, 0.06), darkBronze, 0, 0.085, 0));
    head.add(crest(0.11, 0.035, aegean, 0.08));
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.25, 0.53, 0],
            0.2,
            0.048,
            bronze,
            darkBronze,
        );

        if (side < 0) {
            end.add(
                part(new BoxGeometry(0.1, 0.02, 0.03), gold, 0, 0.04, 0.03),
            );
            const blade = part(
                new CylinderGeometry(0.018, 0.032, 0.28, 4),
                bronze,
                0,
                0.19,
                0.03,
            );
            blade.scale.z = 0.35;
            end.add(blade);
            const tip = part(
                new ConeGeometry(0.018, 0.05, 4),
                bronze,
                0,
                0.355,
                0.03,
            );
            tip.scale.z = 0.35;
            end.add(tip);
        }

        piece.add(pivot);
    }

    return piece;
}

/** The Huntress (queen): an archer queen with a bow and crescent diadem. */
function huntress(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.2, 0.05],
                [0.18, 0.12],
                [0.1, 0.42],
                [0.075, 0.58],
                [0.095, 0.66],
                [0, 0.68],
            ],
            linen,
            14,
        ),
    );
    body.add(
        part(new TorusGeometry(0.185, 0.016, 6, 20), aegean, 0, 0.09).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.095, 0.013, 6, 16), gold, 0, 0.47).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new CylinderGeometry(0.086, 0.112, 0.12, 14), aegean, 0, 0.54),
    );
    body.add(
        part(
            new BoxGeometry(0.2, 0.42, 0.015),
            laurel,
            0,
            0.42,
            -0.135,
        ).rotateX(0.22),
    );

    const quiver = new Group();
    quiver.position.set(0.05, 0.58, -0.11);
    quiver.rotation.z = -0.4;
    quiver.add(part(new CylinderGeometry(0.035, 0.028, 0.22, 10), terracotta));

    for (const x of [-0.015, 0, 0.015]) {
        quiver.add(rod([x, 0.1, 0], [x, 0.17, 0], 0.004, wood));
        quiver.add(part(new BoxGeometry(0.004, 0.035, 0.018), linen, x, 0.165));
    }

    body.add(quiver);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.76, 0);
    head.add(part(new SphereGeometry(0.062, 14, 10), skin));
    eyes(head, 0.0, 0.058, 0.022);
    head.add(dome(0.066, hair, 0.01, -0.006));
    head.add(part(new SphereGeometry(0.036, 10, 8), hair, 0, 0.01, -0.07));
    head.add(
        part(new TorusGeometry(0.064, 0.007, 6, 18), gold, 0, 0.028).rotateX(
            Math.PI / 2,
        ),
    );
    head.add(
        part(
            new TorusGeometry(0.03, 0.008, 6, 14, Math.PI),
            moon,
            0,
            0.085,
            0.04,
        ).rotateZ(Math.PI),
    );
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.125, 0.64, 0],
        0.18,
        0.019,
        skin,
        skin,
    );
    const bow = new Group();
    bow.rotation.y = Math.PI;
    bow.add(
        part(
            new TorusGeometry(0.2, 0.011, 6, 20, Math.PI * 0.7),
            darkBronze,
            -0.2,
        ).rotateZ(-Math.PI * 0.35),
    );
    bow.add(rod([-0.109, -0.178, 0], [-0.109, 0.178, 0], 0.002, linen));
    bow.position.set(-0.01, 0.02, 0.1);
    right.end.add(bow);
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.125, 0.64, 0], 0.18, 0.019, skin, skin).pivot,
    );

    return piece;
}

/**
 * The Archon (king): a bearded ruler in a toga with a golden laurel crown
 * and a thunderbolt sceptre.
 */
function archon(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.23, 0.05],
                [0.2, 0.15],
                [0.15, 0.48],
                [0.16, 0.66],
                [0.1, 0.75],
                [0, 0.76],
            ],
            linen,
            14,
        ),
    );
    body.add(
        part(new TorusGeometry(0.205, 0.018, 6, 22), aegean, 0, 0.1).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.152, 0.016, 6, 18), gold, 0, 0.46).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(
            new BoxGeometry(0.08, 0.56, 0.02),
            terracotta,
            0.02,
            0.44,
            0.155,
        ).rotateZ(0.45),
    );
    body.add(
        part(new BoxGeometry(0.36, 0.56, 0.02), aegean, 0, 0.42, -0.19).rotateX(
            0.16,
        ),
    );

    for (const side of [-1, 1]) {
        body.add(
            part(
                new SphereGeometry(0.025, 10, 8),
                gold,
                side * 0.12,
                0.7,
                0.08,
            ),
        );
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.86, 0);
    head.add(part(new SphereGeometry(0.075, 14, 10), skin));
    eyes(head, 0.01, 0.07, 0.026, 0.009);
    head.add(dome(0.079, silver, 0.012, -0.006));
    const beard = part(
        new SphereGeometry(0.06, 12, 10),
        silver,
        0,
        -0.055,
        0.04,
    );
    beard.scale.set(1, 1.35, 0.8);
    head.add(beard);
    head.add(
        part(new BoxGeometry(0.06, 0.014, 0.02), silver, 0, -0.012, 0.074),
    );
    wreath(head, 0.08, 0.04, gold, 9, 0.06);
    head.add(part(new OctahedronGeometry(0.016, 0), aegean, 0, 0.045, 0.085));
    piece.add(head);

    const right = limb(RIG.armRight, [-0.21, 0.68, 0], 0.22, 0.03, skin, skin);
    right.end.add(rod([0, -0.1, 0.03], [0, 0.4, 0.03], 0.013, gold));

    for (const [x, y, turn] of [
        [0, 0.44, 0.55],
        [0.02, 0.51, -0.55],
        [0, 0.58, 0.55],
    ]) {
        right.end.add(
            part(new BoxGeometry(0.018, 0.08, 0.016), bolt, x, y, 0.03).rotateZ(
                turn,
            ),
        );
    }

    right.end.add(part(new ConeGeometry(0.018, 0.06, 4), bolt, 0, 0.64, 0.03));
    piece.add(right.pivot);
    piece.add(limb(RIG.armLeft, [0.21, 0.68, 0], 0.22, 0.03, skin, skin).pivot);

    return piece;
}
