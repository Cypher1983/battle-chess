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
    gear,
    glow,
    lathe,
    material,
    part,
    rod,
} from '@/lib/board3d/pieces/parts';

/**
 * The Clockwork Legion (white): brass and steel automatons with glowing
 * blue eyes, wind-up keys and gears.
 */

const brass = material({ color: 0xc9952b, metalness: 0.85, roughness: 0.3 });
const steel = material({ color: 0xb4bcc4, metalness: 0.85, roughness: 0.32 });
const copper = material({ color: 0xb8653a, metalness: 0.8, roughness: 0.35 });
const iron = material({ color: 0x3b3f45, metalness: 0.6, roughness: 0.5 });
const enamel = material({ color: 0xf3ead2, roughness: 0.4 });
const eye = glow(0x7fd4ff);
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

/** Every Clockwork piece stands on a brass cog with a steel plate. */
function base(): Group {
    const group = new Group();
    const cog = gear(0.34, 0.1, 14, brass);
    cog.position.y = 0.05;
    group.add(cog);
    group.add(
        part(new CylinderGeometry(0.29, 0.31, 0.05, 32), steel, 0, 0.125),
    );

    return group;
}

/** A wind-up key sticking out of the back. */
function windUpKey(y: number, depth: number): Group {
    const key = new Group();
    key.add(rod([0, y, -depth], [0, y, -depth - 0.1], 0.015, brass));
    const loop = part(
        new TorusGeometry(0.045, 0.014, 8, 16),
        brass,
        0,
        y,
        -depth - 0.13,
    );
    loop.rotation.y = Math.PI / 2;
    key.add(loop);

    return key;
}

function tickSoldier(): Group {
    const piece = base();
    piece.add(
        lathe(
            [
                [0.2, 0.15],
                [0.21, 0.2],
                [0.14, 0.34],
                [0.11, 0.4],
                [0.15, 0.44],
                [0, 0.45],
            ],
            steel,
        ),
    );
    piece.add(part(new SphereGeometry(0.12, 24, 16), brass, 0, 0.55));
    piece.add(part(new BoxGeometry(0.15, 0.03, 0.03), eye, 0, 0.56, 0.105));
    piece.add(part(new CylinderGeometry(0.08, 0.09, 0.07, 20), iron, 0, 0.68));
    piece.add(
        part(new CylinderGeometry(0.11, 0.11, 0.015, 20), iron, 0, 0.645),
    );
    piece.add(windUpKey(0.32, 0.13));

    return piece;
}

function cogCharger(): Group {
    const piece = base();

    const neck = part(new BoxGeometry(0.22, 0.46, 0.24), steel, 0, 0.36, -0.02);
    neck.rotation.x = 0.28;
    piece.add(neck);

    piece.add(part(new BoxGeometry(0.2, 0.2, 0.36), brass, 0, 0.64, 0.1));
    piece.add(part(new BoxGeometry(0.15, 0.13, 0.16), brass, 0, 0.6, 0.32));
    piece.add(part(new BoxGeometry(0.16, 0.025, 0.02), iron, 0, 0.56, 0.4));

    for (const side of [-1, 1]) {
        piece.add(
            part(new ConeGeometry(0.04, 0.13, 8), steel, side * 0.06, 0.79, 0),
        );
        piece.add(
            part(new SphereGeometry(0.03, 12, 8), eye, side * 0.1, 0.68, 0.18),
        );
    }

    const mane = gear(0.17, 0.04, 9, copper);
    mane.rotation.z = Math.PI / 2;
    mane.position.set(0, 0.55, -0.12);
    piece.add(mane);

    return piece;
}

function gearwright(): Group {
    const piece = base();
    piece.add(
        lathe(
            [
                [0.25, 0.15],
                [0.22, 0.22],
                [0.14, 0.5],
                [0.1, 0.62],
                [0, 0.63],
            ],
            brass,
        ),
    );
    piece.add(
        part(new TorusGeometry(0.17, 0.02, 8, 24), copper, 0, 0.3, 0).rotateX(
            Math.PI / 2,
        ),
    );
    piece.add(part(new SphereGeometry(0.11, 24, 16), steel, 0, 0.72));

    for (const side of [-1, 1]) {
        piece.add(
            part(
                new SphereGeometry(0.028, 12, 8),
                eye,
                side * 0.045,
                0.74,
                0.095,
            ),
        );
    }

    const halo = gear(0.17, 0.03, 12, brass);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, 0.78, -0.1);
    piece.add(halo);

    piece.add(part(new ConeGeometry(0.08, 0.18, 20), brass, 0, 0.9));
    piece.add(part(new SphereGeometry(0.025, 12, 8), eye, 0, 1.0));

    return piece;
}

function bulwarkEngine(): Group {
    const piece = base();
    piece.add(part(new CylinderGeometry(0.24, 0.28, 0.5, 32), steel, 0, 0.4));

    for (const y of [0.22, 0.56]) {
        const band = part(new TorusGeometry(0.265, 0.022, 8, 32), brass, 0, y);
        band.rotation.x = Math.PI / 2;
        piece.add(band);
    }

    piece.add(part(new CylinderGeometry(0.27, 0.25, 0.06, 32), brass, 0, 0.66));

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const merlon = part(
            new BoxGeometry(0.1, 0.1, 0.09),
            steel,
            Math.sin(angle) * 0.22,
            0.74,
            Math.cos(angle) * 0.22,
        );
        merlon.rotation.y = angle;
        piece.add(merlon);
    }

    piece.add(part(new BoxGeometry(0.13, 0.1, 0.03), furnace, 0, 0.32, 0.265));
    piece.add(
        part(
            new CylinderGeometry(0.045, 0.05, 0.22, 12),
            iron,
            0.08,
            0.8,
            -0.08,
        ),
    );

    return piece;
}

function arcDuchess(): Group {
    const piece = base();
    piece.add(
        lathe(
            [
                [0.27, 0.15],
                [0.2, 0.26],
                [0.1, 0.52],
                [0.08, 0.62],
                [0.13, 0.68],
                [0, 0.7],
            ],
            steel,
        ),
    );

    for (const [y, radius] of [
        [0.3, 0.165],
        [0.38, 0.14],
    ]) {
        const coil = part(
            new TorusGeometry(radius, 0.018, 8, 28),
            copper,
            0,
            y,
        );
        coil.rotation.x = Math.PI / 2;
        piece.add(coil);
    }

    piece.add(part(new SphereGeometry(0.1, 24, 16), brass, 0, 0.79));
    piece.add(part(new BoxGeometry(0.12, 0.025, 0.03), eye, 0, 0.8, 0.088));

    const ring = part(new TorusGeometry(0.11, 0.018, 8, 24), brass, 0, 0.9);
    ring.rotation.x = Math.PI / 2;
    piece.add(ring);

    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.sin(angle) * 0.11;
        const z = Math.cos(angle) * 0.11;
        piece.add(rod([x, 0.9, z], [x * 1.3, 1.04, z * 1.3], 0.012, steel));
        piece.add(
            part(new SphereGeometry(0.03, 12, 8), eye, x * 1.3, 1.06, z * 1.3),
        );
    }

    return piece;
}

function regulator(): Group {
    const piece = base();
    piece.add(
        lathe(
            [
                [0.29, 0.15],
                [0.22, 0.26],
                [0.15, 0.56],
                [0.13, 0.7],
                [0.18, 0.75],
                [0, 0.76],
            ],
            brass,
        ),
    );

    const face = part(
        new CylinderGeometry(0.1, 0.1, 0.02, 28),
        enamel,
        0,
        0.42,
        0.18,
    );
    face.rotation.x = Math.PI / 2 - 0.22;
    piece.add(face);
    piece.add(part(new BoxGeometry(0.012, 0.075, 0.01), iron, 0, 0.45, 0.195));
    const minute = part(
        new BoxGeometry(0.06, 0.012, 0.01),
        iron,
        0.025,
        0.42,
        0.19,
    );
    piece.add(minute);

    piece.add(part(new SphereGeometry(0.11, 24, 16), steel, 0, 0.86));
    piece.add(part(new BoxGeometry(0.13, 0.03, 0.03), eye, 0, 0.87, 0.095));

    const crown = gear(0.12, 0.06, 10, brass);
    crown.position.y = 0.97;
    piece.add(crown);

    piece.add(part(new BoxGeometry(0.035, 0.16, 0.035), brass, 0, 1.08));
    piece.add(part(new BoxGeometry(0.11, 0.035, 0.035), brass, 0, 1.1));
    piece.add(windUpKey(0.5, 0.17));

    return piece;
}
