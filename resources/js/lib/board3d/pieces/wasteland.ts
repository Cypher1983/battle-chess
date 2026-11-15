import {
    BoxGeometry,
    ConeGeometry,
    CylinderGeometry,
    Group,
    IcosahedronGeometry,
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
 * The Wasteland Survivors: cheerful scavengers kitted out in rusty scrap,
 * patched leather, denim and tyres, with hazard orange and yellow paint,
 * goggles and gas masks.
 */

const rust = material({
    color: 0x9a4a22,
    metalness: 0.4,
    roughness: 0.75,
    flatShading: true,
});
const steel = material({ color: 0x8a8f94, metalness: 0.7, roughness: 0.4 });
const leather = material({
    color: 0x7a5030,
    roughness: 0.9,
    flatShading: true,
});
const denim = material({ color: 0x3e5a80, roughness: 0.95, flatShading: true });
const tyre = material({ color: 0x232323, roughness: 1, flatShading: true });
const hazard = material({ color: 0xf08a1c, roughness: 0.6, flatShading: true });
const yellow = material({ color: 0xf2c230, roughness: 0.6, flatShading: true });
const skin = material({ color: 0xd9a27a, roughness: 0.85, flatShading: true });
const fur = material({ color: 0x9a7048, roughness: 1, flatShading: true });
const khaki = material({ color: 0xa89a6a, roughness: 0.95, flatShading: true });
const cloth = material({ color: 0xe8e2d0, roughness: 0.9, flatShading: true });
const dark = material({ color: 0x2a2420, roughness: 1 });
const lens = glow(0x7fe0ff, 0.5);
const spark = glow(0xffb02e, 0.7);
const tonic = glow(0x9cff5a, 0.5);
const drip = glow(0x9cff5a, 0.3);

const builders: Record<PieceType, () => Group> = {
    p: scavenger,
    n: warHound,
    b: fieldMedic,
    r: barricadeBruiser,
    q: mechanic,
    k: warlord,
};

export function buildWasteland(type: PieceType): Group {
    return builders[type]();
}

/** A pair of round goggles strapped to a head. */
function goggles(
    group: Group,
    y: number,
    z: number,
    spread: number,
    size: number,
    glass = lens,
): void {
    for (const side of [-1, 1]) {
        const rim = part(
            new CylinderGeometry(size, size, size * 0.9, 10),
            leather,
            side * spread,
            y,
            z,
        );
        rim.rotation.x = Math.PI / 2;
        group.add(rim);
        group.add(
            part(
                new SphereGeometry(size * 0.75, 10, 6),
                glass,
                side * spread,
                y,
                z + size * 0.4,
            ),
        );
    }
}

/** A tyre lying flat (or turned by the caller). */
function tyreRing(radius: number, tube: number): Group {
    const group = new Group();
    group.add(
        part(new TorusGeometry(radius, tube, 6, 14), tyre).rotateX(Math.PI / 2),
    );

    return group;
}

/** Scavenger (pawn): scrap armour, goggles and a lead pipe. */
function scavenger(): Group {
    const piece = new Group();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.05, 0.19, 0],
            0.13,
            0.028,
            denim,
            leather,
        );
        end.add(
            part(new BoxGeometry(0.06, 0.04, 0.09), leather, 0, -0.01, 0.02),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.19, 0);
    body.add(capsule(0.075, 0.08, leather, 0, 0.09));
    // A scrap chest plate and one rusty shoulder pad.
    body.add(part(new BoxGeometry(0.11, 0.09, 0.03), rust, 0, 0.11, 0.07));
    body.add(
        part(new BoxGeometry(0.03, 0.03, 0.01), hazard, 0.02, 0.12, 0.087),
    );
    body.add(
        part(
            new SphereGeometry(0.05, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
            steel,
            0.08,
            0.17,
            0,
        ),
    );
    body.add(
        part(new TorusGeometry(0.078, 0.012, 4, 12), dark, 0, 0.03).rotateX(
            Math.PI / 2,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.44, 0.01);
    head.add(part(new SphereGeometry(0.068, 12, 10), skin));
    head.add(
        part(
            new SphereGeometry(0.072, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.4),
            hazard,
            0,
            0.005,
        ),
    );
    goggles(head, 0.005, 0.055, 0.028, 0.022);
    head.add(
        part(new TorusGeometry(0.068, 0.008, 4, 14), dark, 0, 0.005).rotateX(
            Math.PI / 2,
        ),
    );
    head.add(part(new BoxGeometry(0.03, 0.008, 0.01), dark, 0, -0.035, 0.063));
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.1, 0.36, 0],
        0.12,
        0.022,
        leather,
        skin,
    );
    // A bent length of pipe with a joint at the business end.
    right.end.add(rod([0, -0.04, 0.03], [0, 0.24, 0.03], 0.014, steel));
    right.end.add(
        part(new CylinderGeometry(0.024, 0.024, 0.04, 8), rust, 0, 0.25, 0.03),
    );
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.1, 0.36, 0], 0.12, 0.022, leather, skin).pivot,
    );

    return piece;
}

/** War Hound (knight): a scruffy mutt in scrap armour. */
function warHound(): Group {
    const piece = new Group();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.08, 0.12],
        [RIG.legFrontRight, -0.08, 0.12],
        [RIG.legBackLeft, 0.08, -0.11],
        [RIG.legBackRight, -0.08, -0.11],
    ] as const) {
        const { pivot } = limb(name, [x, 0.22, z], 0.16, 0.03, fur, leather);
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.27, 0);
    body.add(capsule(0.1, 0.2, fur, 0, 0, 0).rotateX(Math.PI / 2));
    // A saddle of rusty plates with hazard stripes.
    body.add(part(new BoxGeometry(0.2, 0.04, 0.2), rust, 0, 0.08, -0.01));
    body.add(part(new BoxGeometry(0.21, 0.042, 0.03), yellow, 0, 0.08, 0.05));
    body.add(part(new BoxGeometry(0.21, 0.042, 0.03), yellow, 0, 0.08, -0.07));

    for (const z of [-0.09, 0.07]) {
        body.add(part(new ConeGeometry(0.018, 0.05, 4), steel, 0, 0.12, z));
    }

    const tail = joint(RIG.tail, 0, 0.03, -0.19);
    tail.add(rod([0, 0, 0], [0, 0.1, -0.08], 0.022, fur, 0.01, 6));
    body.add(tail);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.36, 0.18);
    head.add(part(new IcosahedronGeometry(0.075, 1), fur));
    head.add(part(new BoxGeometry(0.07, 0.055, 0.08), fur, 0, -0.02, 0.07));
    head.add(part(new SphereGeometry(0.018, 8, 6), dark, 0, -0.005, 0.115));
    head.add(part(new BoxGeometry(0.06, 0.01, 0.05), dark, 0, -0.045, 0.08));
    // A spiked collar.
    head.add(
        part(
            new TorusGeometry(0.065, 0.014, 5, 12),
            leather,
            0,
            -0.06,
            -0.02,
        ).rotateX(Math.PI / 2 - 0.4),
    );

    for (const side of [-1, 1]) {
        head.add(
            part(
                new ConeGeometry(0.008, 0.03, 4),
                steel,
                side * 0.07,
                -0.06,
                0.0,
            ).rotateZ((-side * Math.PI) / 2),
        );
        // One ear up, one ear flopped.
        const ear = part(
            new ConeGeometry(0.03, 0.08, 4),
            leather,
            side * 0.05,
            0.07,
            -0.01,
        );
        ear.rotation.z = side > 0 ? -1.6 : 0.3;
        ear.scale.z = 0.4;
        head.add(ear);
    }

    goggles(head, 0.035, 0.05, 0.03, 0.018);
    piece.add(head);

    return piece;
}

/** Field Medic (bishop): a gas-masked healer with an IV-pole staff. */
function fieldMedic(): Group {
    const piece = new Group();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.18, 0.05],
                [0.16, 0.12],
                [0.11, 0.42],
                [0.08, 0.56],
                [0, 0.58],
            ],
            khaki,
            8,
        ),
    );
    body.add(
        part(new TorusGeometry(0.125, 0.016, 5, 12), leather, 0, 0.32).rotateX(
            Math.PI / 2,
        ),
    );
    // An orange armband and a white med-kit backpack with a cross.
    body.add(part(new BoxGeometry(0.17, 0.18, 0.08), cloth, 0, 0.43, -0.12));
    body.add(part(new BoxGeometry(0.1, 0.03, 0.01), hazard, 0, 0.44, -0.165));
    body.add(part(new BoxGeometry(0.03, 0.1, 0.01), hazard, 0, 0.44, -0.165));
    body.add(part(new BoxGeometry(0.08, 0.05, 0.04), leather, 0.06, 0.3, 0.1));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.65, 0.01);
    head.add(part(new SphereGeometry(0.07, 12, 10), leather));
    head.add(
        part(
            new SphereGeometry(0.075, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.6),
            khaki,
            0,
            0.01,
        ),
    );
    goggles(head, 0.01, 0.055, 0.028, 0.022, tonic);
    // The breathing canister of the mask.
    const filter = part(
        new CylinderGeometry(0.025, 0.03, 0.05, 8),
        steel,
        0,
        -0.04,
        0.075,
    );
    filter.rotation.x = Math.PI / 2 - 0.4;
    head.add(filter);
    head.add(
        part(
            new CylinderGeometry(0.03, 0.03, 0.01, 8),
            hazard,
            0,
            -0.05,
            0.1,
        ).rotateX(Math.PI / 2 - 0.4),
    );
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.12, 0.5, 0.02],
        0.15,
        0.024,
        khaki,
        leather,
    );
    // The IV pole: a tall rod with a hook and a glowing drip bag.
    right.end.add(rod([0, -0.3, 0.03], [0, 0.34, 0.03], 0.01, steel));
    right.end.add(rod([-0.06, 0.32, 0.03], [0.06, 0.32, 0.03], 0.008, steel));
    right.end.add(
        part(new BoxGeometry(0.05, 0.08, 0.025), drip, -0.05, 0.26, 0.03),
    );
    right.end.add(rod([-0.05, 0.22, 0.03], [-0.02, 0.05, 0.03], 0.004, cloth));

    for (const side of [-1, 1]) {
        right.end.add(
            part(
                new SphereGeometry(0.015, 6, 4),
                tyre,
                side * 0.04,
                -0.31,
                0.03,
            ),
        );
    }

    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.12, 0.5, 0.02], 0.15, 0.024, khaki, leather).pivot,
    );

    return piece;
}

/** Barricade Bruiser (rook): a big survivor wearing a wall of tyres and signs. */
function barricadeBruiser(): Group {
    const piece = new Group();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.1, 0.19, 0],
            0.12,
            0.05,
            denim,
            leather,
        );
        end.add(
            part(new BoxGeometry(0.11, 0.05, 0.14), leather, 0, -0.02, 0.02),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.2, 0);
    // Two stacked tyres around the waist.
    for (const y of [0.04, 0.13]) {
        body.add(tyreRing(0.17, 0.055).translateY(y));
    }

    body.add(part(new CylinderGeometry(0.15, 0.17, 0.26, 8), leather, 0, 0.27));

    // Road signs strapped on as armour: a striped barrier and a diamond.
    body.add(part(new BoxGeometry(0.3, 0.09, 0.02), cloth, 0, 0.28, 0.17));

    for (let i = 0; i < 4; i++) {
        body.add(
            part(
                new BoxGeometry(0.035, 0.1, 0.022),
                hazard,
                -0.105 + i * 0.07,
                0.28,
                0.172,
            ).rotateZ(0.5),
        );
    }

    const diamond = part(new BoxGeometry(0.08, 0.08, 0.02), yellow);
    diamond.position.set(0, 0.39, 0.15);
    diamond.rotation.set(-0.3, 0, Math.PI / 4);
    body.add(diamond);
    body.add(part(new BoxGeometry(0.03, 0.03, 0.01), dark, 0, 0.39, 0.165));

    // A stop-sign shaped shield on the back.
    body.add(
        part(
            new CylinderGeometry(0.15, 0.15, 0.02, 8),
            hazard,
            0,
            0.3,
            -0.17,
        ).rotateX(Math.PI / 2),
    );

    for (const side of [-1, 1]) {
        body.add(
            tyreRing(0.06, 0.03)
                .translateX(side * 0.2)
                .translateY(0.42),
        );
    }

    piece.add(body);

    // A traffic-cone helmet.
    const head = joint(RIG.head, 0, 0.66, 0.02);
    head.add(part(new SphereGeometry(0.075, 12, 10), skin));
    head.add(part(new ConeGeometry(0.085, 0.16, 10), hazard, 0, 0.1));
    head.add(part(new CylinderGeometry(0.06, 0.07, 0.025, 10), cloth, 0, 0.1));
    head.add(part(new BoxGeometry(0.18, 0.015, 0.18), hazard, 0, 0.03));
    goggles(head, -0.005, 0.06, 0.03, 0.02);
    head.add(part(new BoxGeometry(0.06, 0.03, 0.03), leather, 0, -0.05, 0.06));
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.25, 0.52, 0],
            0.2,
            0.045,
            skin,
            leather,
        );
        end.add(part(new BoxGeometry(0.1, 0.1, 0.1), leather));
        pivot.add(
            part(new CylinderGeometry(0.05, 0.05, 0.05, 8), rust, 0, -0.12),
        );
        piece.add(pivot);
    }

    return piece;
}

/** The Mechanic (queen): welding goggles, a giant wrench and a tool belt. */
function mechanic(): Group {
    const piece = new Group();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.2, 0.05],
                [0.18, 0.12],
                [0.1, 0.42],
                [0.075, 0.56],
                [0.09, 0.66],
                [0, 0.68],
            ],
            denim,
            12,
        ),
    );
    // A leather welding apron and a tool belt.
    body.add(
        lathe(
            [
                [0.185, 0.07],
                [0.17, 0.14],
                [0.11, 0.42],
                [0.09, 0.6],
            ],
            leather,
            12,
        ).translateZ(0.012),
    );
    body.add(
        part(new TorusGeometry(0.11, 0.018, 5, 14), dark, 0, 0.42).rotateX(
            Math.PI / 2,
        ),
    );

    for (const [angle, mat] of [
        [0.6, steel],
        [-0.7, yellow],
        [2.4, rust],
    ] as const) {
        body.add(
            part(
                new BoxGeometry(0.035, 0.05, 0.03),
                mat,
                Math.sin(angle) * 0.12,
                0.39,
                Math.cos(angle) * 0.12,
            ),
        );
    }

    // Shoulder pads cut from hazard-striped sheet metal.
    for (const side of [-1, 1]) {
        body.add(
            part(
                new SphereGeometry(0.05, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
                yellow,
                side * 0.1,
                0.63,
                0,
            ),
        );
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.77, 0);
    head.add(part(new SphereGeometry(0.068, 14, 10), skin));
    // Hair tied up in an orange bandana, with a big bun.
    head.add(
        part(
            new SphereGeometry(0.072, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.3),
            hazard,
            0,
            0.01,
        ),
    );
    head.add(part(new SphereGeometry(0.045, 10, 8), leather, 0, 0.08, -0.03));
    head.add(rod([0.03, 0.08, -0.06], [0.08, 0.12, -0.09], 0.008, hazard));
    goggles(head, 0.005, 0.055, 0.027, 0.024, spark);
    head.add(
        part(new TorusGeometry(0.069, 0.008, 4, 14), dark, 0, 0.005).rotateX(
            Math.PI / 2,
        ),
    );
    piece.add(head);

    const right = limb(RIG.armRight, [-0.11, 0.62, 0], 0.18, 0.02, denim, skin);
    // A wrench almost as tall as she is, its open jaw facing up.
    right.end.add(rod([0, -0.18, 0.03], [0, 0.3, 0.03], 0.018, steel));
    const jaw = part(
        new TorusGeometry(0.045, 0.02, 5, 12, Math.PI * 1.4),
        steel,
        0,
        0.35,
        0.03,
    );
    jaw.rotation.z = Math.PI * 0.8;
    right.end.add(jaw);
    right.end.add(
        part(
            new CylinderGeometry(0.025, 0.025, 0.06, 8),
            hazard,
            0,
            -0.14,
            0.03,
        ),
    );
    piece.add(right.pivot);

    const left = limb(RIG.armLeft, [0.11, 0.62, 0], 0.18, 0.02, denim, skin);
    left.end.add(
        part(new IcosahedronGeometry(0.012, 0), spark, 0, -0.02, 0.03),
    );
    piece.add(left.pivot);

    return piece;
}

/** The Warlord (king): a hubcap-and-tyre crown, spiked pads, chain sceptre. */
function warlord(): Group {
    const piece = new Group();

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
            leather,
            10,
        ),
    );
    body.add(part(new BoxGeometry(0.4, 0.46, 0.02), denim, 0, 0.4, -0.15));
    body.add(part(new BoxGeometry(0.16, 0.22, 0.04), rust, 0, 0.52, 0.13));
    body.add(part(new BoxGeometry(0.17, 0.035, 0.045), yellow, 0, 0.55, 0.13));
    body.add(
        part(new TorusGeometry(0.155, 0.022, 6, 16), dark, 0, 0.4).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(
            new CylinderGeometry(0.04, 0.04, 0.02, 8),
            steel,
            0,
            0.4,
            0.16,
        ).rotateX(Math.PI / 2),
    );

    // Spiked shoulder pads.
    for (const side of [-1, 1]) {
        body.add(
            part(
                new SphereGeometry(0.08, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
                rust,
                side * 0.17,
                0.64,
                0,
            ),
        );

        for (const [dx, dz] of [
            [0, 0],
            [side * 0.04, 0.03],
            [side * 0.03, -0.04],
        ]) {
            body.add(
                part(
                    new ConeGeometry(0.014, 0.07, 5),
                    steel,
                    side * 0.17 + dx,
                    0.7,
                    dz,
                ).rotateZ(-side * 0.4),
            );
        }
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.8, 0);
    head.add(part(new SphereGeometry(0.075, 14, 10), skin));
    // A big bushy beard and a single goggle eyepatch.
    head.add(part(new IcosahedronGeometry(0.05, 0), leather, 0, -0.05, 0.04));
    head.add(part(new SphereGeometry(0.012, 6, 4), dark, 0.026, 0.01, 0.068));
    head.add(
        part(
            new CylinderGeometry(0.024, 0.024, 0.02, 10),
            leather,
            -0.026,
            0.01,
            0.068,
        ).rotateX(Math.PI / 2),
    );
    head.add(part(new SphereGeometry(0.017, 8, 6), spark, -0.026, 0.01, 0.078));
    head.add(
        part(new TorusGeometry(0.075, 0.006, 4, 14), dark, 0, 0.01).rotateX(
            Math.PI / 2 - 0.2,
        ),
    );
    // The crown: a tyre with a hubcap at the front and scrap spikes.
    head.add(tyreRing(0.075, 0.03).translateY(0.08));
    head.add(
        part(
            new CylinderGeometry(0.045, 0.045, 0.012, 12),
            steel,
            0,
            0.1,
            0.1,
        ).rotateX(Math.PI / 2 - 0.15),
    );
    head.add(part(new SphereGeometry(0.014, 8, 6), yellow, 0, 0.1, 0.108));

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
        head.add(
            part(
                new ConeGeometry(0.016, 0.07 + (i % 2) * 0.03, 4),
                i % 2 ? rust : steel,
                Math.sin(angle) * 0.07,
                0.14,
                Math.cos(angle) * 0.07,
            ),
        );
    }

    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.21, 0.62, 0],
        0.22,
        0.032,
        leather,
        dark,
    );
    // The sceptre: an exhaust pipe topped with a cog-nut, chains dangling.
    right.end.add(rod([0, -0.1, 0.03], [0, 0.42, 0.03], 0.016, steel));
    right.end.add(
        part(new CylinderGeometry(0.05, 0.05, 0.04, 6), rust, 0, 0.44, 0.03),
    );
    right.end.add(part(new SphereGeometry(0.025, 8, 6), spark, 0, 0.48, 0.03));

    for (let i = 0; i < 4; i++) {
        const link = part(
            new TorusGeometry(0.016, 0.005, 4, 8),
            steel,
            0.05,
            0.41 - i * 0.028,
            0.03,
        );
        link.rotation.y = (i % 2) * (Math.PI / 2);
        right.end.add(link);
    }

    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.21, 0.62, 0], 0.22, 0.032, leather, dark).pivot,
    );

    return piece;
}
