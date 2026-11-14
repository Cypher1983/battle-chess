import {
    BoxGeometry,
    ConeGeometry,
    CylinderGeometry,
    DoubleSide,
    Group,
    IcosahedronGeometry,
    SphereGeometry,
    TorusGeometry,
} from 'three';
import type { Mesh } from 'three';
import type { PieceType } from '@/lib/armies';
import { glow, lathe, material, part, rod } from '@/lib/board3d/pieces/parts';

/**
 * The Wildwood Court (black): living bark, moss and thorns with glowing
 * green eyes, rooted on tree stumps.
 */

const bark = material({ color: 0x5a3d24, roughness: 0.95, flatShading: true });
const darkBark = material({
    color: 0x3b2817,
    roughness: 0.95,
    flatShading: true,
});
const moss = material({ color: 0x3f8f3a, roughness: 0.9, flatShading: true });
const leaf = material({
    color: 0x8fcf6a,
    roughness: 0.7,
    side: DoubleSide,
    flatShading: true,
});
const thorn = material({ color: 0xd6336c, roughness: 0.5 });
const antler = material({ color: 0xd9c9a3, roughness: 0.75 });
const hollow = material({ color: 0x120c06, roughness: 1 });
const eye = glow(0xc6ff6a);
const blossom = glow(0xff8fc0, 0.5);

const builders: Record<PieceType, () => Group> = {
    p: sproutling,
    n: briarWolf,
    b: mossOracle,
    r: oldBark,
    q: thornmother,
    k: elderStag,
};

export function buildWildwood(type: PieceType): Group {
    const piece = builders[type]();
    piece.name = `b${type}`;

    return piece;
}

/** Every Wildwood piece grows out of a mossy tree stump. */
function base(): Group {
    const group = new Group();
    group.add(part(new CylinderGeometry(0.31, 0.36, 0.12, 9), bark, 0, 0.06));
    group.add(part(new CylinderGeometry(0.29, 0.31, 0.04, 9), moss, 0, 0.13));

    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + 0.4;
        group.add(
            rod(
                [Math.sin(angle) * 0.28, 0.08, Math.cos(angle) * 0.28],
                [Math.sin(angle) * 0.4, 0.01, Math.cos(angle) * 0.4],
                0.04,
                bark,
                0.015,
                5,
            ),
        );
    }

    return group;
}

/** A leaf: a flattened, pointed blob. */
function leafAt(
    x: number,
    y: number,
    z: number,
    tilt: number,
    turn: number,
    size = 1,
): Mesh {
    const mesh = part(new SphereGeometry(0.1 * size, 8, 6), leaf, x, y, z);
    mesh.scale.set(1, 0.18, 0.5);
    mesh.rotation.set(0, turn, tilt);

    return mesh;
}

function eyes(y: number, z: number, spread: number, piece: Group): void {
    for (const side of [-1, 1]) {
        piece.add(
            part(new SphereGeometry(0.026, 10, 8), eye, side * spread, y, z),
        );
    }
}

function sproutling(): Group {
    const piece = base();
    const bulb = part(new IcosahedronGeometry(0.16, 1), moss, 0, 0.32);
    bulb.scale.set(1, 1.2, 1);
    piece.add(bulb);
    eyes(0.36, 0.14, 0.055, piece);
    piece.add(rod([0, 0.48, 0], [0.02, 0.62, 0], 0.022, bark, 0.015, 6));
    piece.add(leafAt(-0.08, 0.6, 0, 0.5, 0));
    piece.add(leafAt(0.1, 0.64, 0, -0.5, 0, 1.1));

    return piece;
}

function briarWolf(): Group {
    const piece = base();
    const neck = part(
        new CylinderGeometry(0.12, 0.18, 0.42, 7),
        bark,
        0,
        0.36,
        -0.02,
    );
    neck.rotation.x = 0.25;
    piece.add(neck);

    const collar = part(new TorusGeometry(0.16, 0.05, 6, 12), moss, 0, 0.24, 0);
    collar.rotation.x = Math.PI / 2;
    piece.add(collar);

    piece.add(part(new BoxGeometry(0.22, 0.2, 0.28), darkBark, 0, 0.62, 0.08));
    piece.add(part(new BoxGeometry(0.13, 0.11, 0.2), darkBark, 0, 0.57, 0.3));
    piece.add(part(new BoxGeometry(0.06, 0.05, 0.04), hollow, 0, 0.6, 0.4));
    piece.add(part(new BoxGeometry(0.11, 0.02, 0.12), thorn, 0, 0.52, 0.3));

    for (const side of [-1, 1]) {
        const ear = part(
            new ConeGeometry(0.05, 0.15, 5),
            bark,
            side * 0.07,
            0.78,
            0.02,
        );
        ear.rotation.z = -side * 0.25;
        piece.add(ear);
    }

    piece.add(
        part(new SphereGeometry(0.03, 10, 8), glow(0xffcf5a), -0.08, 0.66, 0.2),
    );
    piece.add(
        part(new SphereGeometry(0.03, 10, 8), glow(0xffcf5a), 0.08, 0.66, 0.2),
    );

    for (const [y, z] of [
        [0.38, -0.17],
        [0.5, -0.14],
        [0.62, -0.08],
        [0.72, -0.02],
    ]) {
        piece.add(
            rod([0, y, z], [0, y + 0.07, z - 0.1], 0.025, thorn, 0.002, 5),
        );
    }

    return piece;
}

function mossOracle(): Group {
    const piece = base();
    piece.add(
        lathe(
            [
                [0.26, 0.15],
                [0.2, 0.3],
                [0.13, 0.55],
                [0.1, 0.62],
                [0, 0.64],
            ],
            bark,
            9,
        ),
    );

    const hood = part(new IcosahedronGeometry(0.13, 1), moss, 0, 0.71);
    hood.scale.set(1, 1.1, 1);
    piece.add(hood);
    piece.add(part(new SphereGeometry(0.08, 12, 10), hollow, 0, 0.69, 0.07));
    eyes(0.7, 0.13, 0.035, piece);
    piece.add(part(new ConeGeometry(0.09, 0.22, 7), moss, 0, 0.9, -0.02));

    piece.add(
        rod([0.2, 0.15, 0.06], [0.2, 0.86, 0.06], 0.02, darkBark, 0.015, 6),
    );
    piece.add(
        part(
            new IcosahedronGeometry(0.05, 0),
            glow(0xc6ff6a, 1.2),
            0.2,
            0.9,
            0.06,
        ),
    );

    return piece;
}

function oldBark(): Group {
    const piece = base();
    piece.add(part(new CylinderGeometry(0.21, 0.27, 0.55, 8), bark, 0, 0.42));
    piece.add(part(new BoxGeometry(0.11, 0.05, 0.03), hollow, 0, 0.33, 0.24));
    eyes(0.48, 0.225, 0.07, piece);

    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.sin(angle);
        const z = Math.cos(angle);
        piece.add(
            rod(
                [x * 0.12, 0.62, z * 0.12],
                [x * 0.24, 0.78, z * 0.24],
                0.04,
                darkBark,
                0.02,
                5,
            ),
        );
        piece.add(
            part(
                new IcosahedronGeometry(0.11, 0),
                moss,
                x * 0.22,
                0.82,
                z * 0.22,
            ),
        );
    }

    piece.add(part(new IcosahedronGeometry(0.15, 0), moss, 0, 0.86));

    return piece;
}

function thornmother(): Group {
    const piece = base();
    piece.add(
        lathe(
            [
                [0.25, 0.15],
                [0.16, 0.35],
                [0.1, 0.6],
                [0.12, 0.68],
                [0, 0.7],
            ],
            darkBark,
            9,
        ),
    );

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        piece.add(
            leafAt(
                Math.sin(angle) * 0.2,
                0.24,
                Math.cos(angle) * 0.2,
                0.6,
                angle + Math.PI / 2,
                1.3,
            ),
        );
    }

    piece.add(part(new IcosahedronGeometry(0.1, 1), bark, 0, 0.79));
    eyes(0.8, 0.085, 0.035, piece);

    for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        const x = Math.sin(angle);
        const z = Math.cos(angle);
        piece.add(
            rod(
                [x * 0.07, 0.86, z * 0.07],
                [x * 0.14, 1.04, z * 0.14],
                0.025,
                thorn,
                0.002,
                5,
            ),
        );
    }

    for (const angle of [0.6, 2.4, 4.4]) {
        piece.add(
            part(
                new IcosahedronGeometry(0.035, 0),
                blossom,
                Math.sin(angle) * 0.11,
                0.88,
                Math.cos(angle) * 0.11,
            ),
        );
    }

    return piece;
}

function elderStag(): Group {
    const piece = base();
    piece.add(
        lathe(
            [
                [0.29, 0.15],
                [0.2, 0.35],
                [0.14, 0.62],
                [0.12, 0.72],
                [0, 0.74],
            ],
            darkBark,
            9,
        ),
    );

    const mantle = part(new TorusGeometry(0.14, 0.05, 6, 12), moss, 0, 0.66);
    mantle.rotation.x = Math.PI / 2;
    piece.add(mantle);

    piece.add(part(new BoxGeometry(0.16, 0.18, 0.22), bark, 0, 0.83, 0.03));
    piece.add(part(new BoxGeometry(0.11, 0.1, 0.14), bark, 0, 0.79, 0.17));
    piece.add(part(new BoxGeometry(0.05, 0.04, 0.03), hollow, 0, 0.8, 0.245));
    eyes(0.86, 0.13, 0.07, piece);

    for (const side of [-1, 1]) {
        const s = side;
        piece.add(
            rod(
                [s * 0.06, 0.9, 0],
                [s * 0.2, 1.08, -0.04],
                0.022,
                antler,
                0.016,
                6,
            ),
        );
        piece.add(
            rod(
                [s * 0.2, 1.08, -0.04],
                [s * 0.26, 1.2, -0.08],
                0.016,
                antler,
                0.01,
                6,
            ),
        );
        piece.add(
            rod(
                [s * 0.13, 0.99, -0.02],
                [s * 0.12, 1.1, 0.04],
                0.014,
                antler,
                0.008,
                6,
            ),
        );
        piece.add(
            rod(
                [s * 0.2, 1.08, -0.04],
                [s * 0.3, 1.1, 0.02],
                0.014,
                antler,
                0.008,
                6,
            ),
        );
    }

    return piece;
}
