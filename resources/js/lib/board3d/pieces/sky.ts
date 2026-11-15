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
 * The Sky Armada: aeronauts and living airships. Sky-blue coats, white
 * canvas, polished wood and brass fittings, goggles and propellers, with
 * static electricity crackling where their magic gathers.
 */

const canvas = material({ color: 0xf2ece0, roughness: 0.85 });
const sky = material({ color: 0x4f9ad8, roughness: 0.6 });
const navy = material({ color: 0x23426b, roughness: 0.7 });
const wood = material({ color: 0x8a5a32, roughness: 0.55 });
const leather = material({ color: 0x5e3b22, roughness: 0.8 });
const brass = material({ color: 0xd2a23c, metalness: 0.85, roughness: 0.3 });
const steel = material({ color: 0xc3ccd6, metalness: 0.85, roughness: 0.25 });
const skin = material({ color: 0xe8b48e, roughness: 0.7 });
const dark = material({ color: 0x1d2430, roughness: 0.6 });
const feather = material({
    color: 0x6f8aa3,
    roughness: 0.75,
    flatShading: true,
});
const talon = material({ color: 0xe0b23a, roughness: 0.5 });
const sail = material({
    color: 0x7cb8e6,
    roughness: 0.8,
    side: DoubleSide,
    flatShading: true,
});
const cloud = material({ color: 0xffffff, roughness: 1, flatShading: true });
const spark = glow(0x8fe3ff, 0.8);
const lens = glow(0x9fe6ff, 0.5);
const glass = material({ color: 0x8fc8e8, metalness: 0.4, roughness: 0.1 });

const builders: Record<PieceType, () => Group> = {
    p: aeronautCadet,
    n: stormHawk,
    b: stormCaller,
    r: balloonGolem,
    q: stormCaptain,
    k: cloudAdmiral,
};

export function buildSky(type: PieceType): Group {
    return builders[type]();
}

/** Brass aviator goggles with glass lenses, centred at (0, y, z). */
function goggles(group: Group, y: number, z: number, spread: number): void {
    for (const side of [-1, 1]) {
        group.add(
            part(
                new TorusGeometry(0.022, 0.008, 6, 12),
                brass,
                side * spread,
                y,
                z,
            ),
        );
        group.add(
            part(
                new SphereGeometry(0.019, 10, 8),
                glass,
                side * spread,
                y,
                z - 0.004,
            ),
        );
    }
}

function eyes(group: Group, y: number, z: number, spread: number): void {
    for (const side of [-1, 1]) {
        group.add(
            part(new SphereGeometry(0.011, 8, 6), dark, side * spread, y, z),
        );
    }
}

/** A two-bladed propeller lying flat, turning around its upright axis. */
function propeller(radius: number, mat = wood): Group {
    const group = new Group();
    group.add(part(new SphereGeometry(radius * 0.18, 10, 8), brass));

    for (const turn of [0, Math.PI]) {
        const blade = part(
            new BoxGeometry(radius, radius * 0.06, radius * 0.22),
            mat,
            Math.cos(turn) * radius * 0.5,
            0,
            Math.sin(turn) * radius * 0.5,
        );
        blade.rotation.x = 0.3;
        group.add(blade);
    }

    return group;
}

/** A puffy cloud of white lumps. */
function puff(size: number): Group {
    const group = new Group();

    for (const [x, y, r] of [
        [0, 0.01, 0.05],
        [-0.045, 0, 0.035],
        [0.045, 0, 0.038],
    ]) {
        group.add(
            part(
                new IcosahedronGeometry(r * size, 1),
                cloud,
                x * size,
                y * size,
                0,
            ),
        );
    }

    return group;
}

/** Aeronaut Cadet (pawn): a goggled cadet with a propeller pack and pike. */
function aeronautCadet(): Group {
    const piece = new Group();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.045, 0.18, 0],
            0.12,
            0.024,
            navy,
            leather,
        );
        end.add(
            part(new BoxGeometry(0.05, 0.035, 0.08), leather, 0, -0.01, 0.02),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.18, 0);
    body.add(capsule(0.068, 0.07, sky, 0, 0.08, 0));
    body.add(
        part(new TorusGeometry(0.066, 0.012, 6, 16), brass, 0, 0.04).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.045, 0.016, 6, 14), canvas, 0, 0.15).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new BoxGeometry(0.1, 0.11, 0.06), leather, 0, 0.09, -0.08));
    body.add(rod([0, 0.13, -0.09], [0, 0.29, -0.09], 0.008, brass));

    const rotor = propeller(0.2);
    rotor.name = RIG.spinner;
    rotor.position.set(0, 0.29, -0.09);
    body.add(rotor);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.37, 0);
    head.add(part(new SphereGeometry(0.065, 14, 10), skin));
    head.add(
        part(
            new SphereGeometry(0.07, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            leather,
            0,
            0.004,
            -0.004,
        ),
    );
    eyes(head, -0.005, 0.06, 0.024);
    goggles(head, 0.04, 0.058, 0.026);
    piece.add(head);

    const right = limb(RIG.armRight, [-0.085, 0.32, 0], 0.11, 0.02, sky, skin);
    right.end.add(rod([0, -0.14, 0.03], [0, 0.3, 0.03], 0.009, wood));
    right.end.add(part(new ConeGeometry(0.018, 0.07, 6), steel, 0, 0.33, 0.03));
    right.end.add(
        part(new ConeGeometry(0.01, 0.04, 5), steel, 0.02, 0.29, 0.03).rotateZ(
            -1.2,
        ),
    );
    piece.add(right.pivot);
    piece.add(limb(RIG.armLeft, [0.085, 0.32, 0], 0.11, 0.02, sky, skin).pivot);

    return piece;
}

/** Storm Hawk (knight): a great saddled hawk that runs on four legs. */
function stormHawk(): Group {
    const piece = new Group();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.09, 0.12],
        [RIG.legFrontRight, -0.09, 0.12],
        [RIG.legBackLeft, 0.09, -0.12],
        [RIG.legBackRight, -0.09, -0.12],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [x, 0.25, z],
            0.17,
            0.028,
            talon,
            talon,
        );

        for (const turn of [-0.5, 0, 0.5]) {
            const claw = part(
                new ConeGeometry(0.013, 0.055, 4),
                dark,
                Math.sin(turn) * 0.022,
                -0.012,
                Math.cos(turn) * 0.028,
            );
            claw.rotation.set(Math.PI / 2, 0, -turn);
            end.add(claw);
        }

        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.34, 0);
    const torso = part(new SphereGeometry(0.15, 14, 10), feather);
    torso.scale.set(0.85, 0.8, 1.3);
    body.add(torso);
    const chest = part(new SphereGeometry(0.105, 12, 10), canvas, 0, 0, 0.11);
    chest.scale.set(0.95, 1, 0.8);
    body.add(chest);
    body.add(part(new BoxGeometry(0.22, 0.012, 0.16), sky, 0, 0.115, -0.03));
    body.add(part(new BoxGeometry(0.13, 0.04, 0.11), leather, 0, 0.135, -0.03));
    body.add(part(new TorusGeometry(0.03, 0.008, 6, 10), brass, 0, 0.16, 0.03));
    body.add(rod([0, 0.04, 0.14], [0, 0.17, 0.23], 0.055, canvas, 0.05));

    // Half-raised wings, one fan of long feathers on each shoulder.
    for (const side of [-1, 1]) {
        const wings = new Group();
        wings.position.set(side * 0.09, 0.1, -0.03);
        wings.rotation.x = -0.35;

        for (let i = 0; i < 5; i++) {
            const angle = 0.4 + i * 0.22;
            const length = 0.42 - i * 0.05;
            const plume = part(
                new ConeGeometry(0.055, length, 4),
                i > 2 ? sky : feather,
                side * Math.sin(angle) * length * 0.5,
                Math.cos(angle) * length * 0.5,
                -i * 0.01,
            );
            plume.rotation.z = -side * angle;
            plume.scale.z = 0.3;
            wings.add(plume);
        }

        body.add(wings);
    }

    const tail = joint(RIG.tail, 0, 0.02, -0.18);

    for (const turn of [-0.4, 0, 0.4]) {
        const fan = part(new ConeGeometry(0.04, 0.18, 4), feather, 0, 0, -0.08);
        fan.position.set(Math.sin(turn) * 0.06, 0, -0.08);
        fan.rotation.set(-Math.PI / 2 - 0.3, 0, turn);
        fan.scale.z = 0.3;
        tail.add(fan);
    }

    body.add(tail);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.54, 0.25);
    head.add(part(new SphereGeometry(0.075, 14, 10), canvas));
    head.add(
        part(new ConeGeometry(0.028, 0.09, 6), talon, 0, -0.01, 0.08).rotateX(
            Math.PI / 2 + 0.35,
        ),
    );

    for (const side of [-1, 1]) {
        head.add(
            part(
                new SphereGeometry(0.014, 8, 6),
                lens,
                side * 0.04,
                0.015,
                0.05,
            ),
        );
    }

    for (const turn of [-0.35, 0, 0.35]) {
        const crest = part(
            new ConeGeometry(0.018, 0.1, 4),
            sky,
            0,
            0.06,
            -0.04,
        );
        crest.rotation.set(-0.9, 0, turn);
        head.add(crest);
    }

    goggles(head, 0.045, 0.045, 0.03);
    piece.add(head);

    return piece;
}

/** Storm Caller (bishop): a weather mage with a kite and lightning rod. */
function stormCaller(): Group {
    const piece = new Group();

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
            sky,
            12,
        ),
    );
    body.add(
        part(new TorusGeometry(0.185, 0.016, 6, 18), canvas, 0, 0.11).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.128, 0.014, 6, 16), brass, 0, 0.36).rotateX(
            Math.PI / 2,
        ),
    );

    for (const side of [-1, 1]) {
        const collar = puff(0.9);
        collar.position.set(side * 0.08, 0.55, 0);
        collar.rotation.y = side * 1.2;
        body.add(collar);
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.65, 0.01);
    head.add(part(new SphereGeometry(0.065, 14, 10), skin));
    head.add(
        part(new ConeGeometry(0.05, 0.14, 8), cloud, 0, -0.08, 0.04).rotateX(
            Math.PI,
        ),
    );
    eyes(head, 0.005, 0.06, 0.024);
    head.add(part(new CylinderGeometry(0.12, 0.12, 0.012, 16), navy, 0, 0.04));
    head.add(part(new ConeGeometry(0.07, 0.22, 10), navy, 0, 0.15, -0.01));
    head.add(
        part(new CylinderGeometry(0.072, 0.072, 0.02, 14), brass, 0, 0.055),
    );
    goggles(head, 0.06, 0.065, 0.03);
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.13, 0.5, 0.02],
        0.15,
        0.022,
        sky,
        skin,
    );
    right.end.add(rod([0, -0.3, 0.03], [0, 0.36, 0.03], 0.012, wood));
    const kite = part(
        new CylinderGeometry(0.08, 0.08, 0.01, 4),
        sail,
        0,
        0.3,
        0.05,
    ).rotateX(Math.PI / 2);
    kite.scale.set(1, 1, 1.4);
    right.end.add(kite);
    right.end.add(
        part(new BoxGeometry(0.012, 0.2, 0.012), canvas, 0, 0.3, 0.06),
    );
    right.end.add(
        part(new BoxGeometry(0.13, 0.012, 0.012), canvas, 0, 0.32, 0.06),
    );
    right.end.add(part(new ConeGeometry(0.01, 0.12, 5), brass, 0, 0.42, 0.03));
    right.end.add(part(new OctahedronGeometry(0.035, 0), spark, 0, 0.5, 0.03));

    for (const [x, y, turn] of [
        [-0.025, 0.47, 0.7],
        [0.025, 0.53, -0.7],
    ]) {
        right.end.add(
            part(
                new BoxGeometry(0.05, 0.008, 0.008),
                spark,
                x,
                y,
                0.03,
            ).rotateZ(turn),
        );
    }

    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.13, 0.5, 0.02], 0.15, 0.022, sky, skin).pivot,
    );

    return piece;
}

/**
 * Balloon Golem (rook): a wooden gondola on stubby brass legs, carried by a
 * striped balloon with a rotor turning on top.
 */
function balloonGolem(): Group {
    const piece = new Group();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.1, 0.15, 0],
            0.08,
            0.045,
            brass,
            dark,
        );
        end.add(part(new BoxGeometry(0.11, 0.04, 0.13), dark, 0, -0.015, 0.02));
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.15, 0);
    body.add(part(new BoxGeometry(0.36, 0.2, 0.28), wood, 0, 0.11));
    body.add(part(new BoxGeometry(0.38, 0.03, 0.3), brass, 0, 0.215));
    body.add(part(new BoxGeometry(0.37, 0.025, 0.29), brass, 0, 0.015));
    body.add(part(new BoxGeometry(0.37, 0.012, 0.29), leather, 0, 0.11));
    body.add(
        part(new TorusGeometry(0.045, 0.012, 6, 14), brass, 0, 0.1, 0.142),
    );
    body.add(
        part(
            new CylinderGeometry(0.04, 0.04, 0.01, 12),
            lens,
            0,
            0.1,
            0.142,
        ).rotateX(Math.PI / 2),
    );

    const balloon = new Group();
    balloon.position.y = 0.6;
    const envelope = part(new SphereGeometry(0.22, 20, 14), canvas);
    balloon.add(envelope);

    for (let i = 0; i < 4; i++) {
        balloon.add(
            part(
                new SphereGeometry(
                    0.222,
                    6,
                    14,
                    (i / 4) * Math.PI * 2 + Math.PI / 8,
                    Math.PI / 4,
                ),
                sky,
            ),
        );
    }

    balloon.scale.set(1, 0.85, 1);
    body.add(balloon);

    for (const [x, z] of [
        [0.16, 0.12],
        [-0.16, 0.12],
        [0.16, -0.12],
        [-0.16, -0.12],
    ]) {
        body.add(rod([x, 0.23, z], [x * 0.6, 0.47, z * 0.6], 0.006, leather));
    }

    body.add(rod([0, 0.77, 0], [0, 0.86, 0], 0.01, brass));
    const rotor = propeller(0.26);
    rotor.name = RIG.spinner;
    rotor.position.y = 0.86;
    body.add(rotor);

    // Side propellers on brass outriggers.
    for (const side of [-1, 1]) {
        body.add(
            rod(
                [side * 0.18, 0.15, -0.1],
                [side * 0.26, 0.15, -0.16],
                0.01,
                brass,
            ),
        );
        const prop = propeller(0.14);
        prop.rotation.x = Math.PI / 2;
        prop.position.set(side * 0.26, 0.15, -0.17);
        body.add(prop);
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.4, 0.04);
    head.add(part(new SphereGeometry(0.075, 14, 10), brass));
    head.add(part(new BoxGeometry(0.11, 0.028, 0.03), lens, 0, 0.01, 0.06));
    head.add(part(new CylinderGeometry(0.08, 0.08, 0.015, 14), dark, 0, -0.03));
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.22, 0.32, 0],
            0.14,
            0.035,
            brass,
            dark,
        );
        end.add(part(new BoxGeometry(0.09, 0.08, 0.09), dark, 0, -0.02));
        piece.add(pivot);
    }

    return piece;
}

/**
 * The Storm Captain (queen): a dashing captain in a long coat and plumed
 * hat, with a rapier crackling with static.
 */
function stormCaptain(): Group {
    const piece = new Group();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.055, 0.33, 0],
            0.26,
            0.03,
            canvas,
            leather,
        );
        end.add(
            part(new CylinderGeometry(0.04, 0.038, 0.12, 10), leather, 0, 0.04),
        );
        end.add(
            part(new BoxGeometry(0.06, 0.03, 0.1), leather, 0, -0.02, 0.02),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.33, 0);
    body.add(capsule(0.09, 0.14, navy, 0, 0.15, 0));
    const tails = part(
        new CylinderGeometry(
            0.1,
            0.17,
            0.28,
            12,
            1,
            true,
            0.7,
            Math.PI * 2 - 1.4,
        ),
        material({ color: 0x23426b, roughness: 0.7, side: DoubleSide }),
        0,
        -0.06,
    );
    body.add(tails);
    body.add(
        part(new TorusGeometry(0.092, 0.016, 6, 16), brass, 0, 0.07).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new BoxGeometry(0.06, 0.12, 0.03), canvas, 0, 0.21, 0.075));

    for (const side of [-1, 1]) {
        body.add(
            part(
                new CylinderGeometry(0.045, 0.05, 0.02, 12),
                brass,
                side * 0.1,
                0.3,
            ),
        );

        for (const y of [0.12, 0.17]) {
            body.add(
                part(
                    new SphereGeometry(0.01, 6, 5),
                    brass,
                    side * 0.05,
                    y,
                    0.085,
                ),
            );
        }
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.73, 0);
    head.add(part(new SphereGeometry(0.068, 14, 10), skin));
    const hair = part(
        new SphereGeometry(0.072, 14, 10),
        leather,
        0,
        0.01,
        -0.02,
    );
    hair.scale.set(1, 1, 0.9);
    head.add(hair);
    eyes(head, 0.005, 0.063, 0.024);
    head.add(part(new CylinderGeometry(0.13, 0.13, 0.012, 18), navy, 0, 0.05));
    head.add(part(new CylinderGeometry(0.06, 0.075, 0.08, 14), navy, 0, 0.09));
    head.add(part(new CylinderGeometry(0.076, 0.076, 0.02, 14), sky, 0, 0.06));
    const plume = part(
        new ConeGeometry(0.035, 0.24, 6),
        cloud,
        0.06,
        0.15,
        -0.06,
    );
    plume.rotation.set(-0.6, 0, -0.5);
    plume.scale.z = 0.4;
    head.add(plume);
    piece.add(head);

    const right = limb(RIG.armRight, [-0.12, 0.6, 0], 0.2, 0.026, navy, skin);
    right.end.add(
        part(
            new SphereGeometry(0.035, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
            brass,
            0,
            0.02,
            0.02,
        ),
    );
    right.end.add(rod([0, 0, 0.02], [0, 0.42, 0.12], 0.007, steel, 0.003));

    for (const t of [0.35, 0.6, 0.85]) {
        right.end.add(
            part(
                new OctahedronGeometry(0.022, 0),
                spark,
                (t - 0.6) * 0.06,
                t * 0.42,
                0.02 + t * 0.1,
            ),
        );
    }

    piece.add(right.pivot);
    piece.add(limb(RIG.armLeft, [0.12, 0.6, 0], 0.2, 0.026, navy, skin).pivot);

    return piece;
}

/**
 * The Cloud Admiral (king): a stately admiral in a medal-covered coat and
 * cloud-plumed bicorne, holding a brass telescope sceptre.
 */
function cloudAdmiral(): Group {
    const piece = new Group();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.23, 0.05],
                [0.21, 0.15],
                [0.15, 0.45],
                [0.16, 0.64],
                [0.1, 0.72],
                [0, 0.73],
            ],
            navy,
            14,
        ),
    );
    body.add(
        part(new TorusGeometry(0.215, 0.018, 6, 20), brass, 0, 0.12).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new BoxGeometry(0.08, 0.5, 0.02), canvas, 0, 0.42, 0.165).rotateX(
            -0.15,
        ),
    );
    body.add(
        part(new BoxGeometry(0.05, 0.42, 0.02), sky, 0.02, 0.48, 0.15).rotateZ(
            0.75,
        ),
    );

    for (const [x, y, mat] of [
        [0.07, 0.56, brass],
        [0.1, 0.52, steel],
        [0.065, 0.5, brass],
    ] as const) {
        body.add(
            part(
                new CylinderGeometry(0.018, 0.018, 0.01, 10),
                mat,
                x,
                y,
                0.16,
            ).rotateX(Math.PI / 2),
        );
    }

    for (const side of [-1, 1]) {
        body.add(
            part(
                new CylinderGeometry(0.06, 0.065, 0.025, 14),
                brass,
                side * 0.15,
                0.68,
            ),
        );
        body.add(
            part(
                new CylinderGeometry(0.066, 0.066, 0.04, 14, 1, true),
                material({
                    color: 0xd2a23c,
                    metalness: 0.6,
                    roughness: 0.5,
                    side: DoubleSide,
                }),
                side * 0.15,
                0.65,
            ),
        );
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.83, 0);
    head.add(part(new SphereGeometry(0.08, 16, 12), skin));
    eyes(head, 0.01, 0.075, 0.028);

    for (const side of [-1, 1]) {
        const whisker = part(
            new SphereGeometry(0.035, 10, 8),
            cloud,
            side * 0.06,
            -0.03,
            0.03,
        );
        whisker.scale.set(0.8, 1.2, 0.8);
        head.add(whisker);
    }

    head.add(part(new BoxGeometry(0.06, 0.015, 0.02), cloud, 0, -0.025, 0.075));

    const hat = part(
        new CylinderGeometry(
            0.17,
            0.17,
            0.05,
            20,
            1,
            false,
            Math.PI / 2,
            Math.PI,
        ),
        navy,
        0,
        0.04,
    ).rotateX(Math.PI / 2);
    hat.scale.set(1, 1, 0.9);
    head.add(hat);
    head.add(
        part(
            new TorusGeometry(0.17, 0.008, 6, 20, Math.PI),
            brass,
            0,
            0.04,
            0.026,
        ),
    );
    head.add(
        part(
            new CylinderGeometry(0.025, 0.025, 0.01, 12),
            sky,
            0,
            0.1,
            0.03,
        ).rotateX(Math.PI / 2),
    );
    const plume = puff(1.2);
    plume.position.set(0, 0.2, -0.01);
    head.add(plume);
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.2, 0.64, 0],
        0.22,
        0.032,
        navy,
        canvas,
    );
    right.end.add(rod([0, -0.1, 0.03], [0, 0.22, 0.03], 0.016, brass));
    right.end.add(rod([0, 0.22, 0.03], [0, 0.36, 0.03], 0.021, leather));
    right.end.add(rod([0, 0.36, 0.03], [0, 0.48, 0.03], 0.027, brass));
    right.end.add(
        part(
            new CylinderGeometry(0.024, 0.024, 0.01, 12),
            lens,
            0,
            0.485,
            0.03,
        ),
    );
    right.end.add(
        part(
            new TorusGeometry(0.035, 0.008, 6, 12),
            brass,
            0,
            0.36,
            0.03,
        ).rotateX(Math.PI / 2),
    );
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.2, 0.64, 0], 0.22, 0.032, navy, canvas).pivot,
    );

    return piece;
}
