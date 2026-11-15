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
 * The Star Mechs: robots in white and gunmetal armour plates, lit by
 * cyan and red light strips, with visors, antennas and thrusters.
 */

const armour = material({
    color: 0xe9edf2,
    roughness: 0.35,
    metalness: 0.15,
    flatShading: true,
});
const dish = material({
    color: 0xdfe4ea,
    roughness: 0.4,
    metalness: 0.2,
    side: DoubleSide,
});
const gunmetal = material({ color: 0x4a5260, metalness: 0.75, roughness: 0.4 });
const dark = material({ color: 0x1d222b, metalness: 0.4, roughness: 0.6 });
const accent = material({ color: 0xc8323c, roughness: 0.45, metalness: 0.2 });
const cyan = glow(0x39e6ff, 0.55);
const holo = glow(0x7ff0ff, 0.4);
const red = glow(0xff3048, 0.7);
const visor = glow(0x6ff6ff, 0.45);
const thrust = glow(0xffa24a, 0.8);

const builders: Record<PieceType, () => Group> = {
    p: droneTrooper,
    n: hoverStrider,
    b: signalTech,
    r: siegeWalker,
    q: laserValkyrie,
    k: commandCore,
};

export function buildMechs(type: PieceType): Group {
    return builders[type]();
}

/** Two robot legs with flat armoured feet, hips at height y. */
function legs(
    piece: Group,
    spread: number,
    y: number,
    length: number,
    radius: number,
    foot: [number, number, number],
    mat = gunmetal,
): void {
    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * spread, y, 0],
            length,
            radius,
            mat,
        );
        end.add(
            part(
                new BoxGeometry(...foot),
                armour,
                0,
                -foot[1] / 2 - radius * 0.3,
                foot[2] * 0.15,
            ),
        );
        piece.add(pivot);
    }
}

/** A short antenna with a glowing tip. */
function antenna(
    group: Group,
    x: number,
    y: number,
    z: number,
    height: number,
    tip = red,
): void {
    group.add(rod([x, y, z], [x, y + height, z], 0.006, gunmetal, 0.004));
    group.add(part(new SphereGeometry(0.013, 8, 6), tip, x, y + height, z));
}

/** Drone Trooper (pawn): a small bipedal robot with a blaster arm. */
function droneTrooper(): Group {
    const piece = new Group();
    legs(piece, 0.05, 0.19, 0.1, 0.022, [0.06, 0.03, 0.09]);

    const body = joint(RIG.body, 0, 0.19, 0);
    body.add(part(new BoxGeometry(0.1, 0.04, 0.07), gunmetal, 0, 0.02));
    body.add(part(new BoxGeometry(0.15, 0.13, 0.1), armour, 0, 0.11));
    body.add(part(new BoxGeometry(0.1, 0.014, 0.01), cyan, 0, 0.13, 0.051));
    body.add(part(new BoxGeometry(0.04, 0.014, 0.01), red, 0.03, 0.09, 0.051));
    body.add(part(new BoxGeometry(0.1, 0.1, 0.04), gunmetal, 0, 0.11, -0.07));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.39, 0);
    head.add(
        part(new CylinderGeometry(0.02, 0.025, 0.03, 8), gunmetal, 0, -0.05),
    );
    head.add(part(new BoxGeometry(0.11, 0.09, 0.1), armour));
    head.add(part(new BoxGeometry(0.09, 0.026, 0.01), visor, 0, 0.005, 0.051));
    antenna(head, 0.035, 0.045, -0.02, 0.07);
    piece.add(head);

    const right = limb(RIG.armRight, [-0.1, 0.34, 0], 0.11, 0.018, gunmetal);
    right.pivot.add(part(new BoxGeometry(0.05, 0.035, 0.06), armour, 0, 0.005));
    right.end.add(
        part(new BoxGeometry(0.04, 0.04, 0.12), gunmetal, 0, -0.01, 0.05),
    );
    right.end.add(rod([0, -0.01, 0.1], [0, -0.01, 0.15], 0.01, dark));
    right.end.add(part(new SphereGeometry(0.013, 8, 6), red, 0, -0.01, 0.155));
    piece.add(right.pivot);

    const left = limb(RIG.armLeft, [0.1, 0.34, 0], 0.11, 0.018, gunmetal);
    left.pivot.add(part(new BoxGeometry(0.05, 0.035, 0.06), armour, 0, 0.005));
    piece.add(left.pivot);

    return piece;
}

/** Hover Strider (knight): a four-legged walker with a cockpit head. */
function hoverStrider(): Group {
    const piece = new Group();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.1, 0.1],
        [RIG.legFrontRight, -0.1, 0.1],
        [RIG.legBackLeft, 0.1, -0.1],
        [RIG.legBackRight, -0.1, -0.1],
    ] as const) {
        const { pivot, end } = limb(name, [x, 0.3, z], 0.2, 0.022, gunmetal);
        pivot.rotation.z = x > 0 ? -0.35 : 0.35;
        pivot.add(part(new BoxGeometry(0.05, 0.08, 0.06), armour, 0, -0.03));
        end.add(
            part(new CylinderGeometry(0.035, 0.04, 0.025, 6), dark, 0, -0.04),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.33, 0);
    body.add(part(new BoxGeometry(0.22, 0.1, 0.3), armour));
    body.add(part(new BoxGeometry(0.16, 0.04, 0.24), gunmetal, 0, 0.07, -0.02));
    body.add(
        part(new CylinderGeometry(0.07, 0.07, 0.012, 12), cyan, 0, -0.055),
    );

    for (const side of [-1, 1]) {
        body.add(
            part(new BoxGeometry(0.01, 0.015, 0.22), cyan, side * 0.111, 0.01),
        );
        body.add(
            part(
                new CylinderGeometry(0.03, 0.035, 0.07, 10),
                gunmetal,
                side * 0.06,
                0.01,
                -0.17,
            ).rotateX(Math.PI / 2),
        );
        body.add(
            part(
                new CylinderGeometry(0.024, 0.024, 0.01, 10),
                thrust,
                side * 0.06,
                0.01,
                -0.206,
            ).rotateX(Math.PI / 2),
        );
    }

    antenna(body, -0.05, 0.09, -0.08, 0.1);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.38, 0.16);
    const hull = part(new SphereGeometry(0.085, 12, 10), armour, 0, 0, 0.03);
    hull.scale.set(1, 0.8, 1.1);
    head.add(hull);
    const canopy = part(new SphereGeometry(0.06, 12, 10), visor, 0, 0.03, 0.06);
    canopy.scale.set(1, 0.6, 1);
    head.add(canopy);

    for (const side of [-1, 1]) {
        head.add(
            rod(
                [side * 0.05, -0.04, 0.05],
                [side * 0.05, -0.04, 0.16],
                0.01,
                dark,
            ),
        );
        head.add(
            part(
                new SphereGeometry(0.01, 6, 5),
                red,
                side * 0.05,
                -0.04,
                0.165,
            ),
        );
    }

    piece.add(head);

    return piece;
}

/** Signal Tech (bishop): a lanky robot with a radar dish and a staff. */
function signalTech(): Group {
    const piece = new Group();
    legs(piece, 0.05, 0.28, 0.2, 0.018, [0.05, 0.025, 0.08]);

    const body = joint(RIG.body, 0, 0.28, 0);
    body.add(part(new BoxGeometry(0.1, 0.04, 0.07), gunmetal, 0, 0.02));
    body.add(
        part(new CylinderGeometry(0.075, 0.055, 0.22, 8), armour, 0, 0.15),
    );

    for (let i = 0; i < 3; i++) {
        body.add(
            part(
                new BoxGeometry(0.02 + i * 0.012, 0.012, 0.01),
                cyan,
                0,
                0.1 + i * 0.03,
                0.072,
            ),
        );
    }

    body.add(part(new BoxGeometry(0.09, 0.14, 0.05), gunmetal, 0, 0.17, -0.08));
    body.add(part(new SphereGeometry(0.012, 6, 5), red, 0.03, 0.22, -0.105));
    body.add(
        part(new CylinderGeometry(0.02, 0.025, 0.04, 8), gunmetal, 0, 0.27),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.6, 0);
    head.add(part(new CylinderGeometry(0.055, 0.06, 0.08, 10), armour));
    head.add(
        part(new CylinderGeometry(0.062, 0.062, 0.022, 12), visor, 0, 0.005),
    );

    // The radar dish turns slowly on its mast.
    const radar = joint(RIG.spinner, 0, 0.04, 0);
    radar.add(rod([0, 0, 0], [0, 0.07, 0], 0.01, gunmetal));
    const bowl = part(
        new SphereGeometry(0.09, 14, 6, 0, Math.PI * 2, 0, 0.8),
        dish,
        0,
        0.1,
        -0.075,
    );
    bowl.rotation.x = -Math.PI / 2 + 0.5;
    radar.add(bowl);
    radar.add(rod([0, 0.09, 0], [0, 0.13, 0.06], 0.005, gunmetal));
    radar.add(part(new SphereGeometry(0.012, 6, 5), cyan, 0, 0.13, 0.06));
    head.add(radar);
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.1, 0.52, 0],
        0.2,
        0.015,
        gunmetal,
        armour,
    );
    right.pivot.add(part(new SphereGeometry(0.03, 8, 6), armour));
    right.end.add(rod([0, -0.25, 0.03], [0, 0.4, 0.03], 0.01, gunmetal));

    for (const y of [0.22, 0.29, 0.35]) {
        right.end.add(
            part(
                new TorusGeometry(0.025 - (y - 0.22) * 0.08, 0.005, 5, 12),
                cyan,
                0,
                y,
                0.03,
            ).rotateX(Math.PI / 2),
        );
    }

    right.end.add(part(new SphereGeometry(0.016, 8, 6), red, 0, 0.41, 0.03));
    piece.add(right.pivot);

    const left = limb(
        RIG.armLeft,
        [0.1, 0.52, 0],
        0.2,
        0.015,
        gunmetal,
        armour,
    );
    left.pivot.add(part(new SphereGeometry(0.03, 8, 6), armour));
    piece.add(left.pivot);

    return piece;
}

/** Siege Walker (rook): a heavy two-legged tank with a big cannon. */
function siegeWalker(): Group {
    const piece = new Group();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.12, 0.22, 0],
            0.12,
            0.045,
            gunmetal,
        );
        pivot.add(
            part(new BoxGeometry(0.1, 0.1, 0.11), armour, 0, -0.04, 0.01),
        );
        end.add(
            part(new BoxGeometry(0.13, 0.05, 0.17), armour, 0, -0.03, 0.02),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.22, 0);
    body.add(part(new BoxGeometry(0.36, 0.26, 0.3), armour, 0, 0.15));
    body.add(part(new BoxGeometry(0.3, 0.06, 0.32), gunmetal, 0, 0.03));
    body.add(part(new BoxGeometry(0.24, 0.02, 0.01), red, 0, 0.2, 0.151));
    body.add(part(new BoxGeometry(0.14, 0.08, 0.01), dark, 0, 0.12, 0.151));

    for (const x of [-0.04, 0, 0.04]) {
        body.add(
            part(new BoxGeometry(0.02, 0.05, 0.012), accent, x, 0.12, 0.155),
        );
    }

    body.add(part(new BoxGeometry(0.2, 0.16, 0.06), gunmetal, 0, 0.15, -0.17));
    piece.add(body);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.23, 0.44, 0],
            0.12,
            0.035,
            gunmetal,
        );
        pivot.add(
            part(new BoxGeometry(0.09, 0.06, 0.12), armour, side * 0.01, 0.01),
        );
        end.add(part(new BoxGeometry(0.08, 0.1, 0.12), armour, 0, -0.02, 0.02));

        for (const [x, y] of [
            [-0.02, 0],
            [0.02, 0],
            [-0.02, -0.04],
            [0.02, -0.04],
        ]) {
            end.add(
                part(
                    new CylinderGeometry(0.012, 0.012, 0.01, 8),
                    red,
                    x,
                    y,
                    0.081,
                ).rotateX(Math.PI / 2),
            );
        }

        piece.add(pivot);
    }

    // The turret is its head, with the cannon pointing ahead.
    const head = joint(RIG.head, 0, 0.5, 0);
    head.add(part(new BoxGeometry(0.24, 0.11, 0.22), armour, 0, 0.055));
    head.add(part(new BoxGeometry(0.16, 0.02, 0.01), visor, 0, 0.075, 0.111));
    head.add(part(new BoxGeometry(0.1, 0.08, 0.06), gunmetal, 0, 0.04, 0.13));
    head.add(
        part(
            new CylinderGeometry(0.03, 0.035, 0.28, 10),
            gunmetal,
            0,
            0.04,
            0.27,
        ).rotateX(Math.PI / 2),
    );
    head.add(part(new BoxGeometry(0.08, 0.06, 0.05), dark, 0, 0.04, 0.42));
    antenna(head, -0.09, 0.11, -0.07, 0.12);
    piece.add(head);

    return piece;
}

/** Laser Valkyrie (queen): a sleek winged mech with a laser lance. */
function laserValkyrie(): Group {
    const piece = new Group();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.05, 0.33, 0],
            0.25,
            0.018,
            gunmetal,
        );
        pivot.add(capsule(0.03, 0.08, armour, 0, -0.07));
        end.add(capsule(0.026, 0.06, armour, 0, 0.06));
        end.add(
            part(
                new ConeGeometry(0.025, 0.09, 4),
                armour,
                0,
                -0.02,
                0.03,
            ).rotateX(Math.PI / 2),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.33, 0);
    body.add(part(new CylinderGeometry(0.07, 0.11, 0.08, 8), armour, 0, 0));
    body.add(
        part(new CylinderGeometry(0.045, 0.05, 0.08, 8), gunmetal, 0, 0.08),
    );
    body.add(
        lathe(
            [
                [0.05, 0.1],
                [0.09, 0.18],
                [0.1, 0.25],
                [0.06, 0.31],
                [0, 0.32],
            ],
            armour,
            8,
        ),
    );
    body.add(part(new OctahedronGeometry(0.025, 0), cyan, 0, 0.21, 0.09));

    // Jet wings sweeping up and out behind her shoulders.
    for (const side of [-1, 1]) {
        const wings = new Group();
        wings.position.set(side * 0.06, 0.25, -0.08);
        wings.rotation.set(0.25, side * 0.4, 0);

        for (let i = 0; i < 2; i++) {
            const panel = part(
                new BoxGeometry(0.26 - i * 0.06, 0.05, 0.012),
                armour,
                side * (0.12 - i * 0.02),
                0.04 - i * 0.07,
                0,
            );
            panel.rotation.z = side * (0.55 - i * 0.35);
            wings.add(panel);
            const strip = part(
                new BoxGeometry(0.2 - i * 0.06, 0.01, 0.014),
                i ? red : cyan,
                side * (0.12 - i * 0.02),
                0.04 - i * 0.07,
                0,
            );
            strip.rotation.z = panel.rotation.z;
            strip.translateY(0.026);
            wings.add(strip);
        }

        wings.add(
            part(
                new CylinderGeometry(0.025, 0.03, 0.1, 8),
                gunmetal,
                side * 0.02,
                -0.03,
                -0.02,
            ),
        );
        wings.add(
            part(
                new ConeGeometry(0.022, 0.06, 8),
                thrust,
                side * 0.02,
                -0.1,
                -0.02,
            ).rotateX(Math.PI),
        );
        body.add(wings);
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.69, 0);
    head.add(
        part(new CylinderGeometry(0.018, 0.022, 0.05, 8), gunmetal, 0, -0.05),
    );
    const helm = part(new SphereGeometry(0.058, 12, 10), armour);
    helm.scale.set(0.95, 1.1, 1);
    head.add(helm);
    const glass = part(new SphereGeometry(0.045, 12, 8), visor, 0, 0, 0.025);
    glass.scale.set(1.05, 0.4, 0.9);
    head.add(glass);
    head.add(
        part(
            new BoxGeometry(0.012, 0.05, 0.13),
            armour,
            0,
            0.07,
            -0.03,
        ).rotateX(0.4),
    );

    for (const side of [-1, 1]) {
        head.add(
            part(
                new BoxGeometry(0.01, 0.025, 0.1),
                accent,
                side * 0.055,
                0.03,
                -0.03,
            ).rotateX(0.5),
        );
    }

    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.11, 0.6, 0],
        0.2,
        0.016,
        gunmetal,
        armour,
    );
    right.pivot.add(part(new SphereGeometry(0.035, 10, 8), armour));
    right.end.add(rod([0, -0.14, 0.03], [0, 0.1, 0.03], 0.01, gunmetal));
    right.end.add(
        part(new BoxGeometry(0.07, 0.015, 0.03), armour, 0, 0.11, 0.03),
    );
    right.end.add(rod([0, 0.12, 0.03], [0, 0.55, 0.03], 0.014, cyan, 0.003, 6));
    piece.add(right.pivot);

    const left = limb(
        RIG.armLeft,
        [0.11, 0.6, 0],
        0.2,
        0.016,
        gunmetal,
        armour,
    );
    left.pivot.add(part(new SphereGeometry(0.035, 10, 8), armour));
    piece.add(left.pivot);

    return piece;
}

/**
 * Command Core (king): a big commander mech with a glowing reactor core,
 * a holographic crown ring and a cape of heat-sink fins.
 */
function commandCore(): Group {
    const piece = new Group();
    legs(piece, 0.1, 0.3, 0.18, 0.045, [0.1, 0.05, 0.15]);

    const body = joint(RIG.body, 0, 0.3, 0);
    body.add(part(new BoxGeometry(0.24, 0.08, 0.16), gunmetal, 0, 0.03));
    body.add(part(new BoxGeometry(0.34, 0.28, 0.22), armour, 0, 0.22));
    body.add(part(new BoxGeometry(0.4, 0.08, 0.22), armour, 0, 0.39));
    body.add(part(new SphereGeometry(0.05, 12, 10), cyan, 0, 0.24, 0.1));
    body.add(
        part(new TorusGeometry(0.06, 0.012, 6, 16), gunmetal, 0, 0.24, 0.11),
    );

    for (const side of [-1, 1]) {
        body.add(
            part(
                new BoxGeometry(0.012, 0.18, 0.012),
                red,
                side * 0.13,
                0.22,
                0.111,
            ),
        );
    }

    // Heat-sink fins fanned out down the back like a cape.
    for (let i = 0; i < 7; i++) {
        const offset = (i - 3) / 3;
        const fin = part(
            new BoxGeometry(0.035, 0.46, 0.05),
            i % 2 ? gunmetal : dark,
            offset * 0.16,
            0.16,
            -0.15 - Math.abs(offset) * 0.02,
        );
        fin.rotation.set(0.18, 0, -offset * 0.12);
        body.add(fin);
    }

    body.add(
        part(new BoxGeometry(0.3, 0.012, 0.02), red, 0, 0.0, -0.21).rotateX(
            0.18,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.8, 0);
    head.add(part(new BoxGeometry(0.13, 0.12, 0.12), armour));
    head.add(part(new BoxGeometry(0.11, 0.03, 0.01), visor, 0, 0.01, 0.061));
    head.add(
        part(new BoxGeometry(0.09, 0.03, 0.03), gunmetal, 0, -0.045, 0.05),
    );

    for (const side of [-1, 1]) {
        head.add(
            part(
                new BoxGeometry(0.015, 0.1, 0.05),
                accent,
                side * 0.07,
                0.04,
                -0.01,
            ).rotateZ(side * -0.3),
        );
    }

    // A holographic crown ring hovers over its head, slowly turning.
    const crown = joint(RIG.spinner, 0, 0.12, 0);
    crown.add(
        part(new TorusGeometry(0.1, 0.008, 6, 32), holo).rotateX(Math.PI / 2),
    );

    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        crown.add(
            part(
                new OctahedronGeometry(0.022, 0),
                holo,
                Math.sin(angle) * 0.1,
                0.04,
                Math.cos(angle) * 0.1,
            ),
        );
    }

    head.add(crown);
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.25, 0.68, 0],
            0.22,
            0.04,
            gunmetal,
            armour,
        );
        pivot.add(
            part(new BoxGeometry(0.12, 0.08, 0.14), armour, side * 0.01, 0.02),
        );
        pivot.add(
            part(
                new BoxGeometry(0.1, 0.012, 0.01),
                red,
                side * 0.01,
                0.02,
                0.072,
            ),
        );

        if (side < 0) {
            end.add(rod([0, -0.08, 0.04], [0, 0.32, 0.04], 0.013, gunmetal));
            end.add(part(new OctahedronGeometry(0.04, 0), cyan, 0, 0.37, 0.04));
        }

        piece.add(pivot);
    }

    return piece;
}
