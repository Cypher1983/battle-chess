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
    lathe,
    limb,
    material,
    part,
    RIG,
    rod,
} from '@/lib/board3d/pieces/parts';

/**
 * The Human Kingdom: a proud medieval realm of polished steel plate, royal
 * blue and gold heraldry, crimson capes, oak and leather.
 */

const steel = material({ color: 0xb9c0cb, metalness: 0.8, roughness: 0.32 });
const iron = material({ color: 0x4d535e, metalness: 0.6, roughness: 0.5 });
const royal = material({ color: 0x1f3f95, roughness: 0.7 });
const gold = material({ color: 0xe0b040, metalness: 0.85, roughness: 0.3 });
const crimson = material({
    color: 0xa31f24,
    roughness: 0.8,
    side: DoubleSide,
});
const linen = material({ color: 0xece4d0, roughness: 0.85 });
const ermine = material({ color: 0xf6f3ea, roughness: 1 });
const wood = material({ color: 0x7a5230, roughness: 0.9, flatShading: true });
const leather = material({ color: 0x5a3a22, roughness: 0.85 });
const skin = material({ color: 0xe6b38e, roughness: 0.8 });
const hair = material({ color: 0x6b4423, roughness: 0.9 });
const horse = material({ color: 0x8a5a35, roughness: 0.8 });
const stone = material({ color: 0x9a968c, roughness: 0.95, flatShading: true });
const shadow = material({ color: 0x1a1612, roughness: 1 });
const holy = glow(0xffe08a, 0.7);
const sapphire = glow(0x4a8cff, 0.6);

const builders: Record<PieceType, () => Group> = {
    p: footman,
    n: mountedKnight,
    b: cleric,
    r: siegeTower,
    q: queen,
    k: king,
};

export function buildKingdom(type: PieceType): Group {
    return builders[type]();
}

/** Every Kingdom character stands on a dressed stone plinth with gold trim. */
function base(): Group {
    const group = new Group();
    group.add(part(new CylinderGeometry(0.28, 0.3, 0.05, 8), stone, 0, 0.025));
    group.add(
        part(new TorusGeometry(0.285, 0.008, 4, 32), gold, 0, 0.05).rotateX(
            Math.PI / 2,
        ),
    );

    return group;
}

function eyes(group: Group, y: number, z: number, spread: number): void {
    for (const side of [-1, 1]) {
        group.add(
            part(new SphereGeometry(0.009, 6, 5), shadow, side * spread, y, z),
        );
    }
}

/** A gold circlet with raised points and a sapphire at the front. */
function crown(
    group: Group,
    y: number,
    radius: number,
    points: number,
    height: number,
): void {
    group.add(
        part(
            new CylinderGeometry(radius, radius * 0.95, height * 0.45, 12),
            gold,
            0,
            y,
        ),
    );

    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        group.add(
            part(
                new ConeGeometry(radius * 0.22, height, 4),
                gold,
                Math.sin(angle) * radius * 0.9,
                y + height * 0.6,
                Math.cos(angle) * radius * 0.9,
            ),
        );
    }

    group.add(
        part(new OctahedronGeometry(radius * 0.22, 0), sapphire, 0, y, radius),
    );
}

/** A straight sword pointing up out of the hand. */
function sword(group: Group, length: number): void {
    group.add(part(new BoxGeometry(0.1, 0.018, 0.024), gold, 0, 0.02, 0.03));
    group.add(
        part(
            new BoxGeometry(0.024, length, 0.008),
            steel,
            0,
            0.03 + length / 2,
            0.03,
        ),
    );
    group.add(
        part(
            new ConeGeometry(0.017, 0.04, 4),
            steel,
            0,
            0.05 + length,
            0.03,
        ).rotateY(Math.PI / 4),
    );
    group.add(part(new SphereGeometry(0.014, 8, 6), gold, 0, -0.05, 0.03));
}

/** Two legs in hose and boots. */
function legs(
    piece: Group,
    hip: number,
    spread: number,
    length: number,
    radius: number,
    mat = leather,
): void {
    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * spread, hip, 0],
            length,
            radius,
            mat,
            iron,
        );
        end.add(
            part(
                new BoxGeometry(radius * 2.2, radius * 1.2, radius * 3.2),
                leather,
                0,
                -radius * 0.6,
                radius * 0.8,
            ),
        );
        piece.add(pivot);
    }
}

/** Footman (pawn): a soldier in a kettle helm with sword and kite shield. */
function footman(): Group {
    const piece = base();
    legs(piece, 0.19, 0.045, 0.12, 0.022);

    const body = joint(RIG.body, 0, 0.19, 0);
    body.add(capsule(0.065, 0.1, steel, 0, 0.09));
    body.add(
        lathe(
            [
                [0.075, -0.01],
                [0.072, 0.08],
                [0.07, 0.15],
                [0, 0.16],
            ],
            royal,
            10,
        ),
    );
    body.add(part(new BoxGeometry(0.03, 0.08, 0.01), gold, 0, 0.09, 0.073));
    body.add(
        part(new TorusGeometry(0.072, 0.01, 4, 14), leather, 0, 0.03).rotateX(
            Math.PI / 2,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.42, 0);
    head.add(part(new SphereGeometry(0.052, 12, 10), skin));
    eyes(head, 0.005, 0.048, 0.018);
    head.add(
        part(
            new SphereGeometry(0.058, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
            steel,
            0,
            0.005,
        ),
    );
    head.add(part(new CylinderGeometry(0.1, 0.1, 0.008, 16), steel, 0, 0.008));
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.09, 0.36, 0],
        0.11,
        0.018,
        steel,
        leather,
    );
    sword(right.end, 0.16);
    piece.add(right.pivot);

    const left = limb(
        RIG.armLeft,
        [0.09, 0.36, 0],
        0.11,
        0.018,
        steel,
        leather,
    );
    const shield = new Group();
    shield.position.set(0.02, 0.02, 0.05);
    shield.add(part(new BoxGeometry(0.13, 0.07, 0.014), royal, 0, 0.03));
    const point = part(
        new CylinderGeometry(0.092, 0.001, 0.15, 4),
        royal,
        0,
        -0.07,
    );
    point.rotation.y = Math.PI / 4;
    point.scale.z = 0.15;
    shield.add(point);
    shield.add(part(new BoxGeometry(0.018, 0.15, 0.01), gold, 0, -0.01, 0.01));
    shield.add(part(new BoxGeometry(0.1, 0.018, 0.01), gold, 0, 0.03, 0.01));
    left.end.add(shield);
    piece.add(left.pivot);

    return piece;
}

/** Mounted Knight (knight): an armoured rider on a barded warhorse. */
function mountedKnight(): Group {
    const piece = base();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.06, 0.12],
        [RIG.legFrontRight, -0.06, 0.12],
        [RIG.legBackLeft, 0.06, -0.12],
        [RIG.legBackRight, -0.06, -0.12],
    ] as const) {
        const { pivot } = limb(name, [x, 0.22, z], 0.16, 0.02, horse, shadow);
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.26, 0);
    body.add(capsule(0.08, 0.2, horse, 0, 0, 0).rotateX(Math.PI / 2));

    // The barding: a blue caparison with a gold hem.
    const cloth = lathe(
        [
            [0.105, -0.09],
            [0.1, 0.02],
            [0.085, 0.07],
            [0, 0.085],
        ],
        royal,
        10,
    );
    cloth.scale.set(1, 1, 1.9);
    body.add(cloth);
    const hem = part(new TorusGeometry(0.104, 0.01, 4, 20), gold, 0, -0.085);
    hem.rotation.x = Math.PI / 2;
    hem.scale.set(1, 1.9, 1);
    body.add(hem);
    body.add(part(new BoxGeometry(0.12, 0.04, 0.12), leather, 0, 0.09, -0.02));

    // The rider sits in the saddle, legs astride.
    body.add(capsule(0.055, 0.08, steel, 0, 0.18, -0.02));
    body.add(part(new BoxGeometry(0.1, 0.1, 0.012), royal, 0, 0.17, 0.035));
    body.add(part(new BoxGeometry(0.014, 0.06, 0.006), gold, 0, 0.17, 0.042));

    for (const side of [-1, 1]) {
        body.add(
            rod(
                [side * 0.06, 0.12, -0.01],
                [side * 0.1, 0.0, 0.02],
                0.02,
                steel,
                0.018,
            ),
        );
    }

    body.add(part(new BoxGeometry(0.14, 0.18, 0.01), crimson, 0, 0.16, -0.075));

    const helm = new Group();
    helm.position.set(0, 0.3, -0.02);
    helm.add(part(new CylinderGeometry(0.045, 0.05, 0.08, 10), steel));
    helm.add(part(new BoxGeometry(0.06, 0.008, 0.01), shadow, 0, 0.01, 0.047));
    helm.add(part(new ConeGeometry(0.03, 0.08, 6), royal, 0, 0.07, -0.01));
    body.add(helm);

    const right = limb(
        RIG.armRight,
        [-0.075, 0.22, -0.02],
        0.1,
        0.017,
        steel,
        steel,
    );
    right.end.add(rod([0, -0.08, 0.03], [0, 0.4, 0.03], 0.011, wood, 0.009));
    right.end.add(part(new ConeGeometry(0.016, 0.06, 6), steel, 0, 0.43, 0.03));
    const pennant = part(
        new BoxGeometry(0.004, 0.05, 0.09),
        royal,
        0,
        0.36,
        0.08,
    );
    right.end.add(pennant);
    body.add(right.pivot);
    body.add(
        limb(RIG.armLeft, [0.075, 0.22, -0.02], 0.1, 0.017, steel, steel).pivot,
    );

    const tail = joint(RIG.tail, 0, 0.02, -0.18);
    tail.add(rod([0, 0, 0], [0, -0.14, -0.05], 0.02, hair, 0.008, 6));
    body.add(tail);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.3, 0.14);
    head.add(rod([0, -0.02, -0.01], [0, 0.1, 0.06], 0.045, horse, 0.035, 8));
    head.add(part(new BoxGeometry(0.06, 0.06, 0.15), horse, 0, 0.11, 0.1));
    head.add(part(new BoxGeometry(0.066, 0.04, 0.12), steel, 0, 0.13, 0.11));
    head.add(part(new BoxGeometry(0.014, 0.12, 0.05), hair, 0, 0.07, 0.0));

    for (const side of [-1, 1]) {
        head.add(
            part(
                new ConeGeometry(0.012, 0.04, 4),
                horse,
                side * 0.02,
                0.16,
                0.04,
            ),
        );
    }

    piece.add(head);

    return piece;
}

/** Cleric (bishop): a robed cleric in a tall mitre with a holy mace. */
function cleric(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.19, 0.05],
                [0.17, 0.12],
                [0.11, 0.42],
                [0.085, 0.55],
                [0, 0.57],
            ],
            linen,
            12,
        ),
    );

    // A blue stole hanging down the front.
    for (const side of [-1, 1]) {
        body.add(
            part(
                new BoxGeometry(0.035, 0.4, 0.012),
                royal,
                side * 0.04,
                0.33,
                0.13,
            ).rotateX(-0.15),
        );
    }

    body.add(
        part(new TorusGeometry(0.12, 0.012, 4, 16), gold, 0, 0.36).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new BoxGeometry(0.012, 0.05, 0.01), gold, 0, 0.47, 0.095));
    body.add(part(new BoxGeometry(0.035, 0.012, 0.01), gold, 0, 0.48, 0.095));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.63, 0);
    head.add(part(new SphereGeometry(0.058, 12, 10), skin));
    eyes(head, 0.005, 0.054, 0.02);
    head.add(part(new CylinderGeometry(0.06, 0.06, 0.03, 12), gold, 0, 0.04));
    const mitre = part(new ConeGeometry(0.065, 0.2, 4), linen, 0, 0.15);
    mitre.rotation.y = Math.PI / 4;
    mitre.scale.z = 0.7;
    head.add(mitre);
    head.add(part(new BoxGeometry(0.014, 0.16, 0.01), gold, 0, 0.13, 0.033));
    head.add(part(new OctahedronGeometry(0.012, 0), holy, 0, 0.26));
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.12, 0.5, 0.01],
        0.15,
        0.022,
        linen,
        skin,
    );
    right.end.add(rod([0, -0.06, 0.03], [0, 0.2, 0.03], 0.011, wood));
    right.end.add(part(new SphereGeometry(0.035, 10, 8), steel, 0, 0.23, 0.03));

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const flange = part(
            new BoxGeometry(0.012, 0.06, 0.03),
            steel,
            Math.sin(angle) * 0.035,
            0.23,
            0.03 + Math.cos(angle) * 0.035,
        );
        flange.rotation.y = angle;
        right.end.add(flange);
    }

    right.end.add(part(new OctahedronGeometry(0.018, 0), holy, 0, 0.28, 0.03));
    piece.add(right.pivot);

    const left = limb(RIG.armLeft, [0.12, 0.5, 0.01], 0.15, 0.022, linen, skin);
    left.end.add(part(new BoxGeometry(0.07, 0.09, 0.025), crimson, 0, 0, 0.03));
    left.end.add(part(new BoxGeometry(0.02, 0.03, 0.028), gold, 0, 0, 0.032));
    piece.add(left.pivot);

    return piece;
}

/** Siege Tower (rook): a wooden siege tower that walks on stubby legs. */
function siegeTower(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.1, 0.17, 0],
            0.1,
            0.045,
            wood,
            iron,
        );
        end.add(part(new BoxGeometry(0.1, 0.04, 0.14), wood, 0, -0.02, 0.02));
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.17, 0);
    const tower = part(new CylinderGeometry(0.15, 0.19, 0.5, 4), wood, 0, 0.25);
    tower.rotation.y = Math.PI / 4;
    body.add(tower);

    for (const y of [0.06, 0.24, 0.42]) {
        const band = part(
            new CylinderGeometry(0.188 - y * 0.08, 0.19 - y * 0.08, 0.025, 4),
            iron,
            0,
            y,
        );
        band.rotation.y = Math.PI / 4;
        body.add(band);
    }

    // Archers' slits on the front and sides.
    for (const [x, y] of [
        [-0.05, 0.33],
        [0.05, 0.33],
        [0, 0.15],
    ]) {
        body.add(
            part(
                new BoxGeometry(0.018, 0.08, 0.02),
                shadow,
                x,
                y,
                0.14 + (0.33 - y) * 0.08,
            ),
        );
    }

    for (const side of [-1, 1]) {
        body.add(
            part(
                new BoxGeometry(0.02, 0.08, 0.018),
                shadow,
                side * 0.145,
                0.3,
                0,
            ),
        );
    }

    // Battlements on the fighting platform.
    body.add(part(new BoxGeometry(0.26, 0.03, 0.26), wood, 0, 0.51));

    for (const [x, z] of [
        [-0.1, -0.1],
        [0.1, -0.1],
        [-0.1, 0.1],
        [0.1, 0.1],
    ]) {
        body.add(part(new BoxGeometry(0.06, 0.07, 0.06), wood, x, 0.56, z));
    }

    // A royal banner flying from the back corner.
    body.add(rod([0.1, 0.52, -0.1], [0.1, 0.78, -0.1], 0.008, wood));
    body.add(part(new BoxGeometry(0.004, 0.08, 0.1), royal, 0.1, 0.72, -0.05));
    body.add(part(new BoxGeometry(0.006, 0.03, 0.03), gold, 0.1, 0.72, -0.04));
    piece.add(body);

    // An archer peeks over the battlements.
    const head = joint(RIG.head, 0, 0.74, 0.02);
    head.add(part(new SphereGeometry(0.045, 10, 8), skin));
    eyes(head, 0.005, 0.042, 0.016);
    head.add(
        part(
            new SphereGeometry(0.05, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
            steel,
            0,
            0.005,
        ),
    );
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.2, 0.55, 0],
            0.16,
            0.035,
            wood,
            iron,
        );
        end.add(part(new BoxGeometry(0.08, 0.08, 0.08), wood));
        pivot.add(
            part(
                new TorusGeometry(0.038, 0.008, 4, 10),
                iron,
                0,
                -0.05,
            ).rotateX(Math.PI / 2),
        );
        piece.add(pivot);
    }

    return piece;
}

/** The Queen (queen): a crowned queen in a flowing gown with a sceptre. */
function queen(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.21, 0.05],
                [0.2, 0.1],
                [0.14, 0.3],
                [0.08, 0.48],
                [0.07, 0.56],
                [0.09, 0.66],
                [0, 0.68],
            ],
            royal,
            16,
        ),
    );
    body.add(
        part(new TorusGeometry(0.2, 0.012, 4, 24), gold, 0, 0.09).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.078, 0.012, 4, 16), gold, 0, 0.5).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new CylinderGeometry(0.03, 0.09, 0.4, 3), gold, 0, 0.28, 0.1)
            .rotateX(-0.25)
            .rotateY(Math.PI),
    );
    body.add(
        part(new TorusGeometry(0.09, 0.025, 6, 16), ermine, 0, 0.67).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new BoxGeometry(0.3, 0.6, 0.01), crimson, 0, 0.36, -0.14));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.77, 0);
    head.add(rod([0, -0.08, 0], [0, -0.03, 0], 0.025, skin));
    head.add(part(new SphereGeometry(0.062, 14, 10), skin));
    eyes(head, 0.005, 0.058, 0.022);
    const locks = part(new SphereGeometry(0.068, 12, 10), hair, 0, 0.0, -0.02);
    locks.scale.set(1, 1.05, 0.95);
    head.add(locks);
    head.add(capsule(0.03, 0.06, hair, 0, -0.06, -0.05));
    crown(head, 0.06, 0.055, 5, 0.05);
    piece.add(head);

    const right = limb(RIG.armRight, [-0.1, 0.62, 0], 0.18, 0.018, royal, skin);
    right.end.add(rod([0, -0.06, 0.03], [0, 0.3, 0.03], 0.01, gold));
    right.end.add(part(new SphereGeometry(0.03, 10, 8), gold, 0, 0.32, 0.03));
    right.end.add(
        part(new OctahedronGeometry(0.022, 0), sapphire, 0, 0.37, 0.03),
    );
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.1, 0.62, 0], 0.18, 0.018, royal, skin).pivot,
    );

    return piece;
}

/** The King (king): a crowned, bearded king in a cape with a raised sword. */
function king(): Group {
    const piece = base();
    legs(piece, 0.24, 0.06, 0.17, 0.03, steel);

    const body = joint(RIG.body, 0, 0.24, 0);
    body.add(
        lathe(
            [
                [0.16, -0.02],
                [0.15, 0.08],
                [0.13, 0.2],
                [0.15, 0.36],
                [0.12, 0.44],
                [0, 0.46],
            ],
            steel,
            14,
        ),
    );
    body.add(
        lathe(
            [
                [0.165, -0.04],
                [0.16, 0.08],
                [0.14, 0.24],
                [0, 0.25],
            ],
            royal,
            14,
        ),
    );
    body.add(part(new BoxGeometry(0.06, 0.06, 0.01), gold, 0, 0.32, 0.14));
    body.add(part(new BoxGeometry(0.02, 0.1, 0.012), gold, 0, 0.12, 0.155));
    body.add(part(new BoxGeometry(0.08, 0.02, 0.012), gold, 0, 0.14, 0.155));
    body.add(
        part(new TorusGeometry(0.14, 0.02, 4, 16), leather, 0, 0.24).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.12, 0.035, 6, 16), ermine, 0, 0.44).rotateX(
            Math.PI / 2,
        ),
    );

    for (const side of [-1, 1]) {
        body.add(
            part(new SphereGeometry(0.065, 10, 8), steel, side * 0.17, 0.4, 0),
        );
    }

    const cape = part(
        new CylinderGeometry(
            0.17,
            0.24,
            0.62,
            12,
            1,
            true,
            Math.PI * 0.6,
            Math.PI * 0.8,
        ),
        crimson,
        0,
        0.16,
        -0.02,
    );
    body.add(cape);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.78, 0);
    head.add(part(new SphereGeometry(0.07, 14, 10), skin));
    eyes(head, 0.01, 0.065, 0.025);
    head.add(
        part(new ConeGeometry(0.05, 0.09, 8), hair, 0, -0.06, 0.04).rotateX(
            Math.PI,
        ),
    );
    head.add(part(new BoxGeometry(0.06, 0.012, 0.02), hair, 0, -0.015, 0.064));
    crown(head, 0.07, 0.068, 6, 0.07);
    piece.add(head);

    const right = limb(RIG.armRight, [-0.19, 0.64, 0], 0.2, 0.03, steel, steel);
    sword(right.end, 0.36);
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.19, 0.64, 0], 0.2, 0.03, steel, steel).pivot,
    );

    return piece;
}
