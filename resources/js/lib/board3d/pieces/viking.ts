import {
    BoxGeometry,
    ConeGeometry,
    CylinderGeometry,
    DoubleSide,
    Group,
    SphereGeometry,
    TorusGeometry,
} from 'three';
import type { MeshStandardMaterial } from 'three';
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
 * The Viking Clans: raiders from the cold fjords. Fur and leather, dark
 * iron, carved wood marked with glowing runes, braided beards and round
 * shields painted red, white and blue.
 */

const fur = material({ color: 0x6b5440, roughness: 1, flatShading: true });
const greyFur = material({ color: 0x8e8a84, roughness: 1, flatShading: true });
const cloak = material({
    color: 0x5a4636,
    roughness: 1,
    side: DoubleSide,
    flatShading: true,
});
const leather = material({ color: 0x5a3a22, roughness: 0.8 });
const iron = material({ color: 0x6c7075, metalness: 0.6, roughness: 0.45 });
const mail = material({ color: 0x83878b, roughness: 0.75, flatShading: true });
const wood = material({ color: 0x8a5f36, roughness: 0.9 });
const darkWood = material({
    color: 0x4e3420,
    roughness: 0.95,
    flatShading: true,
});
const red = material({ color: 0xa8322a, roughness: 0.8, flatShading: true });
const white = material({ color: 0xe8e0cc, roughness: 0.8, flatShading: true });
const blue = material({ color: 0x2c4f86, roughness: 0.8, flatShading: true });
const skin = material({ color: 0xe0a888, roughness: 0.75 });
const blond = material({ color: 0xd8a548, roughness: 0.85, flatShading: true });
const ginger = material({
    color: 0xb0532a,
    roughness: 0.85,
    flatShading: true,
});
const gold = material({ color: 0xd9a441, metalness: 0.85, roughness: 0.3 });
const ink = material({ color: 0x1b1612, roughness: 0.6 });
const rune = glow(0x4fd6c4, 0.6);
const wolfEye = glow(0xffc94a, 0.6);

const builders: Record<PieceType, () => Group> = {
    p: raider,
    n: wolfRider,
    b: skald,
    r: shieldwallBrute,
    q: shieldMaiden,
    k: jarl,
};

export function buildViking(type: PieceType): Group {
    return builders[type]();
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

/** A cap over the top and back of a head: hair or a helm. */
function dome(radius: number, mat: MeshStandardMaterial, y = 0, z = 0) {
    return part(
        new SphereGeometry(radius, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
        mat,
        0,
        y,
        z,
    );
}

/** A full beard hanging from the chin, with braids. */
function beard(
    group: Group,
    size: number,
    y: number,
    z: number,
    mat: MeshStandardMaterial,
    braids: number[],
): void {
    const bush = part(new SphereGeometry(size, 12, 8), mat, 0, y, z);
    bush.scale.set(1.1, 1.2, 0.75);
    group.add(bush);

    for (const x of braids) {
        group.add(
            rod(
                [x, y - size * 0.6, z + size * 0.3],
                [x, y - size * 2.1, z + size * 0.45],
                size * 0.22,
                mat,
                size * 0.14,
                5,
            ),
        );
        group.add(
            part(
                new SphereGeometry(size * 0.2, 6, 4),
                gold,
                x,
                y - size * 2.1,
                z + size * 0.45,
            ),
        );
    }
}

/**
 * A round shield facing +z, painted in equal wedges of the given colours,
 * with an iron rim and boss.
 */
function shield(radius: number, colours: MeshStandardMaterial[]): Group {
    const group = new Group();
    const wedge = (Math.PI * 2) / colours.length;

    colours.forEach((paint, i) => {
        group.add(
            part(
                new CylinderGeometry(
                    radius,
                    radius,
                    0.02,
                    Math.max(4, Math.round(24 / colours.length)),
                    1,
                    false,
                    i * wedge + 0.4,
                    wedge,
                ),
                paint,
            ).rotateX(Math.PI / 2),
        );
    });

    group.add(part(new TorusGeometry(radius, radius * 0.09, 6, 22), iron));
    group.add(
        part(
            new SphereGeometry(
                radius * 0.25,
                10,
                6,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2,
            ),
            iron,
            0,
            0,
            0.01,
        ).rotateX(Math.PI / 2),
    );

    return group;
}

/** An axe: a wooden haft with a bearded iron blade facing outward (-x). */
function axe(group: Group, low: number, high: number, blade: number): void {
    group.add(rod([0, low, 0.02], [0, high, 0.02], blade * 0.13, wood));
    group.add(
        part(
            new CylinderGeometry(
                blade,
                blade,
                0.014,
                12,
                1,
                false,
                Math.PI,
                Math.PI,
            ),
            iron,
            0,
            high - blade * 0.8,
            0.02,
        ).rotateX(Math.PI / 2),
    );
}

function spear(group: Group, low: number, high: number): void {
    group.add(rod([0, low, 0.02], [0, high, 0.02], 0.008, wood));
    const tip = part(
        new SphereGeometry(0.02, 8, 6),
        iron,
        0,
        high + 0.04,
        0.02,
    );
    tip.scale.set(1, 3, 0.4);
    group.add(tip);
}

/** Raider (pawn): a young warrior with a hand axe and a painted shield. */
function raider(): Group {
    const piece = new Group();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.042, 0.16, 0],
            0.11,
            0.024,
            leather,
            fur,
        );
        end.add(
            part(new BoxGeometry(0.045, 0.025, 0.065), fur, 0, -0.01, 0.01),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.16, 0);
    body.add(part(new CylinderGeometry(0.068, 0.085, 0.07, 10), red, 0, 0.0));
    body.add(
        part(new CylinderGeometry(0.072, 0.064, 0.13, 10), leather, 0, 0.09),
    );
    body.add(
        part(new TorusGeometry(0.068, 0.01, 6, 14), iron, 0, 0.04).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.055, 0.022, 6, 14), greyFur, 0, 0.155).rotateX(
            Math.PI / 2,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.36, 0);
    head.add(part(new SphereGeometry(0.05, 12, 10), skin));
    eyes(head, 0.0, 0.047, 0.018);
    head.add(dome(0.057, iron, 0.012));
    head.add(
        part(new TorusGeometry(0.056, 0.006, 6, 16), iron, 0, 0.014).rotateX(
            Math.PI / 2,
        ),
    );
    head.add(part(new BoxGeometry(0.01, 0.035, 0.012), iron, 0, 0.0, 0.056));
    beard(head, 0.03, -0.03, 0.03, blond, [0]);
    piece.add(head);

    const right = limb(RIG.armRight, [-0.088, 0.3, 0], 0.1, 0.02, skin, skin);
    const hatchet = new Group();
    hatchet.rotation.z = 0.35;
    axe(hatchet, -0.04, 0.2, 0.05);
    right.end.add(hatchet);
    piece.add(right.pivot);

    const left = limb(RIG.armLeft, [0.088, 0.3, 0], 0.1, 0.02, skin, skin);
    const round = shield(0.095, [red, white, red, white]);
    round.position.set(0.02, 0.03, 0.05);
    left.end.add(round);
    piece.add(left.pivot);

    return piece;
}

/** Wolf Rider (knight): a warrior astride a huge grey wolf. */
function wolfRider(): Group {
    const piece = new Group();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.07, 0.12],
        [RIG.legFrontRight, -0.07, 0.12],
        [RIG.legBackLeft, 0.07, -0.12],
        [RIG.legBackRight, -0.07, -0.12],
    ] as const) {
        const { pivot } = limb(name, [x, 0.24, z], 0.16, 0.028, greyFur, fur);
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.28, -0.01);
    body.add(capsule(0.09, 0.2, greyFur).rotateX(Math.PI / 2));
    const ruff = part(new SphereGeometry(0.11, 10, 8), greyFur, 0, 0.02, 0.11);
    ruff.scale.set(1, 1, 0.8);
    body.add(ruff);
    body.add(part(new BoxGeometry(0.17, 0.03, 0.13), red, 0, 0.09, -0.01));

    // The rider sits in the saddle and turns with the wolf.
    for (const side of [-1, 1]) {
        body.add(
            capsule(0.022, 0.07, leather, side * 0.1, 0.05, 0.01).rotateZ(
                side * 0.4,
            ),
        );
    }

    body.add(capsule(0.052, 0.08, blue, 0, 0.17, -0.01));
    body.add(
        part(
            new TorusGeometry(0.05, 0.02, 6, 14),
            greyFur,
            0,
            0.23,
            -0.01,
        ).rotateX(Math.PI / 2),
    );
    body.add(part(new SphereGeometry(0.045, 12, 10), skin, 0, 0.3, 0));
    body.add(dome(0.051, iron, 0.31, 0));
    eyes(body, 0.3, 0.043, 0.016, 0.007);
    beard(body, 0.026, 0.27, 0.03, ginger, []);

    const tail = joint(RIG.tail, 0, 0.04, -0.18);
    const brush = capsule(0.04, 0.12, greyFur, 0, -0.04, -0.06);
    brush.rotation.x = -0.9;
    tail.add(brush);
    body.add(tail);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.34, 0.2);
    head.add(part(new BoxGeometry(0.11, 0.09, 0.11), greyFur, 0, 0, 0.01));
    head.add(part(new BoxGeometry(0.06, 0.05, 0.09), greyFur, 0, -0.018, 0.1));
    head.add(part(new BoxGeometry(0.05, 0.015, 0.07), white, 0, -0.045, 0.1));
    head.add(part(new SphereGeometry(0.014, 8, 6), ink, 0, 0.005, 0.145));
    eyes(head, 0.02, 0.06, 0.032, 0.012, wolfEye);

    for (const side of [-1, 1]) {
        head.add(
            part(
                new ConeGeometry(0.022, 0.06, 4),
                greyFur,
                side * 0.035,
                0.07,
                -0.02,
            ),
        );
    }

    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.075, 0.49, -0.01],
        0.11,
        0.019,
        blue,
        skin,
    );
    spear(right.end, -0.18, 0.32);
    piece.add(right.pivot);

    const left = limb(
        RIG.armLeft,
        [0.075, 0.49, -0.01],
        0.11,
        0.019,
        blue,
        skin,
    );
    const round = shield(0.065, [blue, white, blue, white]);
    round.position.set(0.02, 0.01, 0.04);
    left.end.add(round);
    piece.add(left.pivot);

    return piece;
}

/** Skald (bishop): a fur-cloaked poet with a rune-staff and a small harp. */
function skald(): Group {
    const piece = new Group();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.19, 0.05],
                [0.17, 0.12],
                [0.11, 0.4],
                [0.085, 0.52],
                [0, 0.54],
            ],
            blue,
            14,
        ),
    );
    body.add(
        part(
            new CylinderGeometry(
                0.105,
                0.205,
                0.44,
                14,
                1,
                true,
                Math.PI * 0.2,
                Math.PI * 1.6,
            ),
            cloak,
            0,
            0.29,
        ),
    );
    body.add(
        part(new TorusGeometry(0.085, 0.03, 6, 14), greyFur, 0, 0.51).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.112, 0.012, 6, 16), leather, 0, 0.36).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.175, 0.012, 6, 20), white, 0, 0.09).rotateX(
            Math.PI / 2,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.61, 0.01);
    head.add(part(new SphereGeometry(0.056, 12, 10), skin));
    eyes(head, 0.005, 0.053, 0.02);
    head.add(dome(0.06, blond, 0.004, -0.006));
    head.add(
        part(
            new CylinderGeometry(0.056, 0.064, 0.045, 10),
            fur,
            0,
            0.05,
            -0.004,
        ),
    );
    beard(head, 0.035, -0.04, 0.035, blond, [-0.02, 0.02]);
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.12, 0.47, 0.02],
        0.14,
        0.021,
        blue,
        skin,
    );
    right.end.add(rod([0, -0.27, 0.03], [0, 0.28, 0.03], 0.012, darkWood));

    for (const [y, turn] of [
        [0.04, 0.5],
        [0.11, -0.5],
        [0.18, 0],
    ]) {
        right.end.add(
            part(
                new BoxGeometry(0.006, 0.035, 0.006),
                rune,
                0,
                y,
                0.043,
            ).rotateZ(turn),
        );
    }

    right.end.add(
        part(new TorusGeometry(0.035, 0.01, 6, 12), darkWood, 0, 0.32, 0.03),
    );
    right.end.add(part(new SphereGeometry(0.017, 8, 6), rune, 0, 0.32, 0.03));
    piece.add(right.pivot);

    const left = limb(RIG.armLeft, [0.12, 0.47, 0.02], 0.14, 0.021, blue, skin);
    const harp = new Group();
    harp.position.set(0.02, -0.01, 0.06);
    harp.add(rod([0, -0.03, 0], [0, 0.1, 0], 0.008, wood));
    harp.add(rod([0, 0.1, 0], [0.07, 0.07, 0], 0.008, wood));
    harp.add(rod([0, -0.03, 0], [0.07, 0.07, 0], 0.011, wood));

    for (const x of [0.018, 0.036, 0.054]) {
        harp.add(
            rod(
                [x, x * 0.6 - 0.03 + 0.03, 0],
                [x, 0.1 - x * 0.4, 0],
                0.002,
                gold,
            ),
        );
    }

    left.end.add(harp);
    piece.add(left.pivot);

    return piece;
}

/**
 * Shieldwall Brute (rook): a huge warrior behind a tall tower shield,
 * swinging a war hammer.
 */
function shieldwallBrute(): Group {
    const piece = new Group();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.09, 0.2, 0],
            0.13,
            0.05,
            leather,
            fur,
        );
        end.add(part(new BoxGeometry(0.1, 0.04, 0.14), fur, 0, -0.03, 0.02));
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.2, 0);
    body.add(part(new CylinderGeometry(0.15, 0.18, 0.09, 12), red, 0, 0.02));
    body.add(part(new CylinderGeometry(0.17, 0.15, 0.3, 12), mail, 0, 0.19));
    body.add(
        part(new TorusGeometry(0.155, 0.022, 6, 18), leather, 0, 0.08).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new BoxGeometry(0.05, 0.04, 0.02), gold, 0, 0.08, 0.17));
    body.add(
        part(new TorusGeometry(0.15, 0.06, 6, 16), greyFur, 0, 0.34).rotateX(
            Math.PI / 2,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.62, 0.01);
    head.add(part(new SphereGeometry(0.075, 14, 10), skin));
    eyes(head, 0.005, 0.071, 0.026, 0.009);
    head.add(dome(0.082, iron, 0.014, -0.004));
    head.add(
        part(new TorusGeometry(0.08, 0.008, 6, 18), iron, 0, 0.016).rotateX(
            Math.PI / 2,
        ),
    );
    head.add(part(new BoxGeometry(0.014, 0.045, 0.014), iron, 0, -0.005, 0.08));
    head.add(part(new ConeGeometry(0.02, 0.06, 6), iron, 0, 0.1, -0.004));
    beard(head, 0.06, -0.06, 0.045, ginger, [-0.035, 0.035]);
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.25, 0.52, 0],
        0.2,
        0.046,
        skin,
        leather,
    );
    right.end.add(rod([0, -0.08, 0.03], [0, 0.32, 0.03], 0.015, wood));
    right.end.add(part(new BoxGeometry(0.16, 0.08, 0.08), iron, 0, 0.32, 0.03));
    right.end.add(
        part(new BoxGeometry(0.17, 0.02, 0.085), darkWood, 0, 0.32, 0.03),
    );
    piece.add(right.pivot);

    const left = limb(RIG.armLeft, [0.25, 0.52, 0], 0.2, 0.046, skin, leather);
    const tower = new Group();
    tower.position.set(-0.12, 0.04, 0.2);
    tower.add(part(new BoxGeometry(0.24, 0.44, 0.03), blue));
    tower.add(part(new BoxGeometry(0.06, 0.44, 0.034), white));
    tower.add(part(new BoxGeometry(0.24, 0.05, 0.036), red, 0, 0.06));

    for (const y of [-0.215, 0.215]) {
        tower.add(part(new BoxGeometry(0.25, 0.02, 0.04), iron, 0, y));
    }

    tower.add(
        part(
            new SphereGeometry(0.04, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
            iron,
            0,
            0.06,
            0.018,
        ).rotateX(Math.PI / 2),
    );
    left.end.add(tower);
    piece.add(left.pivot);

    return piece;
}

/**
 * The Shield-Maiden (queen): a braided warrior queen with a gold circlet,
 * spear and painted shield.
 */
function shieldMaiden(): Group {
    const piece = new Group();

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
            blue,
            14,
        ),
    );
    body.add(
        part(new TorusGeometry(0.185, 0.014, 6, 20), white, 0, 0.09).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new BoxGeometry(0.11, 0.36, 0.014), red, 0, 0.3, 0.14).rotateX(
            -0.27,
        ),
    );
    body.add(
        part(new TorusGeometry(0.095, 0.013, 6, 16), leather, 0, 0.46).rotateX(
            Math.PI / 2,
        ),
    );

    for (const side of [-1, 1]) {
        const brooch = part(
            new SphereGeometry(0.022, 10, 6),
            gold,
            side * 0.045,
            0.58,
            0.07,
        );
        brooch.scale.set(0.8, 1, 0.5);
        body.add(brooch);
    }

    body.add(
        part(new TorusGeometry(0.1, 0.03, 6, 14), greyFur, 0, 0.65).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new BoxGeometry(0.22, 0.48, 0.015), red, 0, 0.4, -0.14).rotateX(
            0.22,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.77, 0);
    head.add(part(new SphereGeometry(0.06, 14, 10), skin));
    eyes(head, 0.0, 0.056, 0.022);
    head.add(dome(0.064, blond, 0.008, -0.006));

    for (const side of [-1, 1]) {
        head.add(
            capsule(0.016, 0.14, blond, side * 0.058, -0.1, 0.02).rotateZ(
                side * 0.12,
            ),
        );
        head.add(
            part(
                new SphereGeometry(0.012, 6, 4),
                gold,
                side * 0.064,
                -0.18,
                0.02,
            ),
        );
    }

    head.add(
        part(new TorusGeometry(0.063, 0.008, 6, 18), gold, 0, 0.028).rotateX(
            Math.PI / 2,
        ),
    );

    for (const [x, tall] of [
        [-0.03, 0.03],
        [0, 0.045],
        [0.03, 0.03],
    ]) {
        head.add(
            part(
                new ConeGeometry(0.009, tall, 4),
                gold,
                x,
                0.03 + tall / 2,
                0.056,
            ),
        );
    }

    head.add(part(new SphereGeometry(0.01, 8, 6), rune, 0, 0.032, 0.064));
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.125, 0.64, 0],
        0.18,
        0.019,
        skin,
        leather,
    );
    spear(right.end, -0.2, 0.4);
    piece.add(right.pivot);

    const left = limb(
        RIG.armLeft,
        [0.125, 0.64, 0],
        0.18,
        0.019,
        skin,
        leather,
    );
    const round = shield(0.1, [blue, white, blue, white]);
    round.position.set(0.03, 0.03, 0.06);
    left.end.add(round);
    piece.add(left.pivot);

    return piece;
}

/**
 * The Jarl (king): a fur-mantled chieftain with an iron circlet crown and
 * a great axe.
 */
function jarl(): Group {
    const piece = new Group();

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
            red,
            14,
        ),
    );
    body.add(
        part(new TorusGeometry(0.205, 0.016, 6, 22), blue, 0, 0.1).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.152, 0.02, 6, 18), leather, 0, 0.46).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new BoxGeometry(0.06, 0.05, 0.02), gold, 0, 0.46, 0.17));
    body.add(
        part(new TorusGeometry(0.15, 0.065, 6, 18), greyFur, 0, 0.7).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new BoxGeometry(0.4, 0.62, 0.025), fur, 0, 0.4, -0.2).rotateX(
            0.16,
        ),
    );

    piece.add(body);

    const head = joint(RIG.head, 0, 0.86, 0);
    head.add(part(new SphereGeometry(0.075, 14, 10), skin));
    eyes(head, 0.01, 0.07, 0.026, 0.009);
    head.add(dome(0.079, ginger, 0.008, -0.006));
    beard(head, 0.058, -0.06, 0.045, ginger, [-0.03, 0.03]);
    head.add(
        part(new BoxGeometry(0.07, 0.016, 0.02), ginger, 0, -0.018, 0.072),
    );
    head.add(
        part(
            new CylinderGeometry(0.083, 0.08, 0.035, 12, 1, true),
            iron,
            0,
            0.04,
        ),
    );

    for (let i = 0; i < 5; i++) {
        const angle = ((i - 2) / 2) * 0.9;
        head.add(
            part(
                new ConeGeometry(0.014, i === 2 ? 0.07 : 0.05, 4),
                iron,
                Math.sin(angle) * 0.082,
                i === 2 ? 0.09 : 0.08,
                Math.cos(angle) * 0.082,
            ),
        );
    }

    head.add(part(new SphereGeometry(0.013, 8, 6), rune, 0, 0.04, 0.088));
    piece.add(head);

    const right = limb(RIG.armRight, [-0.21, 0.68, 0], 0.22, 0.032, red, skin);
    axe(right.end, -0.14, 0.5, 0.11);
    right.end.add(part(new ConeGeometry(0.02, 0.06, 4), iron, 0, 0.53, 0.02));
    piece.add(right.pivot);
    piece.add(limb(RIG.armLeft, [0.21, 0.68, 0], 0.22, 0.032, red, skin).pivot);

    return piece;
}
