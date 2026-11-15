import {
    BoxGeometry,
    ConeGeometry,
    CylinderGeometry,
    Group,
    IcosahedronGeometry,
    SphereGeometry,
    TorusGeometry,
} from 'three';
import type { Material } from 'three';
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
 * The Sun Pharaohs: a desert kingdom of sandstone and gold. White linen,
 * lapis and turquoise regalia, striped headcloths and glowing sun discs.
 */

const sandstone = material({
    color: 0xd9b47a,
    roughness: 0.95,
    flatShading: true,
});
const sandDark = material({ color: 0xa8814a, roughness: 1, flatShading: true });
const gold = material({ color: 0xe6b43c, metalness: 0.85, roughness: 0.28 });
const lapis = material({ color: 0x2a4fa8, roughness: 0.45 });
const turquoise = material({ color: 0x34bfae, roughness: 0.4 });
const linen = material({ color: 0xf4eedf, roughness: 0.85 });
const skin = material({ color: 0xa8693e, roughness: 0.7 });
const wood = material({ color: 0x7a5232, roughness: 0.7 });
const dark = material({ color: 0x1e1a24, roughness: 0.6 });
const sun = glow(0xffc23a, 0.5);
const eye = glow(0x5ef0e0, 0.45);

const builders: Record<PieceType, () => Group> = {
    p: sandstoneGuard,
    n: sphinxHound,
    b: sunPriest,
    r: obeliskColossus,
    q: serpentQueen,
    k: sunPharaoh,
};

export function buildSun(type: PieceType): Group {
    return builders[type]();
}

/** Every Sun character stands on an octagonal sandstone dais. */
function base(): Group {
    const group = new Group();
    group.add(
        part(new CylinderGeometry(0.28, 0.3, 0.05, 8), sandstone, 0, 0.025),
    );
    group.add(
        part(new TorusGeometry(0.27, 0.01, 4, 8), gold, 0, 0.05).rotateX(
            Math.PI / 2,
        ),
    );

    return group;
}

/** A glowing sun disc in a gold rim, facing forward. */
function sunDisc(radius: number): Group {
    const group = new Group();
    group.add(
        part(
            new CylinderGeometry(radius, radius, radius * 0.25, 18),
            sun,
        ).rotateX(Math.PI / 2),
    );
    group.add(part(new TorusGeometry(radius, radius * 0.14, 6, 18), gold));

    return group;
}

/**
 * A striped headcloth over a head of radius r: a cap, a brow band and two
 * flaps falling to the shoulders, striped in a second colour.
 */
function headcloth(
    head: Group,
    r: number,
    cloth: Material,
    stripe: Material,
    drop: number,
): void {
    head.add(
        part(
            new SphereGeometry(
                r * 1.1,
                16,
                8,
                0,
                Math.PI * 2,
                0,
                Math.PI * 0.52,
            ),
            cloth,
            0,
            0.004,
            -0.01,
        ),
    );
    head.add(
        part(
            new TorusGeometry(r * 1.06, r * 0.12, 6, 18),
            stripe,
            0,
            r * 0.12,
        ).rotateX(Math.PI / 2 + 0.1),
    );

    for (const side of [-1, 1]) {
        const flap = new Group();
        flap.position.set(side * r * 0.95, 0, -r * 0.15);
        flap.rotation.z = side * 0.18;
        flap.add(
            part(new BoxGeometry(r * 0.32, drop, r * 1.3), cloth, 0, -drop / 2),
        );

        for (const y of [0.3, 0.65]) {
            flap.add(
                part(
                    new BoxGeometry(r * 0.34, r * 0.16, r * 1.32),
                    stripe,
                    0,
                    -drop * y,
                ),
            );
        }

        head.add(flap);
    }
}

/** A broad jewelled collar lying on the shoulders at height y. */
function collar(group: Group, y: number, radius: number): void {
    group.add(
        part(new CylinderGeometry(radius * 0.55, radius, 0.03, 18), gold, 0, y),
    );
    group.add(
        part(
            new TorusGeometry(radius * 0.95, 0.012, 6, 20),
            turquoise,
            0,
            y - 0.012,
        ).rotateX(Math.PI / 2),
    );
}

function eyes(
    group: Group,
    y: number,
    z: number,
    spread: number,
    mat: Material = dark,
    size = 0.012,
): void {
    for (const side of [-1, 1]) {
        group.add(
            part(new SphereGeometry(size, 8, 6), mat, side * spread, y, z),
        );
    }
}

/** Sandstone Guard (pawn): a headclothed spearman with a round shield. */
function sandstoneGuard(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.045, 0.18, 0],
            0.12,
            0.022,
            skin,
            sandDark,
        );
        end.add(
            part(
                new BoxGeometry(0.045, 0.02, 0.07),
                sandDark,
                0,
                -0.015,
                0.015,
            ),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.18, 0);
    body.add(part(new CylinderGeometry(0.06, 0.085, 0.09, 12), linen, 0, 0.0));
    body.add(part(new BoxGeometry(0.03, 0.08, 0.01), gold, 0, -0.005, 0.072));
    body.add(capsule(0.058, 0.07, skin, 0, 0.09, 0));
    body.add(
        part(new TorusGeometry(0.06, 0.012, 6, 16), lapis, 0, 0.045).rotateX(
            Math.PI / 2,
        ),
    );
    collar(body, 0.15, 0.075);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.37, 0);
    head.add(part(new SphereGeometry(0.06, 14, 10), skin));
    eyes(head, -0.005, 0.055, 0.022);
    headcloth(head, 0.06, linen, lapis, 0.1);
    piece.add(head);

    const right = limb(RIG.armRight, [-0.08, 0.32, 0], 0.11, 0.019, skin);
    right.end.add(rod([0, -0.14, 0.03], [0, 0.3, 0.03], 0.008, wood));
    const blade = part(new ConeGeometry(0.022, 0.08, 4), gold, 0, 0.34, 0.03);
    blade.scale.z = 0.4;
    right.end.add(blade);
    piece.add(right.pivot);

    const left = limb(RIG.armLeft, [0.08, 0.32, 0], 0.11, 0.019, skin);
    left.end.add(
        part(
            new CylinderGeometry(0.075, 0.075, 0.014, 18),
            lapis,
            0.015,
            0.01,
            0.04,
        ).rotateX(Math.PI / 2),
    );
    left.end.add(
        part(new TorusGeometry(0.075, 0.01, 6, 18), gold, 0.015, 0.01, 0.048),
    );
    left.end.add(
        part(new SphereGeometry(0.02, 10, 8), gold, 0.015, 0.01, 0.05),
    );
    piece.add(left.pivot);

    return piece;
}

/** Sphinx Hound (knight): a lion-bodied hound in a striped headdress. */
function sphinxHound(): Group {
    const piece = base();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.08, 0.12],
        [RIG.legFrontRight, -0.08, 0.12],
        [RIG.legBackLeft, 0.08, -0.12],
        [RIG.legBackRight, -0.08, -0.12],
    ] as const) {
        const { pivot, end } = limb(name, [x, 0.22, z], 0.15, 0.03, sandstone);
        end.add(
            part(
                new BoxGeometry(0.06, 0.03, 0.07),
                sandstone,
                0,
                -0.015,
                0.015,
            ),
        );
        end.add(
            part(new TorusGeometry(0.032, 0.008, 6, 12), gold, 0, 0.06).rotateX(
                Math.PI / 2,
            ),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.28, 0);
    body.add(capsule(0.1, 0.22, sandstone, 0, 0, 0).rotateX(Math.PI / 2));
    body.add(part(new BoxGeometry(0.2, 0.012, 0.16), lapis, 0, 0.1, -0.02));
    body.add(part(new BoxGeometry(0.21, 0.014, 0.03), gold, 0, 0.102, 0.05));
    body.add(part(new BoxGeometry(0.21, 0.014, 0.03), gold, 0, 0.102, -0.09));
    body.add(rod([0, 0.04, 0.14], [0, 0.14, 0.2], 0.065, sandstone, 0.06));
    body.add(
        part(
            new TorusGeometry(0.062, 0.014, 6, 16),
            gold,
            0,
            0.11,
            0.18,
        ).rotateX(Math.PI / 2 - 0.7),
    );

    const tail = joint(RIG.tail, 0, 0.03, -0.2);
    tail.add(rod([0, 0, 0], [0, 0.12, -0.14], 0.014, sandstone, 0.01, 6));
    tail.add(part(new IcosahedronGeometry(0.03, 0), sandDark, 0, 0.13, -0.15));
    body.add(tail);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.47, 0.22);
    head.add(part(new SphereGeometry(0.075, 14, 10), sandstone));
    head.add(
        part(new BoxGeometry(0.075, 0.05, 0.07), sandstone, 0, -0.025, 0.065),
    );
    head.add(part(new SphereGeometry(0.014, 8, 6), dark, 0, -0.012, 0.1));
    eyes(head, 0.01, 0.065, 0.03, eye, 0.014);
    headcloth(head, 0.075, lapis, gold, 0.12);
    piece.add(head);

    return piece;
}

/** Sun Priest (bishop): a shaved-headed priest with a sun-disc staff. */
function sunPriest(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.19, 0.05],
                [0.17, 0.12],
                [0.11, 0.42],
                [0.09, 0.56],
                [0, 0.58],
            ],
            linen,
            12,
        ),
    );
    body.add(
        part(new BoxGeometry(0.05, 0.36, 0.015), lapis, 0, 0.26, 0.15).rotateX(
            -0.2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.125, 0.014, 6, 16), gold, 0, 0.38).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.175, 0.014, 6, 16), lapis, 0, 0.1).rotateX(
            Math.PI / 2,
        ),
    );
    collar(body, 0.54, 0.13);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.65, 0.01);
    head.add(part(new SphereGeometry(0.065, 14, 10), skin));
    eyes(head, 0.005, 0.06, 0.024);

    for (const side of [-1, 1]) {
        head.add(
            part(
                new BoxGeometry(0.03, 0.006, 0.006),
                dark,
                side * 0.03,
                0.004,
                0.062,
            ),
        );
        head.add(
            part(new SphereGeometry(0.015, 8, 6), skin, side * 0.065, 0, 0),
        );
    }

    head.add(part(new SphereGeometry(0.008, 6, 5), gold, 0, 0.035, 0.058));
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.12, 0.5, 0.02],
        0.15,
        0.022,
        linen,
        skin,
    );
    right.end.add(rod([0, -0.3, 0.03], [0, 0.34, 0.03], 0.012, gold));
    right.end.add(part(new ConeGeometry(0.025, 0.05, 4), lapis, 0, 0.36, 0.03));
    const disc = sunDisc(0.07);
    disc.position.set(0, 0.45, 0.03);
    right.end.add(disc);

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        right.end.add(
            part(
                new ConeGeometry(0.012, 0.045, 4),
                gold,
                Math.sin(angle) * 0.1,
                0.45 + Math.cos(angle) * 0.1,
                0.03,
            ).rotateZ(-angle),
        );
    }

    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.12, 0.5, 0.02], 0.15, 0.022, linen, skin).pivot,
    );

    return piece;
}

/**
 * Obelisk Colossus (rook): a walking obelisk statue with a gold capstone,
 * glowing eyes and great sandstone fists.
 */
function obeliskColossus(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.09, 0.17, 0],
            0.1,
            0.05,
            sandDark,
            sandstone,
        );
        end.add(
            part(new BoxGeometry(0.12, 0.05, 0.15), sandstone, 0, -0.02, 0.02),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.17, 0);
    body.add(
        part(
            new CylinderGeometry(0.17, 0.22, 0.5, 4),
            sandstone,
            0,
            0.25,
        ).rotateY(Math.PI / 4),
    );
    body.add(part(new BoxGeometry(0.3, 0.05, 0.3), sandDark, 0, 0.02));

    for (const [y, width, mat] of [
        [0.12, 0.27, lapis],
        [0.36, 0.23, gold],
    ] as const) {
        body.add(
            part(
                new BoxGeometry(width, 0.025, 0.02),
                mat,
                0,
                y,
                0.135 - y * 0.06,
            ),
        );
    }

    body.add(
        part(
            new BoxGeometry(0.06, 0.06, 0.02),
            turquoise,
            0,
            0.24,
            0.135,
        ).rotateZ(Math.PI / 4),
    );

    for (const side of [-1, 1]) {
        body.add(
            part(
                new BoxGeometry(0.12, 0.09, 0.14),
                sandDark,
                side * 0.19,
                0.44,
                0,
            ),
        );
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.67, 0);
    head.add(part(new BoxGeometry(0.17, 0.11, 0.17), sandstone));
    head.add(
        part(new ConeGeometry(0.13, 0.13, 4), gold, 0, 0.12).rotateY(
            Math.PI / 4,
        ),
    );
    head.add(part(new BoxGeometry(0.13, 0.02, 0.02), lapis, 0, 0.03, 0.086));

    for (const side of [-1, 1]) {
        head.add(
            part(
                new BoxGeometry(0.035, 0.016, 0.01),
                eye,
                side * 0.035,
                0.0,
                0.088,
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
            [side * 0.25, 0.58, 0],
            0.2,
            0.045,
            sandDark,
            sandstone,
        );
        end.add(part(new BoxGeometry(0.12, 0.11, 0.12), sandstone, 0, -0.03));
        end.add(part(new BoxGeometry(0.125, 0.02, 0.125), gold, 0, 0.03));
        piece.add(pivot);
    }

    return piece;
}

/**
 * The Serpent Queen (queen): a gowned queen in a gold collar, with a
 * cobra-hood headdress and a coiled serpent staff.
 */
function serpentQueen(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.2, 0.05],
                [0.18, 0.12],
                [0.1, 0.42],
                [0.075, 0.56],
                [0.1, 0.66],
                [0, 0.68],
            ],
            linen,
            14,
        ),
    );
    body.add(
        part(new BoxGeometry(0.07, 0.42, 0.015), lapis, 0, 0.27, 0.14).rotateX(
            -0.22,
        ),
    );

    for (const [y, r] of [
        [0.14, 0.17],
        [0.4, 0.105],
    ]) {
        body.add(
            part(new TorusGeometry(r, 0.014, 6, 18), gold, 0, y).rotateX(
                Math.PI / 2,
            ),
        );
    }

    collar(body, 0.64, 0.15);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.76, 0);
    head.add(part(new SphereGeometry(0.065, 14, 10), skin));
    eyes(head, 0.005, 0.06, 0.024);
    head.add(
        part(
            new SphereGeometry(0.07, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
            dark,
            0,
            0.01,
            -0.008,
        ),
    );
    head.add(part(new BoxGeometry(0.06, 0.18, 0.05), dark, 0, -0.07, -0.04));

    // The cobra hood flares up behind the head.
    const hood = part(new SphereGeometry(0.15, 16, 12), lapis, 0, 0.05, -0.06);
    hood.scale.set(0.75, 1.3, 0.25);
    head.add(hood);
    const rim = part(
        new TorusGeometry(0.15, 0.012, 6, 20),
        gold,
        0,
        0.05,
        -0.05,
    );
    rim.scale.set(0.75, 1.3, 1);
    head.add(rim);
    const inner = part(
        new SphereGeometry(0.1, 14, 10),
        turquoise,
        0,
        0.06,
        -0.045,
    );
    inner.scale.set(0.75, 1.35, 0.2);
    head.add(inner);
    head.add(
        part(new CylinderGeometry(0.07, 0.072, 0.025, 14), gold, 0, 0.055),
    );
    head.add(rod([0, 0.06, 0.06], [0, 0.11, 0.07], 0.012, gold));
    head.add(part(new SphereGeometry(0.018, 8, 6), gold, 0, 0.12, 0.075));
    eyes(head, 0.125, 0.09, 0.008, eye, 0.006);
    piece.add(head);

    const right = limb(RIG.armRight, [-0.11, 0.62, 0], 0.18, 0.02, skin, skin);
    right.end.add(
        part(new TorusGeometry(0.024, 0.008, 6, 12), gold, 0, 0.05).rotateX(
            Math.PI / 2,
        ),
    );
    right.end.add(rod([0, -0.24, 0.03], [0, 0.3, 0.03], 0.011, gold));

    for (let i = 0; i < 3; i++) {
        right.end.add(
            part(
                new TorusGeometry(0.022, 0.009, 6, 12),
                turquoise,
                0,
                0.0 + i * 0.09,
                0.03,
            ).rotateX(Math.PI / 2 - 0.3),
        );
    }

    const snake = part(
        new SphereGeometry(0.03, 10, 8),
        turquoise,
        0,
        0.33,
        0.04,
    );
    snake.scale.set(1.3, 0.7, 1.1);
    right.end.add(snake);
    eyes(right.end, 0.34, 0.07, 0.015, eye, 0.007);
    piece.add(right.pivot);

    const left = limb(RIG.armLeft, [0.11, 0.62, 0], 0.18, 0.02, skin, skin);
    left.end.add(
        part(new TorusGeometry(0.024, 0.008, 6, 12), gold, 0, 0.05).rotateX(
            Math.PI / 2,
        ),
    );
    piece.add(left.pivot);

    return piece;
}

/**
 * The Sun Pharaoh (king): a gold-masked ruler under a tall crown topped by
 * a blazing sun disc, holding a crooked sceptre.
 */
function sunPharaoh(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.23, 0.05],
                [0.2, 0.15],
                [0.14, 0.45],
                [0.15, 0.62],
                [0.1, 0.68],
                [0, 0.69],
            ],
            linen,
            14,
        ),
    );
    body.add(
        part(new BoxGeometry(0.11, 0.3, 0.02), gold, 0, 0.27, 0.17).rotateX(
            -0.18,
        ),
    );

    for (const y of [0.18, 0.28, 0.38]) {
        body.add(
            part(
                new BoxGeometry(0.115, 0.018, 0.02),
                lapis,
                0,
                y,
                0.19 - y * 0.12,
            ),
        );
    }

    body.add(
        part(new TorusGeometry(0.15, 0.022, 6, 18), lapis, 0, 0.44).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new BoxGeometry(0.4, 0.48, 0.02), lapis, 0, 0.4, -0.15));
    collar(body, 0.66, 0.2);
    body.add(
        part(new TorusGeometry(0.15, 0.012, 6, 20), lapis, 0, 0.665).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new CylinderGeometry(0.045, 0.055, 0.1, 12), gold, 0, 0.72));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.8, 0);
    head.add(part(new SphereGeometry(0.09, 16, 12), gold));
    const mask = part(new SphereGeometry(0.07, 14, 10), gold, 0, -0.015, 0.035);
    mask.scale.set(0.95, 1.15, 0.7);
    head.add(mask);
    head.add(part(new BoxGeometry(0.08, 0.008, 0.01), lapis, 0, 0.022, 0.087));
    head.add(part(new ConeGeometry(0.012, 0.035, 4), gold, 0, -0.01, 0.087));
    eyes(head, 0.005, 0.08, 0.03, eye, 0.013);
    head.add(part(new BoxGeometry(0.02, 0.07, 0.02), gold, 0, -0.1, 0.04));
    headcloth(head, 0.09, lapis, gold, 0.17);

    // A tall white crown with a gold band, topped by a blazing sun disc.
    head.add(part(new CylinderGeometry(0.04, 0.085, 0.17, 14), linen, 0, 0.15));
    head.add(part(new SphereGeometry(0.042, 12, 8), linen, 0, 0.235));
    head.add(part(new CylinderGeometry(0.09, 0.09, 0.025, 14), gold, 0, 0.07));
    const disc = sunDisc(0.07);
    disc.position.set(0, 0.3, 0.01);
    head.add(disc);

    piece.add(head);

    const right = limb(RIG.armRight, [-0.2, 0.62, 0], 0.22, 0.03, linen, gold);
    right.end.add(rod([0, -0.1, 0.03], [0, 0.4, 0.03], 0.014, gold));

    for (const y of [0.0, 0.12, 0.24]) {
        right.end.add(
            part(
                new CylinderGeometry(0.017, 0.017, 0.04, 10),
                lapis,
                0,
                y,
                0.03,
            ),
        );
    }

    right.end.add(
        part(
            new TorusGeometry(0.05, 0.014, 6, 14, Math.PI * 1.2),
            gold,
            0.05,
            0.4,
            0.03,
        ).rotateZ(-0.2),
    );
    piece.add(right.pivot);
    piece.add(limb(RIG.armLeft, [0.2, 0.62, 0], 0.22, 0.03, linen, gold).pivot);

    return piece;
}
