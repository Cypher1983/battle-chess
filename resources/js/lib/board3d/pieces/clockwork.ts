import {
    BoxGeometry,
    ConeGeometry,
    CylinderGeometry,
    Group,
    SphereGeometry,
    TorusGeometry,
} from 'three';
import type { PieceType } from '@/lib/armies';
import {
    capsule,
    gear,
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
 * The Clockwork Legion (white): brass and steel automatons with glowing
 * blue eyes, wind-up keys and gears. Each is a character with a head, arms
 * and legs (named with RIG) so battles and idle animation can move them.
 */

const brass = material({ color: 0xc9952b, metalness: 0.85, roughness: 0.3 });
const steel = material({ color: 0xb4bcc4, metalness: 0.85, roughness: 0.32 });
const copper = material({ color: 0xb8653a, metalness: 0.8, roughness: 0.35 });
const iron = material({ color: 0x3b3f45, metalness: 0.6, roughness: 0.5 });
const enamel = material({ color: 0xf3ead2, roughness: 0.4 });
const plume = material({ color: 0xb3262b, roughness: 0.7 });
const glass = material({
    color: 0x9fd8ff,
    roughness: 0.1,
    transparent: true,
    opacity: 0.35,
});
const eye = glow(0x7fd4ff, 0.55);
const furnace = glow(0xffa040, 1.2);

const builders: Record<PieceType, () => Group> = {
    p: tickSoldier,
    n: cogCharger,
    b: gearwright,
    r: bulwarkEngine,
    q: arcDuchess,
    k: regulator,
};

export function buildClockwork(type: PieceType): Group {
    const piece = builders[type]();
    piece.name = `w${type}`;

    return piece;
}

/** Every Clockwork character stands on a thin brass cog. */
function base(): Group {
    const group = new Group();
    const cog = gear(0.3, 0.05, 14, brass);
    cog.position.y = 0.025;
    group.add(cog);

    return group;
}

/** A wind-up key sticking out of a back, at height y and depth z. */
function windUpKey(y: number, z: number): Group {
    const key = new Group();
    key.add(rod([0, y, z], [0, y, z - 0.08], 0.014, brass));
    const loop = part(
        new TorusGeometry(0.04, 0.012, 8, 16),
        brass,
        0,
        y,
        z - 0.11,
    );
    loop.rotation.y = Math.PI / 2;
    key.add(loop);

    return key;
}

/** Two piston legs with boots, hips at height `hip`. */
function pistonLegs(piece: Group, hip: number, spread: number): void {
    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * spread, hip, 0],
            hip - 0.09,
            0.032,
            steel,
            iron,
        );
        end.add(part(new BoxGeometry(0.07, 0.035, 0.11), iron, 0, -0.02, 0.02));
        piece.add(pivot);
    }
}

/**
 * Tick Soldier (pawn): a wind-up tin soldier with a plumed shako and a
 * spear.
 */
function tickSoldier(): Group {
    const piece = base();
    pistonLegs(piece, 0.26, 0.055);

    const body = joint(RIG.body, 0, 0.26, 0);
    body.add(part(new CylinderGeometry(0.1, 0.09, 0.2, 20), brass, 0, 0.1));
    body.add(
        part(new TorusGeometry(0.098, 0.012, 8, 24), copper, 0, 0.03).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(
            new BoxGeometry(0.02, 0.18, 0.02),
            enamel,
            0.04,
            0.1,
            0.09,
        ).rotateZ(0.5),
    );
    body.add(
        part(
            new BoxGeometry(0.02, 0.18, 0.02),
            enamel,
            -0.04,
            0.1,
            0.09,
        ).rotateZ(-0.5),
    );
    body.add(windUpKey(0.1, -0.09));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.5, 0);
    head.add(part(new SphereGeometry(0.075, 20, 14), steel, 0, 0.02));
    head.add(part(new BoxGeometry(0.09, 0.018, 0.02), eye, 0, 0.03, 0.066));
    head.add(part(new CylinderGeometry(0.065, 0.072, 0.09, 20), iron, 0, 0.1));
    head.add(part(new CylinderGeometry(0.08, 0.08, 0.012, 20), brass, 0, 0.06));
    head.add(capsule(0.022, 0.08, plume, 0, 0.2, -0.01));
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.125, 0.44, 0],
        0.15,
        0.026,
        steel,
        brass,
    );
    // The spear rests upright in the hand; thrusting swings the arm.
    right.end.add(rod([0, -0.2, 0.03], [0, 0.4, 0.03], 0.012, iron));
    right.end.add(part(new ConeGeometry(0.03, 0.09, 8), steel, 0, 0.44, 0.03));
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.125, 0.44, 0], 0.15, 0.026, steel, brass).pivot,
    );

    return piece;
}

/** Cog Charger (knight): a four-legged clockwork war-horse. */
function cogCharger(): Group {
    const piece = base();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.075, 0.14],
        [RIG.legFrontRight, -0.075, 0.14],
        [RIG.legBackLeft, 0.075, -0.14],
        [RIG.legBackRight, -0.075, -0.14],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [x, 0.34, z],
            0.27,
            0.028,
            steel,
            iron,
        );
        pivot.add(
            part(
                new CylinderGeometry(0.04, 0.04, 0.02, 12),
                brass,
                0,
                -0.13,
                0,
            ).rotateZ(Math.PI / 2),
        );
        end.add(
            part(
                new CylinderGeometry(0.035, 0.04, 0.03, 10),
                iron,
                0,
                -0.01,
                0,
            ),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.42, 0);
    body.add(capsule(0.1, 0.28, steel, 0, 0, 0).rotateX(Math.PI / 2));
    body.add(part(new BoxGeometry(0.16, 0.06, 0.2), brass, 0, 0.09, 0));
    body.add(
        part(new CylinderGeometry(0.03, 0.035, 0.12, 10), iron, 0, 0.16, -0.12),
    );
    body.add(part(new BoxGeometry(0.06, 0.04, 0.02), furnace, 0, 0.0, 0.2));
    const mane = gear(0.1, 0.03, 9, copper);
    mane.rotation.z = Math.PI / 2;
    mane.position.set(0, 0.16, 0.12);
    body.add(mane);
    const tail = joint(RIG.tail, 0, 0.04, -0.2);
    tail.add(rod([0, 0, 0], [0, -0.05, -0.15], 0.015, copper));
    tail.add(rod([0, 0, 0], [0.03, -0.09, -0.12], 0.012, copper));
    body.add(tail);
    piece.add(body);

    piece.add(
        part(new BoxGeometry(0.1, 0.24, 0.12), brass, 0, 0.62, 0.19).rotateX(
            0.55,
        ),
    );

    const head = joint(RIG.head, 0, 0.74, 0.27);
    head.add(part(new BoxGeometry(0.11, 0.11, 0.22), brass, 0, 0, 0.06));
    head.add(part(new BoxGeometry(0.09, 0.08, 0.08), steel, 0, -0.02, 0.19));
    head.add(part(new BoxGeometry(0.1, 0.012, 0.012), iron, 0, -0.05, 0.22));

    for (const side of [-1, 1]) {
        head.add(
            part(
                new ConeGeometry(0.025, 0.08, 6),
                steel,
                side * 0.035,
                0.09,
                -0.02,
            ),
        );
        head.add(
            part(
                new SphereGeometry(0.02, 10, 8),
                eye,
                side * 0.057,
                0.02,
                0.09,
            ),
        );
    }

    piece.add(head);

    return piece;
}

/**
 * Gearwright (bishop): a robed tinkerer in goggles and a pointed cap,
 * with a spinning cog halo and a great wrench.
 */
function gearwright(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.21, 0.05],
                [0.2, 0.1],
                [0.13, 0.42],
                [0.1, 0.58],
                [0, 0.6],
            ],
            brass,
        ),
    );
    body.add(
        part(new TorusGeometry(0.15, 0.015, 8, 24), copper, 0, 0.3).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new BoxGeometry(0.06, 0.08, 0.03), iron, 0.06, 0.32, 0.13));
    body.add(part(new SphereGeometry(0.06, 12, 8), steel, 0.13, 0.55, 0));
    body.add(part(new SphereGeometry(0.06, 12, 8), steel, -0.13, 0.55, 0));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.68, 0);
    head.add(part(new SphereGeometry(0.09, 20, 14), steel));

    for (const side of [-1, 1]) {
        head.add(
            part(
                new TorusGeometry(0.03, 0.01, 8, 16),
                copper,
                side * 0.038,
                0.01,
                0.075,
            ),
        );
        head.add(
            part(
                new SphereGeometry(0.024, 10, 8),
                eye,
                side * 0.038,
                0.01,
                0.07,
            ),
        );
    }

    head.add(part(new ConeGeometry(0.085, 0.2, 20), brass, 0, 0.15));
    head.add(
        part(new CylinderGeometry(0.095, 0.095, 0.02, 20), copper, 0, 0.06),
    );
    const halo = gear(0.13, 0.025, 12, brass);
    halo.name = RIG.spinner;
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, 0.05, -0.1);
    head.add(halo);
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.14, 0.53, 0],
        0.17,
        0.025,
        brass,
        steel,
    );
    right.end.add(rod([0, -0.25, 0.03], [0, 0.32, 0.03], 0.014, iron));
    const jaw = part(
        new TorusGeometry(0.05, 0.016, 8, 16, Math.PI * 1.5),
        steel,
        0,
        0.37,
        0.03,
    );
    jaw.rotation.z = Math.PI * 0.75;
    right.end.add(jaw);
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.14, 0.53, 0], 0.17, 0.025, brass, steel).pivot,
    );

    return piece;
}

/**
 * Bulwark Engine (rook): a walking boiler-tower with battlements, a
 * glowing furnace mouth, a cannon arm and a great fist.
 */
function bulwarkEngine(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.11, 0.2, 0],
            0.13,
            0.05,
            iron,
            iron,
        );
        end.add(part(new BoxGeometry(0.12, 0.05, 0.16), iron, 0, -0.03, 0.02));
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.2, 0);
    body.add(part(new CylinderGeometry(0.19, 0.21, 0.42, 28), steel, 0, 0.22));

    for (const y of [0.06, 0.38]) {
        body.add(
            part(new TorusGeometry(0.2, 0.018, 8, 28), brass, 0, y).rotateX(
                Math.PI / 2,
            ),
        );
    }

    body.add(part(new CylinderGeometry(0.22, 0.2, 0.05, 28), brass, 0, 0.45));

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const merlon = part(
            new BoxGeometry(0.09, 0.08, 0.07),
            steel,
            Math.sin(angle) * 0.18,
            0.51,
            Math.cos(angle) * 0.18,
        );
        merlon.rotation.y = angle;
        body.add(merlon);
    }

    body.add(part(new BoxGeometry(0.12, 0.07, 0.03), furnace, 0, 0.14, 0.2));
    body.add(part(new BoxGeometry(0.14, 0.025, 0.03), eye, 0, 0.32, 0.195));
    body.add(
        part(
            new CylinderGeometry(0.04, 0.045, 0.2, 12),
            iron,
            0.08,
            0.56,
            -0.08,
        ),
    );
    piece.add(body);

    const right = limb(RIG.armRight, [-0.24, 0.5, 0], 0.16, 0.04, iron, iron);
    right.end.add(
        part(
            new CylinderGeometry(0.045, 0.055, 0.22, 14),
            iron,
            0,
            0,
            0.06,
        ).rotateX(Math.PI / 2),
    );
    right.end.add(
        part(new TorusGeometry(0.05, 0.012, 8, 16), brass, 0, 0, 0.17),
    );
    piece.add(right.pivot);

    const left = limb(RIG.armLeft, [0.24, 0.5, 0], 0.16, 0.04, iron, brass);
    left.end.add(part(new SphereGeometry(0.075, 14, 10), brass));
    piece.add(left.pivot);

    return piece;
}

/**
 * Arc Duchess (queen): an elegant automaton in a coiled bell skirt with a
 * tesla-coil crown and a lightning sceptre.
 */
function arcDuchess(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.24, 0.05],
                [0.23, 0.1],
                [0.13, 0.42],
                [0.075, 0.55],
                [0.09, 0.66],
                [0.06, 0.7],
                [0, 0.71],
            ],
            steel,
        ),
    );

    for (const [y, radius] of [
        [0.16, 0.2],
        [0.26, 0.17],
        [0.36, 0.14],
    ]) {
        body.add(
            part(new TorusGeometry(radius, 0.013, 8, 28), copper, 0, y).rotateX(
                Math.PI / 2,
            ),
        );
    }

    body.add(part(new SphereGeometry(0.045, 12, 8), brass, 0.11, 0.66, 0));
    body.add(part(new SphereGeometry(0.045, 12, 8), brass, -0.11, 0.66, 0));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.8, 0);
    head.add(rod([0, -0.1, 0], [0, -0.03, 0], 0.025, brass));
    head.add(part(new SphereGeometry(0.075, 20, 14), brass));
    head.add(part(new BoxGeometry(0.09, 0.018, 0.02), eye, 0, 0.005, 0.068));
    head.add(
        part(new TorusGeometry(0.08, 0.014, 8, 24), brass, 0, 0.08).rotateX(
            Math.PI / 2,
        ),
    );

    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.sin(angle) * 0.08;
        const z = Math.cos(angle) * 0.08;
        head.add(rod([x, 0.08, z], [x * 1.35, 0.2, z * 1.35], 0.01, steel));
        head.add(
            part(
                new SphereGeometry(0.024, 10, 8),
                eye,
                x * 1.35,
                0.22,
                z * 1.35,
            ),
        );
    }

    piece.add(head);

    const right = limb(RIG.armRight, [-0.12, 0.64, 0], 0.2, 0.02, steel, brass);
    right.end.add(rod([0, -0.12, 0.02], [0, 0.3, 0.02], 0.011, copper));
    right.end.add(part(new SphereGeometry(0.035, 12, 8), eye, 0, 0.33, 0.02));
    right.end.add(
        part(
            new TorusGeometry(0.04, 0.008, 6, 16),
            copper,
            0,
            0.26,
            0.02,
        ).rotateX(Math.PI / 2),
    );
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.12, 0.64, 0], 0.2, 0.02, steel, brass).pivot,
    );

    return piece;
}

/**
 * The Regulator (king): a grandfather-clock monarch with a clock-face
 * chest, a swinging pendulum, an iron mantle, a cog crown and a key
 * sceptre.
 */
function regulator(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(part(new BoxGeometry(0.3, 0.6, 0.2), brass, 0, 0.35, 0));
    body.add(part(new BoxGeometry(0.34, 0.05, 0.24), copper, 0, 0.07, 0));
    body.add(part(new BoxGeometry(0.34, 0.05, 0.24), copper, 0, 0.65, 0));
    body.add(part(new BoxGeometry(0.42, 0.06, 0.12), iron, 0, 0.66, -0.05));
    body.add(part(new BoxGeometry(0.4, 0.45, 0.02), iron, 0, 0.42, -0.115));

    const face = part(
        new CylinderGeometry(0.1, 0.1, 0.02, 28),
        enamel,
        0,
        0.52,
        0.105,
    );
    face.rotation.x = Math.PI / 2;
    body.add(face);
    body.add(part(new BoxGeometry(0.01, 0.07, 0.01), iron, 0, 0.545, 0.12));
    body.add(part(new BoxGeometry(0.05, 0.01, 0.01), iron, 0.02, 0.52, 0.12));

    // The pendulum swings behind a glass window.
    body.add(part(new BoxGeometry(0.16, 0.22, 0.01), glass, 0, 0.26, 0.105));
    const pendulum = joint(RIG.swinger, 0, 0.38, 0.09);
    pendulum.add(rod([0, 0, 0], [0, -0.15, 0], 0.006, brass));
    pendulum.add(
        part(
            new CylinderGeometry(0.035, 0.035, 0.01, 16),
            brass,
            0,
            -0.16,
            0,
        ).rotateX(Math.PI / 2),
    );
    body.add(pendulum);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.78, 0);
    head.add(part(new SphereGeometry(0.085, 20, 14), steel));
    head.add(part(new BoxGeometry(0.1, 0.02, 0.02), eye, 0, 0.005, 0.077));
    const crown = gear(0.08, 0.05, 10, brass);
    crown.position.y = 0.1;
    head.add(crown);
    head.add(part(new BoxGeometry(0.028, 0.12, 0.028), brass, 0, 0.18));
    head.add(part(new BoxGeometry(0.085, 0.028, 0.028), brass, 0, 0.2));
    piece.add(head);

    const right = limb(RIG.armRight, [-0.2, 0.62, 0], 0.22, 0.03, brass, steel);
    right.end.add(rod([0, -0.1, 0.03], [0, 0.42, 0.03], 0.013, brass));
    right.end.add(
        part(new TorusGeometry(0.045, 0.014, 8, 16), brass, 0, 0.47, 0.03),
    );
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.2, 0.62, 0], 0.22, 0.03, brass, steel).pivot,
    );
    piece.add(windUpKey(0.45, -0.12));

    return piece;
}
