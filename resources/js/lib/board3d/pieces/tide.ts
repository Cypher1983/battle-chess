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
 * The Sunken Fleet: drowned sailors risen from the deep. Waterlogged wood,
 * tarnished brass, coral and barnacles, trailing kelp and a teal sea-glow.
 */

const wood = material({ color: 0x6b5238, roughness: 0.95, flatShading: true });
const rotten = material({ color: 0x3d3026, roughness: 1, flatShading: true });
const brass = material({ color: 0xb8893a, metalness: 0.75, roughness: 0.45 });
const coral = material({ color: 0xe0675a, roughness: 0.8, flatShading: true });
const barnacle = material({
    color: 0xcfc6ae,
    roughness: 1,
    flatShading: true,
});
const kelp = material({ color: 0x3f6b3a, roughness: 0.9, flatShading: true });
const skin = material({ color: 0x86a89c, roughness: 0.8, flatShading: true });
const coat = material({ color: 0x223c4c, roughness: 0.85, flatShading: true });
const shirt = material({ color: 0xd8d0bc, roughness: 0.9 });
const shell = material({ color: 0xc8452e, roughness: 0.55, flatShading: true });
const tentacle = material({
    color: 0x6a3f74,
    roughness: 0.6,
    flatShading: true,
});
const conch = material({ color: 0xf0d2b4, roughness: 0.5, flatShading: true });
const rock = material({ color: 0x405250, roughness: 1, flatShading: true });
const sea = glow(0x3fe0c8, 0.7);
const eye = glow(0x7affe0, 0.6);

const builders: Record<PieceType, () => Group> = {
    p: barnacleDeckhand,
    n: coralCrab,
    b: tidePriest,
    r: shipwreckHulk,
    q: seaWitch,
    k: drownedAdmiral,
};

export function buildTide(type: PieceType): Group {
    return builders[type]();
}

/** Every Tide character stands on a wet sea-stone crusted with barnacles. */
function base(): Group {
    const group = new Group();
    group.add(part(new CylinderGeometry(0.28, 0.3, 0.05, 10), rock, 0, 0.025));
    group.add(
        part(new TorusGeometry(0.27, 0.01, 4, 24), sea, 0, 0.05).rotateX(
            Math.PI / 2,
        ),
    );

    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + 0.5;
        group.add(
            part(
                new ConeGeometry(0.025, 0.03, 6),
                barnacle,
                Math.sin(angle) * 0.22,
                0.065,
                Math.cos(angle) * 0.22,
            ),
        );
    }

    return group;
}

function eyes(
    group: Group,
    y: number,
    z: number,
    spread: number,
    size = 0.02,
): void {
    for (const side of [-1, 1]) {
        group.add(
            part(new SphereGeometry(size, 10, 8), eye, side * spread, y, z),
        );
    }
}

/** Small barnacle cones stuck onto a surface. */
function barnacles(
    group: Group,
    spots: [number, number, number][],
    size = 0.018,
): void {
    for (const [x, y, z] of spots) {
        group.add(
            part(new ConeGeometry(size, size * 1.2, 6), barnacle, x, y, z),
        );
    }
}

/** A cutlass: brass guard and a curved-looking blade, held pointing up. */
function cutlass(length: number): Group {
    const group = new Group();
    group.add(part(new BoxGeometry(0.06, 0.012, 0.025), brass, 0, 0.02, 0));
    group.add(
        part(new CylinderGeometry(0.01, 0.01, 0.05, 6), rotten, 0, -0.01),
    );
    const blade = part(
        new BoxGeometry(0.03, length, 0.006),
        barnacle,
        0.008,
        0.03 + length / 2,
    );
    blade.rotation.z = -0.08;
    group.add(blade);
    group.add(
        part(
            new ConeGeometry(0.018, 0.05, 4),
            barnacle,
            0.02,
            0.05 + length,
        ).rotateZ(-0.3),
    );

    return group;
}

/** A crab claw: a fat pincer that opens towards +z. */
function claw(size: number, mat = shell): Group {
    const group = new Group();
    const palm = part(new SphereGeometry(0.04 * size, 8, 6), mat);
    palm.scale.set(1, 0.8, 1.3);
    group.add(palm);
    group.add(
        part(
            new ConeGeometry(0.025 * size, 0.08 * size, 5),
            mat,
            0,
            0.015 * size,
            0.06 * size,
        ).rotateX(Math.PI / 2 - 0.3),
    );
    group.add(
        part(
            new ConeGeometry(0.02 * size, 0.07 * size, 5),
            mat,
            0,
            -0.02 * size,
            0.055 * size,
        ).rotateX(Math.PI / 2 + 0.3),
    );

    return group;
}

/** Barnacle Deckhand (pawn): a drowned sailor with a crab claw and cutlass. */
function barnacleDeckhand(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.045, 0.19, 0],
            0.12,
            0.025,
            coat,
            rotten,
        );
        end.add(
            part(new BoxGeometry(0.045, 0.025, 0.07), rotten, 0, -0.01, 0.015),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.19, 0);
    body.add(capsule(0.07, 0.08, shirt, 0, 0.09));

    // Sailor's stripes.
    for (const y of [0.06, 0.11]) {
        body.add(
            part(new TorusGeometry(0.071, 0.008, 4, 14), coat, 0, y).rotateX(
                Math.PI / 2,
            ),
        );
    }

    barnacles(body, [
        [0.04, 0.12, 0.05],
        [-0.03, 0.04, 0.06],
    ]);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.42, 0);
    head.add(part(new IcosahedronGeometry(0.068, 1), skin));
    eyes(head, 0.01, 0.055, 0.025, 0.015);
    // A knotted bandana.
    head.add(
        part(
            new SphereGeometry(0.072, 10, 6, 0, Math.PI * 2, 0, 1.2),
            coral,
            0,
            0.005,
        ),
    );
    head.add(
        part(new ConeGeometry(0.02, 0.05, 4), coral, 0.02, 0.0, -0.075).rotateX(
            -1.2,
        ),
    );
    barnacles(head, [[-0.05, 0.0, 0.03]], 0.014);
    piece.add(head);

    const right = limb(RIG.armRight, [-0.09, 0.35, 0], 0.11, 0.02, shirt, skin);
    right.end.add(cutlass(0.2).translateZ(0.03));
    piece.add(right.pivot);

    const left = limb(RIG.armLeft, [0.09, 0.35, 0], 0.11, 0.02, shirt, shell);
    left.end.add(claw(1).translateY(-0.03));
    piece.add(left.pivot);

    return piece;
}

/** Coral Crab (knight): a huge crab with a reef growing on its shell. */
function coralCrab(): Group {
    const piece = base();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.13, 0.06],
        [RIG.legFrontRight, -0.13, 0.06],
        [RIG.legBackLeft, 0.13, -0.08],
        [RIG.legBackRight, -0.13, -0.08],
    ] as const) {
        const { pivot } = limb(name, [x, 0.18, z], 0.15, 0.018, shell);
        pivot.rotation.z = x > 0 ? 0.55 : -0.55;
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.2, 0);
    const carapace = part(new SphereGeometry(0.18, 12, 8), shell, 0, 0.04);
    carapace.scale.set(1.15, 0.5, 0.9);
    body.add(carapace);

    // Extra static legs in the middle.
    for (const side of [-1, 1]) {
        const leg = rod(
            [side * 0.13, 0, -0.01],
            [side * 0.22, -0.16, -0.01],
            0.017,
            shell,
            0.008,
            6,
        );
        body.add(leg);
    }

    // A little coral reef on its back.
    for (const [x, z, h, tilt] of [
        [0, 0, 0.14, 0],
        [0.05, -0.04, 0.1, -0.4],
        [-0.05, 0.02, 0.1, 0.4],
    ]) {
        const branch = rod(
            [x, 0.08, z],
            [x - tilt * 0.1, 0.08 + h, z],
            0.014,
            coral,
            0.008,
            5,
        );
        body.add(branch);
        body.add(
            part(
                new SphereGeometry(0.016, 6, 5),
                coral,
                x - tilt * 0.1,
                0.08 + h,
                z,
            ),
        );
    }

    body.add(part(new SphereGeometry(0.02, 8, 6), sea, 0.03, 0.1, 0.05));
    barnacles(body, [
        [0.09, 0.06, -0.05],
        [-0.1, 0.06, -0.03],
        [-0.04, 0.08, -0.08],
    ]);

    // Two big claws reaching forward.
    for (const side of [-1, 1]) {
        body.add(
            rod(
                [side * 0.12, 0, 0.08],
                [side * 0.15, 0.04, 0.2],
                0.022,
                shell,
                0.018,
                6,
            ),
        );
        const pincer = claw(side > 0 ? 1.5 : 1.9);
        pincer.position.set(side * 0.15, 0.05, 0.24);
        body.add(pincer);
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.25, 0.12);

    for (const side of [-1, 1]) {
        head.add(
            rod([side * 0.03, 0, 0], [side * 0.04, 0.09, 0.02], 0.008, shell),
        );
        head.add(
            part(new SphereGeometry(0.02, 8, 6), eye, side * 0.04, 0.1, 0.02),
        );
    }

    piece.add(head);

    return piece;
}

/** Tide Priest (bishop): a hooded priest of the deep with a conch-shell staff. */
function tidePriest(): Group {
    const piece = base();

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
            kelp,
            8,
        ),
    );

    // Ragged hem of hanging kelp strands.
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        body.add(
            part(
                new BoxGeometry(0.035, 0.12, 0.01),
                coat,
                Math.sin(angle) * 0.18,
                0.11,
                Math.cos(angle) * 0.18,
            ).rotateY(angle),
        );
    }

    body.add(
        part(new TorusGeometry(0.13, 0.014, 6, 14), brass, 0, 0.32).rotateX(
            Math.PI / 2,
        ),
    );
    // A pendant of a glowing pearl.
    body.add(part(new SphereGeometry(0.025, 10, 8), sea, 0, 0.44, 0.115));
    barnacles(body, [
        [0.1, 0.22, 0.1],
        [-0.12, 0.18, 0.08],
    ]);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.66, 0.01);
    head.add(part(new ConeGeometry(0.105, 0.26, 8), kelp, 0, 0.06, -0.02));
    head.add(part(new SphereGeometry(0.066, 12, 10), rotten, 0, -0.01, 0.035));
    eyes(head, 0, 0.09, 0.024, 0.016);
    // Dangling tendrils from the chin.
    for (const x of [-0.025, 0, 0.025]) {
        head.add(
            rod(
                [x, -0.05, 0.07],
                [x * 1.4, -0.13, 0.08],
                0.008,
                skin,
                0.003,
                5,
            ),
        );
    }

    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.13, 0.5, 0.02],
        0.15,
        0.022,
        kelp,
        skin,
    );
    right.end.add(rod([0, -0.3, 0.03], [0, 0.3, 0.03], 0.012, wood));
    // The conch head: a spiral cone ringed with ridges.
    const shellTop = new Group();
    shellTop.position.set(0, 0.36, 0.03);
    shellTop.rotation.z = 0.5;
    shellTop.add(part(new ConeGeometry(0.05, 0.14, 8), conch));
    shellTop.add(
        part(new TorusGeometry(0.04, 0.012, 6, 12), conch, 0, -0.04).rotateX(
            Math.PI / 2,
        ),
    );
    shellTop.add(part(new SphereGeometry(0.03, 8, 6), sea, 0, -0.07));
    right.end.add(shellTop);
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.13, 0.5, 0.02], 0.15, 0.022, kelp, skin).pivot,
    );

    return piece;
}

/** Shipwreck Hulk (rook): a giant built from a barnacled barrel and ship's planks. */
function shipwreckHulk(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.1, 0.19, 0],
            0.12,
            0.05,
            wood,
            rotten,
        );
        end.add(
            part(new BoxGeometry(0.12, 0.05, 0.14), rotten, 0, -0.02, 0.02),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.2, 0);
    body.add(
        lathe(
            [
                [0.15, 0],
                [0.2, 0.1],
                [0.215, 0.22],
                [0.2, 0.34],
                [0.15, 0.42],
                [0, 0.42],
            ],
            wood,
            12,
        ),
    );

    for (const y of [0.06, 0.22, 0.37]) {
        const radius = y === 0.22 ? 0.215 : 0.185;
        body.add(
            part(new TorusGeometry(radius, 0.012, 4, 20), brass, 0, y).rotateX(
                Math.PI / 2,
            ),
        );
    }

    // A glowing porthole heart and a stove-in plank.
    body.add(
        part(new TorusGeometry(0.045, 0.012, 6, 14), brass, 0, 0.26, 0.205),
    );
    body.add(
        part(
            new CylinderGeometry(0.04, 0.04, 0.01, 12),
            sea,
            0,
            0.26,
            0.205,
        ).rotateX(Math.PI / 2),
    );
    body.add(
        part(
            new BoxGeometry(0.08, 0.02, 0.02),
            rotten,
            0.08,
            0.14,
            0.195,
        ).rotateZ(0.5),
    );
    barnacles(
        body,
        [
            [-0.13, 0.12, 0.15],
            [0.15, 0.3, 0.1],
            [-0.1, 0.33, 0.13],
        ],
        0.022,
    );

    // Broken mast stubs on the shoulders, like battlements.
    for (const side of [-1, 1]) {
        body.add(
            rod(
                [side * 0.12, 0.4, -0.05],
                [side * 0.16, 0.56, -0.08],
                0.025,
                rotten,
                0.02,
                6,
            ),
        );
        body.add(
            part(
                new BoxGeometry(0.11, 0.02, 0.02),
                wood,
                side * 0.16,
                0.5,
                -0.07,
            ).rotateZ(side * 0.2),
        );
    }

    body.add(part(new SphereGeometry(0.03, 8, 6), coral, -0.09, 0.42, 0.07));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.66, 0.02);
    head.add(part(new CylinderGeometry(0.07, 0.075, 0.1, 10), wood));
    head.add(
        part(new TorusGeometry(0.072, 0.008, 4, 14), brass, 0, 0.03).rotateX(
            Math.PI / 2,
        ),
    );
    head.add(part(new BoxGeometry(0.08, 0.018, 0.02), eye, 0, 0, 0.068));
    // Kelp hanging off the brow.
    head.add(
        part(
            new BoxGeometry(0.025, 0.1, 0.01),
            kelp,
            0.04,
            -0.03,
            0.074,
        ).rotateZ(0.1),
    );
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.25, 0.54, 0],
            0.2,
            0.045,
            wood,
            rotten,
        );

        if (side < 0) {
            // A ship's anchor dragged in one fist.
            end.add(rod([0, 0, 0.04], [0, -0.18, 0.04], 0.014, brass));
            end.add(
                part(
                    new BoxGeometry(0.08, 0.015, 0.015),
                    brass,
                    0,
                    -0.02,
                    0.04,
                ),
            );
            end.add(
                part(
                    new TorusGeometry(0.06, 0.013, 6, 12, Math.PI),
                    brass,
                    0,
                    -0.17,
                    0.04,
                ).rotateZ(Math.PI),
            );
        } else {
            end.add(part(new IcosahedronGeometry(0.06, 0), rotten));
        }

        piece.add(pivot);
    }

    return piece;
}

/**
 * The Sea Witch (queen): a sorceress whose skirt is a mass of octopus
 * tentacles, with kelp hair and a crown of coral.
 */
function seaWitch(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    // The mantle where the tentacles meet.
    const mantle = part(new SphereGeometry(0.13, 12, 8), tentacle, 0, 0.24);
    mantle.scale.set(1, 1.1, 1);
    body.add(mantle);

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + 0.2;
        const sx = Math.sin(angle);
        const sz = Math.cos(angle);
        body.add(
            rod(
                [sx * 0.08, 0.22, sz * 0.08],
                [sx * 0.18, 0.06, sz * 0.18],
                0.035,
                tentacle,
                0.025,
                6,
            ),
        );
        body.add(
            rod(
                [sx * 0.18, 0.06, sz * 0.18],
                [sx * 0.26, 0.07, sz * 0.26],
                0.025,
                tentacle,
                0.008,
                6,
            ),
        );
    }

    // Slender torso and a bodice of shells.
    body.add(
        lathe(
            [
                [0.11, 0.3],
                [0.07, 0.44],
                [0.065, 0.56],
                [0.09, 0.64],
                [0.06, 0.68],
                [0, 0.69],
            ],
            skin,
            10,
        ),
    );
    body.add(
        lathe(
            [
                [0.115, 0.3],
                [0.075, 0.44],
                [0.072, 0.5],
                [0, 0.5],
            ],
            coat,
            10,
        ),
    );
    body.add(part(new SphereGeometry(0.03, 10, 8), sea, 0, 0.6, 0.075));
    body.add(
        part(new TorusGeometry(0.07, 0.01, 6, 12), conch, 0, 0.62).rotateX(
            Math.PI / 2 - 0.3,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.78, 0);
    head.add(part(new SphereGeometry(0.066, 14, 10), skin));
    eyes(head, 0.01, 0.056, 0.024, 0.014);

    // Kelp hair flowing down her back and shoulders.
    for (let i = 0; i < 5; i++) {
        const angle = ((i - 2) / 2) * 1.3;
        head.add(
            rod(
                [Math.sin(angle) * 0.05, 0.04, -0.03 + Math.cos(angle) * -0.02],
                [Math.sin(angle) * 0.1, -0.22, -0.06 - Math.cos(angle) * 0.02],
                0.016,
                kelp,
                0.01,
                5,
            ),
        );
    }

    // A crown of branching coral.
    for (const [x, h, tilt] of [
        [-0.04, 0.08, 0.4],
        [0, 0.11, 0],
        [0.04, 0.08, -0.4],
    ]) {
        head.add(
            rod(
                [x, 0.05, 0],
                [x - tilt * 0.06, 0.05 + h, -0.01],
                0.012,
                coral,
                0.006,
                5,
            ),
        );
        head.add(
            part(
                new SphereGeometry(0.014, 6, 5),
                coral,
                x - tilt * 0.06,
                0.05 + h,
                -0.01,
            ),
        );
    }

    piece.add(head);

    const right = limb(RIG.armRight, [-0.1, 0.63, 0], 0.18, 0.018, skin);
    right.end.add(part(new SphereGeometry(0.035, 12, 10), sea, 0, -0.03, 0.03));
    piece.add(right.pivot);
    piece.add(limb(RIG.armLeft, [0.1, 0.63, 0], 0.18, 0.018, skin).pivot);

    return piece;
}

/**
 * The Drowned Admiral (king): a towering dead captain in a long coat and
 * tricorn hat, his beard a tangle of kelp, cutlass in hand.
 */
function drownedAdmiral(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.23, 0.05],
                [0.2, 0.15],
                [0.15, 0.45],
                [0.16, 0.62],
                [0.1, 0.68],
                [0, 0.69],
            ],
            coat,
            10,
        ),
    );
    // Open coat front showing a waistcoat and brass buttons.
    body.add(
        part(new BoxGeometry(0.1, 0.5, 0.03), shirt, 0, 0.42, 0.155).rotateX(
            -0.06,
        ),
    );
    body.add(part(new BoxGeometry(0.16, 0.035, 0.02), rotten, 0, 0.38, 0.165));
    body.add(part(new BoxGeometry(0.04, 0.03, 0.02), brass, 0, 0.38, 0.175));

    for (const y of [0.3, 0.46, 0.54]) {
        for (const side of [-1, 1]) {
            body.add(
                part(
                    new SphereGeometry(0.012, 6, 5),
                    brass,
                    side * 0.07,
                    y,
                    0.165,
                ),
            );
        }
    }

    // Gold epaulettes.
    for (const side of [-1, 1]) {
        body.add(
            part(
                new CylinderGeometry(0.06, 0.07, 0.025, 10),
                brass,
                side * 0.17,
                0.66,
                0,
            ),
        );
    }

    barnacles(
        body,
        [
            [0.15, 0.2, 0.1],
            [-0.17, 0.28, 0.06],
            [0.12, 0.1, -0.15],
        ],
        0.022,
    );
    body.add(part(new SphereGeometry(0.035, 8, 6), coral, -0.16, 0.12, 0.12));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.8, 0.01);
    head.add(part(new IcosahedronGeometry(0.08, 1), skin));
    eyes(head, 0.015, 0.067, 0.028, 0.016);

    // Kelp beard hanging in strands.
    for (const [x, len] of [
        [-0.04, 0.12],
        [-0.015, 0.17],
        [0.015, 0.16],
        [0.04, 0.11],
    ]) {
        head.add(
            rod(
                [x, -0.02, 0.06],
                [x * 1.2, -0.02 - len, 0.09],
                0.016,
                kelp,
                0.006,
                5,
            ),
        );
    }

    // The tricorn hat: a three-cornered brim and a rounded crown.
    const brim = part(
        new CylinderGeometry(0.15, 0.15, 0.025, 3),
        coat,
        0,
        0.065,
    );
    brim.rotation.y = Math.PI;
    head.add(brim);
    head.add(part(new CylinderGeometry(0.07, 0.085, 0.08, 10), coat, 0, 0.11));
    head.add(
        part(new TorusGeometry(0.086, 0.008, 4, 14), brass, 0, 0.08).rotateX(
            Math.PI / 2,
        ),
    );
    head.add(part(new SphereGeometry(0.02, 8, 6), sea, 0, 0.12, 0.08));
    piece.add(head);

    const right = limb(RIG.armRight, [-0.21, 0.62, 0], 0.22, 0.032, coat, skin);
    right.end.add(cutlass(0.36).translateZ(0.04));
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.21, 0.62, 0], 0.22, 0.032, coat, skin).pivot,
    );

    return piece;
}
