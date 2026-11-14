import {
    BoxGeometry,
    ConeGeometry,
    CylinderGeometry,
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
 * The Frost Covenant: beings of glacier ice and drifting snow. Pale blue
 * crystal, white fur, deep-blue robes and a cold cyan glow.
 */

const ice = material({
    color: 0x9cd3f2,
    roughness: 0.15,
    metalness: 0.15,
    flatShading: true,
});
const deepIce = material({
    color: 0x4f94c4,
    roughness: 0.2,
    metalness: 0.2,
    flatShading: true,
});
const fur = material({ color: 0xf1f5f8, roughness: 1, flatShading: true });
const snow = material({ color: 0xdde9f2, roughness: 0.9, flatShading: true });
const robe = material({ color: 0x24406e, roughness: 0.85, flatShading: true });
const gown = material({ color: 0x7bb6e0, roughness: 0.5, flatShading: true });
const silver = material({ color: 0xd2dce6, metalness: 0.85, roughness: 0.3 });
const skin = material({ color: 0xc4dcec, roughness: 0.6 });
const hide = material({ color: 0x8aa4ba, roughness: 0.9, flatShading: true });
const rime = glow(0x7fe8ff, 0.7);
const eye = glow(0x9ff4ff, 0.6);

const builders: Record<PieceType, () => Group> = {
    p: frostling,
    n: snowBear,
    b: crystalMage,
    r: iceGolem,
    q: rimeMatriarch,
    k: glacierKing,
};

export function buildFrost(type: PieceType): Group {
    return builders[type]();
}

/** Every Frost character stands on a drift of packed snow with ice shards. */
function base(): Group {
    const group = new Group();
    group.add(part(new CylinderGeometry(0.28, 0.3, 0.05, 9), snow, 0, 0.025));

    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + 0.9;
        const shard = crystal(0.025, 0.08, ice);
        shard.position.set(
            Math.sin(angle) * 0.24,
            0.06,
            Math.cos(angle) * 0.24,
        );
        shard.rotation.z = 0.3;
        group.add(shard);
    }

    return group;
}

/** A long pointed crystal: a stretched octahedron. */
function crystal(radius: number, height: number, mat = ice) {
    const mesh = part(new OctahedronGeometry(radius, 0), mat);
    mesh.scale.y = height / (radius * 2);

    return mesh;
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

/** A ring of crystal spikes pointing up, for crowns and collars. */
function spikes(
    group: Group,
    count: number,
    radius: number,
    y: number,
    height: number,
    mat = ice,
): void {
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const tall = i % 2 === 0 ? height : height * 0.65;
        const spike = crystal(0.018, tall, mat);
        spike.position.set(
            Math.sin(angle) * radius,
            y + tall / 2,
            Math.cos(angle) * radius,
        );
        group.add(spike);
    }
}

/** Frostling (pawn): a small ice imp with a jagged crown of frost and an icicle spear. */
function frostling(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot } = limb(
            name,
            [side * 0.05, 0.19, 0],
            0.12,
            0.024,
            deepIce,
            ice,
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.19, 0);
    const belly = part(new IcosahedronGeometry(0.085, 0), ice, 0, 0.08);
    belly.scale.set(1, 1.2, 0.9);
    body.add(belly);
    body.add(part(new OctahedronGeometry(0.025, 0), rime, 0, 0.1, 0.075));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.4, 0);
    head.add(part(new IcosahedronGeometry(0.075, 0), ice));
    eyes(head, 0.01, 0.06, 0.03);
    head.add(
        part(new ConeGeometry(0.018, 0.05, 4), ice, 0, -0.005, 0.08).rotateX(
            Math.PI / 2,
        ),
    );

    // Swept-back frost spikes for hair.
    for (const [x, tilt] of [
        [-0.04, 0.5],
        [0, 0],
        [0.04, -0.5],
    ]) {
        const spike = crystal(0.02, 0.1, deepIce);
        spike.position.set(x, 0.07, -0.02);
        spike.rotation.set(-0.5, 0, tilt);
        head.add(spike);
    }

    // Pointed ears.
    for (const side of [-1, 1]) {
        head.add(
            part(
                new ConeGeometry(0.016, 0.06, 4),
                ice,
                side * 0.08,
                0.02,
                0,
            ).rotateZ(-side * 1.2),
        );
    }

    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.09, 0.34, 0],
        0.11,
        0.02,
        deepIce,
        ice,
    );
    right.end.add(rod([0, -0.14, 0.03], [0, 0.28, 0.03], 0.01, deepIce));
    right.end.add(crystal(0.022, 0.12, rime).translateY(0.33).translateZ(0.03));
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.09, 0.34, 0], 0.11, 0.02, deepIce, ice).pivot,
    );

    return piece;
}

/** Snow Bear (knight): a great white bear with ice crystals along its back. */
function snowBear(): Group {
    const piece = base();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.09, 0.11],
        [RIG.legFrontRight, -0.09, 0.11],
        [RIG.legBackLeft, 0.09, -0.11],
        [RIG.legBackRight, -0.09, -0.11],
    ] as const) {
        const { pivot, end } = limb(name, [x, 0.22, z], 0.15, 0.045, fur, fur);
        end.add(part(new BoxGeometry(0.08, 0.03, 0.09), fur, 0, -0.02, 0.015));
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.27, 0);
    const torso = capsule(0.12, 0.22, fur, 0, 0, 0).rotateX(Math.PI / 2);
    torso.scale.set(1, 1, 0.95);
    body.add(torso);
    // Hump over the shoulders.
    body.add(part(new IcosahedronGeometry(0.1, 1), fur, 0, 0.06, 0.08));

    // A ridge of ice crystals growing out of the back.
    for (let i = 0; i < 5; i++) {
        const z = 0.13 - i * 0.065;
        const tall = 0.13 - Math.abs(i - 1) * 0.02;
        const shard = crystal(0.028, tall, i % 2 === 0 ? ice : deepIce);
        shard.position.set(0, 0.11 + tall / 2, z);
        shard.rotation.x = -0.25;
        body.add(shard);
    }

    const tail = joint(RIG.tail, 0, 0.02, -0.22);
    tail.add(part(new IcosahedronGeometry(0.035, 0), fur));
    body.add(tail);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.34, 0.2);
    head.add(part(new IcosahedronGeometry(0.085, 1), fur, 0, 0, 0.02));
    head.add(part(new BoxGeometry(0.07, 0.06, 0.08), fur, 0, -0.02, 0.1));
    head.add(part(new SphereGeometry(0.018, 8, 6), hide, 0, -0.005, 0.145));
    eyes(head, 0.025, 0.08, 0.035, 0.014);

    for (const side of [-1, 1]) {
        head.add(
            part(
                new SphereGeometry(0.025, 8, 6),
                fur,
                side * 0.06,
                0.07,
                -0.01,
            ),
        );
    }

    head.add(crystal(0.02, 0.08, rime).translateY(0.1).translateZ(0.02));
    piece.add(head);

    return piece;
}

/** Crystal Mage (bishop): a robed mage with a fur collar and a crystal staff. */
function crystalMage(): Group {
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
            robe,
            8,
        ),
    );
    body.add(
        part(new TorusGeometry(0.15, 0.012, 6, 16), silver, 0, 0.1).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.1, 0.04, 6, 12), fur, 0, 0.55).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new OctahedronGeometry(0.03, 0), rime, 0, 0.42, 0.13));
    body.add(
        part(new BoxGeometry(0.03, 0.3, 0.015), silver, 0, 0.24, 0.16).rotateX(
            -0.17,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.66, 0.01);
    head.add(part(new ConeGeometry(0.1, 0.28, 8), robe, 0, 0.07, -0.02));
    head.add(part(new SphereGeometry(0.062, 12, 10), skin, 0, -0.01, 0.04));
    eyes(head, 0, 0.095, 0.024, 0.015);
    // A frosted beard.
    head.add(
        part(new ConeGeometry(0.045, 0.12, 6), fur, 0, -0.08, 0.06).rotateX(
            Math.PI,
        ),
    );
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.13, 0.5, 0.02],
        0.15,
        0.022,
        robe,
        skin,
    );
    right.end.add(rod([0, -0.3, 0.03], [0, 0.3, 0.03], 0.012, silver));

    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const prong = rod(
            [0, 0.3, 0.03],
            [Math.sin(angle) * 0.04, 0.36, 0.03 + Math.cos(angle) * 0.04],
            0.007,
            silver,
        );
        right.end.add(prong);
    }

    right.end.add(crystal(0.04, 0.16, rime).translateY(0.39).translateZ(0.03));
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.13, 0.5, 0.02], 0.15, 0.022, robe, skin).pivot,
    );

    return piece;
}

/** Ice Golem (rook): a hulking giant stacked from blocks of glacier ice. */
function iceGolem(): Group {
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
            deepIce,
            ice,
        );
        end.add(
            part(new BoxGeometry(0.12, 0.05, 0.14), deepIce, 0, -0.02, 0.02),
        );
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.2, 0);
    const hips = part(new BoxGeometry(0.26, 0.1, 0.18), deepIce, 0, 0.04);
    body.add(hips);
    const chest = part(new BoxGeometry(0.34, 0.24, 0.24), ice, 0, 0.24);
    chest.rotation.y = 0.08;
    body.add(chest);
    body.add(part(new OctahedronGeometry(0.06, 0), rime, 0, 0.24, 0.13));

    // Frozen shards jutting up from the shoulders like battlements.
    for (const side of [-1, 1]) {
        body.add(
            part(
                new BoxGeometry(0.12, 0.1, 0.14),
                deepIce,
                side * 0.2,
                0.37,
                0,
            ),
        );

        for (const [dx, tall] of [
            [-0.03, 0.13],
            [0.03, 0.09],
        ]) {
            const shard = crystal(0.025, tall, ice);
            shard.position.set(side * (0.2 + dx), 0.42 + tall / 2, -0.02);
            shard.rotation.z = -side * 0.25;
            body.add(shard);
        }
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.6, 0.02);
    head.add(part(new BoxGeometry(0.13, 0.1, 0.11), ice));
    head.add(part(new BoxGeometry(0.15, 0.025, 0.12), deepIce, 0, 0.03, 0.01));
    head.add(
        part(new BoxGeometry(0.03, 0.015, 0.02), eye, -0.03, -0.005, 0.056),
    );
    head.add(
        part(new BoxGeometry(0.03, 0.015, 0.02), eye, 0.03, -0.005, 0.056),
    );
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.25, 0.52, 0],
            0.2,
            0.05,
            ice,
            deepIce,
        );
        end.add(part(new BoxGeometry(0.13, 0.12, 0.13), deepIce, 0, -0.02));
        piece.add(pivot);
    }

    return piece;
}

/**
 * The Rime Matriarch (queen): a tall ice sorceress in a flowing gown, with a
 * crystal crown and a fan of ice rising behind her shoulders.
 */
function rimeMatriarch(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.22, 0.05],
                [0.2, 0.1],
                [0.11, 0.4],
                [0.065, 0.56],
                [0.09, 0.66],
                [0, 0.68],
            ],
            gown,
            12,
        ),
    );
    body.add(
        part(new TorusGeometry(0.205, 0.018, 6, 20), fur, 0, 0.08).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new TorusGeometry(0.075, 0.012, 6, 14), silver, 0, 0.53).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(part(new OctahedronGeometry(0.028, 0), rime, 0, 0.62, 0.08));

    // A high collar of ice shards fanning out behind her head.
    for (let i = 0; i < 7; i++) {
        const angle = ((i - 3) / 3) * 1.1;
        const tall = 0.24 - Math.abs(i - 3) * 0.035;
        const shard = crystal(0.03, tall, i % 2 === 0 ? ice : deepIce);
        shard.position.set(
            Math.sin(angle) * 0.1,
            0.66 + (tall / 2) * Math.cos(angle * 0.6),
            -0.07,
        );
        shard.rotation.set(-0.3, 0, -angle * 0.6);
        body.add(shard);
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.77, 0.01);
    head.add(part(new SphereGeometry(0.065, 14, 10), skin));
    eyes(head, 0.01, 0.055, 0.023, 0.013);
    // Long white hair falling down the back.
    head.add(part(new BoxGeometry(0.11, 0.18, 0.04), fur, 0, -0.06, -0.045));
    head.add(
        part(new CylinderGeometry(0.06, 0.06, 0.02, 10), silver, 0, 0.055),
    );
    spikes(head, 5, 0.05, 0.06, 0.09, rime);
    piece.add(head);

    const right = limb(RIG.armRight, [-0.1, 0.62, 0], 0.18, 0.018, gown, skin);
    right.end.add(
        part(new IcosahedronGeometry(0.035, 0), rime, 0, -0.03, 0.03),
    );
    piece.add(right.pivot);
    piece.add(limb(RIG.armLeft, [0.1, 0.62, 0], 0.18, 0.018, gown, skin).pivot);

    return piece;
}

/**
 * The Glacier King (king): a huge shaggy yeti monarch with an icicle crown,
 * a fur mantle and an ice sceptre.
 */
function glacierKing(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.09, 0.2, 0],
            0.13,
            0.06,
            fur,
            hide,
        );
        end.add(part(new BoxGeometry(0.11, 0.04, 0.15), hide, 0, -0.02, 0.03));
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.2, 0);
    const torso = part(new IcosahedronGeometry(0.22, 1), fur, 0, 0.26);
    torso.scale.set(1, 1.25, 0.85);
    body.add(torso);
    const chest = part(new SphereGeometry(0.12, 10, 8), hide, 0, 0.24, 0.12);
    chest.scale.set(1, 1.3, 0.5);
    body.add(chest);
    // Fur mantle with a deep-blue cape.
    body.add(
        part(new TorusGeometry(0.15, 0.06, 6, 14), fur, 0, 0.5, -0.01).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new BoxGeometry(0.36, 0.5, 0.025), robe, 0, 0.25, -0.18).rotateX(
            0.12,
        ),
    );
    body.add(
        part(new TorusGeometry(0.035, 0.01, 6, 10), silver, 0, 0.46, 0.15),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.8, 0.03);
    head.add(part(new IcosahedronGeometry(0.1, 1), fur));
    head.add(part(new BoxGeometry(0.11, 0.08, 0.04), hide, 0, -0.01, 0.08));
    head.add(part(new BoxGeometry(0.07, 0.012, 0.02), eye, 0, 0.012, 0.1));
    // Little tusks.
    for (const side of [-1, 1]) {
        head.add(
            part(
                new ConeGeometry(0.01, 0.04, 5),
                ice,
                side * 0.035,
                -0.04,
                0.1,
            ),
        );
    }

    head.add(part(new CylinderGeometry(0.085, 0.09, 0.04, 9), silver, 0, 0.09));
    spikes(head, 7, 0.08, 0.1, 0.13, ice);
    head.add(crystal(0.025, 0.08, rime).translateY(0.15).translateZ(0.085));
    piece.add(head);

    const right = limb(RIG.armRight, [-0.24, 0.62, 0], 0.24, 0.045, fur, hide);
    right.end.add(rod([0, -0.1, 0.04], [0, 0.42, 0.04], 0.014, silver));
    right.end.add(
        part(new TorusGeometry(0.03, 0.008, 6, 10), silver, 0, 0.42, 0.04),
    );
    right.end.add(crystal(0.045, 0.16, rime).translateY(0.5).translateZ(0.04));
    piece.add(right.pivot);
    piece.add(limb(RIG.armLeft, [0.24, 0.62, 0], 0.24, 0.045, fur, hide).pivot);

    return piece;
}
