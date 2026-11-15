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
 * The Zombie Horde: cartoonish undead risen from the graveyard. Grey-green
 * skin, tattered purple and brown rags, old bone and a sickly green glow.
 */

const skin = material({ color: 0x8fa888, roughness: 0.9, flatShading: true });
const paleSkin = material({
    color: 0xa9a0b8,
    roughness: 0.9,
    flatShading: true,
});
const rag = material({ color: 0x5b3a6e, roughness: 1, flatShading: true });
const darkRag = material({ color: 0x2c2236, roughness: 1, flatShading: true });
const brown = material({ color: 0x6b4a32, roughness: 1, flatShading: true });
const bone = material({ color: 0xe8e0c8, roughness: 0.7, flatShading: true });
const stitch = material({ color: 0x2a201c, roughness: 1 });
const dirt = material({ color: 0x3d342c, roughness: 1, flatShading: true });
const iron = material({
    color: 0x8a7a3a,
    metalness: 0.7,
    roughness: 0.45,
    flatShading: true,
});
const veil = material({
    color: 0x3a2a48,
    roughness: 0.9,
    transparent: true,
    opacity: 0.75,
    side: DoubleSide,
});
const fog = material({
    color: 0x9cff7a,
    emissive: 0x6cff4a,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.45,
    roughness: 1,
});
const ooze = glow(0x7dff5a, 0.6);
const eye = glow(0xb6ff4a, 0.55);

const builders: Record<PieceType, () => Group> = {
    p: shambler,
    n: boneHound,
    b: necromancer,
    r: fleshGolem,
    q: plagueMatron,
    k: lichLord,
};

export function buildZombie(type: PieceType): Group {
    return builders[type]();
}

/** Every Zombie character crawls out of a mound of grave dirt. */
function base(): Group {
    const group = new Group();
    group.add(part(new CylinderGeometry(0.28, 0.3, 0.05, 9), dirt, 0, 0.025));

    // A little glowing crack and a stray bone in the soil.
    group.add(
        part(
            new BoxGeometry(0.16, 0.01, 0.02),
            ooze,
            0.08,
            0.051,
            0.14,
        ).rotateY(0.5),
    );
    group.add(
        rod([-0.2, 0.055, 0.1], [-0.1, 0.055, 0.18], 0.01, bone, 0.01, 5),
    );

    return group;
}

function eyes(
    group: Group,
    y: number,
    z: number,
    spread: number,
    size = 0.018,
): void {
    for (const side of [-1, 1]) {
        group.add(
            part(new SphereGeometry(size, 8, 6), eye, side * spread, y, z),
        );
    }
}

/** A cartoon skull: a round cranium, a jaw and glowing sockets. */
function skull(size: number): Group {
    const group = new Group();
    const cranium = part(new SphereGeometry(size, 12, 10), bone);
    cranium.scale.set(1, 0.95, 1.05);
    group.add(cranium);
    group.add(
        part(
            new BoxGeometry(size * 1.1, size * 0.45, size * 0.9),
            bone,
            0,
            -size * 0.8,
            size * 0.2,
        ),
    );
    eyes(group, 0, size * 0.85, size * 0.38, size * 0.24);

    return group;
}

/** Ragged hem: little cloth tatters hanging round a waist. */
function tatters(
    group: Group,
    radius: number,
    y: number,
    count: number,
    length: number,
    mat = rag,
): void {
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const shred = part(
            new ConeGeometry(radius * 0.32, length * (0.7 + (i % 2) * 0.4), 3),
            mat,
            Math.sin(angle) * radius,
            y,
            Math.cos(angle) * radius,
        );
        shred.rotation.set(0, angle, Math.PI);
        shred.scale.z = 0.5;
        group.add(shred);
    }
}

/** Shambler (pawn): a hunched zombie with arms reaching forward. */
function shambler(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.05, 0.17, 0],
            0.12,
            0.027,
            brown,
            skin,
        );
        end.add(part(new BoxGeometry(0.05, 0.03, 0.08), skin, 0, -0.01, 0.02));
        pivot.rotation.x = side * 0.15;
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.17, 0);
    const torso = part(
        new CylinderGeometry(0.075, 0.09, 0.17, 7),
        rag,
        0,
        0.09,
    );
    torso.rotation.x = 0.35;
    body.add(torso);
    tatters(body, 0.085, 0.0, 6, 0.06);
    body.add(
        part(new TorusGeometry(0.088, 0.014, 4, 10), brown, 0, 0.02).rotateX(
            Math.PI / 2,
        ),
    );
    // A bare patch of skin where the shirt has ripped.
    body.add(
        part(new BoxGeometry(0.05, 0.04, 0.02), skin, 0.03, 0.1, 0.08).rotateZ(
            0.4,
        ),
    );
    piece.add(body);

    const head = joint(RIG.head, 0, 0.37, 0.07);
    const skull = part(new IcosahedronGeometry(0.07, 1), skin);
    skull.scale.set(1, 1.05, 0.95);
    head.add(skull);
    eyes(head, 0.01, 0.058, 0.026, 0.016);
    head.add(part(new BoxGeometry(0.04, 0.012, 0.01), stitch, 0, -0.03, 0.062));
    // A tuft of hair and a stitched scar.
    head.add(rod([0, 0.06, 0], [0.02, 0.11, -0.01], 0.008, darkRag, 0.003, 4));
    head.add(rod([-0.01, 0.06, 0], [-0.04, 0.1, 0], 0.008, darkRag, 0.003, 4));
    head.add(
        part(new BoxGeometry(0.04, 0.006, 0.006), stitch, -0.03, 0.035, 0.05),
    );
    head.rotation.z = 0.2;
    piece.add(head);

    for (const [name, side] of [
        [RIG.armLeft, 1],
        [RIG.armRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.09, 0.32, 0.04],
            0.13,
            0.022,
            skin,
            skin,
        );
        // A torn sleeve on the upper arm.
        pivot.add(
            part(new CylinderGeometry(0.03, 0.036, 0.05, 6), rag, 0, -0.025),
        );
        end.add(part(new ConeGeometry(0.01, 0.04, 4), skin, 0, -0.03, 0));
        pivot.rotation.x = -1.35 + side * 0.15;
        piece.add(pivot);
    }

    return piece;
}

/** Bone Hound (knight): a skeletal dog with glowing eyes. */
function boneHound(): Group {
    const piece = base();

    for (const [name, x, z] of [
        [RIG.legFrontLeft, 0.08, 0.13],
        [RIG.legFrontRight, -0.08, 0.13],
        [RIG.legBackLeft, 0.08, -0.12],
        [RIG.legBackRight, -0.08, -0.12],
    ] as const) {
        const { pivot, end } = limb(name, [x, 0.25, z], 0.18, 0.02, bone);
        end.add(
            part(new BoxGeometry(0.045, 0.02, 0.065), bone, 0, -0.01, 0.02),
        );
        // A knobbly knee joint.
        pivot.add(part(new SphereGeometry(0.026, 8, 6), bone, 0, -0.09));
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.29, 0);
    // The spine with a cage of ribs hanging off it.
    body.add(rod([0, 0.04, 0.17], [0, 0.04, -0.16], 0.024, bone, 0.018, 6));

    for (let i = 0; i < 4; i++) {
        const rib = part(
            new TorusGeometry(0.085 - i * 0.01, 0.014, 4, 10, Math.PI * 1.5),
            bone,
            0,
            -0.02,
            0.11 - i * 0.05,
        );
        rib.rotation.z = -Math.PI * 0.25;
        body.add(rib);
    }

    // A wisp of green spirit fire inside the ribs.
    body.add(part(new SphereGeometry(0.045, 8, 6), fog, 0, -0.02, 0.06));
    body.add(part(new SphereGeometry(0.025, 8, 6), ooze, 0, -0.02, 0.06));
    // The hips, and a scrap of purple collar round the neck.
    body.add(part(new BoxGeometry(0.15, 0.06, 0.09), bone, 0, 0.01, -0.14));
    body.add(
        part(new TorusGeometry(0.05, 0.016, 5, 10), rag, 0, 0.06, 0.17).rotateX(
            0.5,
        ),
    );

    const tail = joint(RIG.tail, 0, 0.05, -0.18);
    tail.add(rod([0, 0, 0], [0, 0.08, -0.08], 0.014, bone, 0.009, 5));
    tail.add(rod([0, 0.08, -0.08], [0, 0.16, -0.09], 0.009, bone, 0.004, 5));
    body.add(tail);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.41, 0.2);
    const cranium = part(new SphereGeometry(0.075, 10, 8), bone, 0, 0.01, 0);
    cranium.scale.set(1, 0.85, 1.05);
    head.add(cranium);
    head.add(part(new BoxGeometry(0.075, 0.05, 0.11), bone, 0, -0.01, 0.08));
    head.add(part(new BoxGeometry(0.065, 0.02, 0.1), bone, 0, -0.055, 0.07));
    head.add(part(new BoxGeometry(0.025, 0.015, 0.01), stitch, 0, 0.0, 0.136));
    eyes(head, 0.02, 0.055, 0.03, 0.016);

    for (const side of [-1, 1]) {
        head.add(
            part(
                new ConeGeometry(0.025, 0.08, 4),
                bone,
                side * 0.045,
                0.08,
                -0.02,
            ).rotateZ(-side * 0.35),
        );
        // A little fang.
        head.add(
            part(
                new ConeGeometry(0.008, 0.025, 4),
                bone,
                side * 0.022,
                -0.04,
                0.125,
            ).rotateX(Math.PI),
        );
    }

    piece.add(head);

    return piece;
}

/** Necromancer (bishop): a hooded caster with a skull-topped staff. */
function necromancer(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.19, 0.05],
                [0.17, 0.12],
                [0.11, 0.42],
                [0.08, 0.56],
                [0, 0.58],
            ],
            darkRag,
            8,
        ),
    );
    tatters(body, 0.18, 0.06, 7, 0.06, darkRag);
    body.add(
        part(new TorusGeometry(0.12, 0.014, 5, 12), brown, 0, 0.32).rotateX(
            Math.PI / 2,
        ),
    );
    body.add(
        part(new BoxGeometry(0.05, 0.28, 0.015), rag, 0, 0.24, 0.15).rotateX(
            -0.25,
        ),
    );
    // A dangling bone charm on the belt.
    body.add(rod([0.06, 0.3, 0.11], [0.08, 0.22, 0.13], 0.008, bone, 0.008, 4));
    piece.add(body);

    const head = joint(RIG.head, 0, 0.64, 0.01);
    head.add(part(new ConeGeometry(0.11, 0.28, 8), rag, 0, 0.07, -0.025));
    head.add(part(new SphereGeometry(0.06, 12, 10), stitch, 0, -0.01, 0.035));
    eyes(head, 0, 0.088, 0.024, 0.014);
    head.add(
        part(new ConeGeometry(0.03, 0.06, 5), skin, 0, -0.05, 0.06).rotateX(
            Math.PI,
        ),
    );
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.12, 0.48, 0.02],
        0.15,
        0.024,
        darkRag,
        skin,
    );
    right.end.add(rod([0, -0.28, 0.03], [0, 0.3, 0.03], 0.012, brown, 0.01, 6));
    right.end.add(skull(0.045).translateY(0.35).translateZ(0.03));
    right.end.add(part(new OctahedronGeometry(0.02, 0), ooze, 0, 0.42, 0.03));
    piece.add(right.pivot);

    const left = limb(
        RIG.armLeft,
        [0.12, 0.48, 0.02],
        0.15,
        0.024,
        darkRag,
        skin,
    );
    left.end.add(part(new SphereGeometry(0.03, 8, 6), fog, 0, 0, 0.03));
    left.pivot.rotation.x = -0.5;
    piece.add(left.pivot);

    return piece;
}

/** Flesh Golem (rook): a huge stitched brute with mismatched arms. */
function fleshGolem(): Group {
    const piece = base();

    for (const [name, side] of [
        [RIG.legLeft, 1],
        [RIG.legRight, -1],
    ] as const) {
        const { pivot, end } = limb(
            name,
            [side * 0.1, 0.19, 0],
            0.12,
            0.055,
            brown,
            skin,
        );
        end.add(part(new BoxGeometry(0.12, 0.05, 0.14), skin, 0, -0.02, 0.02));
        piece.add(pivot);
    }

    const body = joint(RIG.body, 0, 0.2, 0);
    const chest = part(new IcosahedronGeometry(0.2, 1), skin, 0, 0.2);
    chest.scale.set(1.05, 1.1, 0.85);
    body.add(chest);
    // One shoulder is a patch of paler, borrowed skin.
    const patch = part(
        new SphereGeometry(0.12, 8, 6),
        paleSkin,
        0.1,
        0.3,
        0.02,
    );
    patch.scale.set(1, 0.8, 0.9);
    body.add(patch);
    // Stitches zig-zagging across the chest.
    body.add(
        part(new BoxGeometry(0.008, 0.26, 0.01), stitch, -0.02, 0.2, 0.172),
    );

    for (let i = 0; i < 5; i++) {
        body.add(
            part(
                new BoxGeometry(0.05, 0.008, 0.01),
                stitch,
                -0.02,
                0.1 + i * 0.05,
                0.172,
            ),
        );
    }

    body.add(part(new CylinderGeometry(0.19, 0.2, 0.08, 9), brown, 0, 0.03));
    tatters(body, 0.19, -0.04, 8, 0.07, brown);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.6, 0.04);
    head.add(part(new BoxGeometry(0.13, 0.11, 0.11), skin));
    head.add(part(new BoxGeometry(0.14, 0.02, 0.12), darkRag, 0, 0.06));
    head.add(part(new BoxGeometry(0.1, 0.006, 0.01), stitch, 0, 0.035, 0.056));
    eyes(head, 0.01, 0.055, 0.03, 0.016);
    head.add(part(new BoxGeometry(0.06, 0.01, 0.01), stitch, 0, -0.03, 0.056));

    // Neck bolts.
    for (const side of [-1, 1]) {
        head.add(
            part(
                new CylinderGeometry(0.015, 0.015, 0.05, 6),
                iron,
                side * 0.08,
                -0.03,
                0,
            ).rotateZ(Math.PI / 2),
        );
    }

    piece.add(head);

    // A massive right arm and a long, thin borrowed left arm.
    const right = limb(RIG.armRight, [-0.24, 0.5, 0], 0.2, 0.065, skin, skin);
    right.end.add(part(new IcosahedronGeometry(0.085, 0), skin));
    right.pivot.add(
        part(new BoxGeometry(0.14, 0.008, 0.01), stitch, 0, -0.1, 0.065),
    );
    piece.add(right.pivot);

    const left = limb(
        RIG.armLeft,
        [0.22, 0.5, 0],
        0.27,
        0.035,
        paleSkin,
        paleSkin,
    );
    left.end.add(part(new BoxGeometry(0.06, 0.06, 0.04), paleSkin, 0, -0.03));
    piece.add(left.pivot);

    return piece;
}

/** The Plague Matron (queen): a tall veiled lady with a lantern of fog. */
function plagueMatron(): Group {
    const piece = base();

    const body = joint(RIG.body, 0, 0, 0);
    body.add(
        lathe(
            [
                [0.21, 0.05],
                [0.19, 0.12],
                [0.1, 0.42],
                [0.07, 0.56],
                [0.09, 0.66],
                [0, 0.68],
            ],
            rag,
            12,
        ),
    );
    tatters(body, 0.2, 0.07, 9, 0.07);
    // A corset of bone stays.
    body.add(part(new CylinderGeometry(0.085, 0.1, 0.12, 8), darkRag, 0, 0.46));

    for (const side of [-1, 0, 1]) {
        body.add(
            part(
                new BoxGeometry(0.012, 0.11, 0.012),
                bone,
                side * 0.035,
                0.46,
                0.095,
            ),
        );
    }

    // A high collar framing the head.
    const collar = part(
        new ConeGeometry(0.15, 0.14, 8, 1, true),
        darkRag,
        0,
        0.7,
        -0.03,
    );
    collar.rotation.x = Math.PI;
    body.add(collar);
    piece.add(body);

    const head = joint(RIG.head, 0, 0.77, 0);
    head.add(part(new SphereGeometry(0.065, 14, 10), paleSkin));
    eyes(head, 0.01, 0.055, 0.024, 0.014);
    head.add(
        part(
            new ConeGeometry(
                0.13,
                0.3,
                12,
                1,
                true,
                Math.PI * 0.3,
                Math.PI * 1.4,
            ),
            veil,
            0,
            -0.06,
            -0.01,
        ),
    );
    head.add(part(new CylinderGeometry(0.075, 0.07, 0.03, 10), bone, 0, 0.06));

    for (let i = 0; i < 5; i++) {
        const angle = ((i - 2) / 4) * 1.4;
        head.add(
            part(
                new ConeGeometry(0.012, 0.06 - Math.abs(i - 2) * 0.01, 4),
                bone,
                Math.sin(angle) * 0.07,
                0.1,
                Math.cos(angle) * 0.07,
            ),
        );
    }

    head.add(part(new OctahedronGeometry(0.015, 0), ooze, 0, 0.065, 0.075));
    piece.add(head);

    piece.add(
        limb(RIG.armRight, [-0.11, 0.62, 0], 0.18, 0.018, rag, paleSkin).pivot,
    );

    const left = limb(RIG.armLeft, [0.11, 0.62, 0], 0.18, 0.018, rag, paleSkin);
    left.pivot.rotation.x = -0.6;
    // The lantern hangs from the hand and swings on its own.
    const lantern = joint(RIG.swinger, 0, -0.01, 0);
    lantern.rotation.x = 0.6;
    lantern.add(rod([0, 0, 0], [0, -0.06, 0], 0.004, iron));
    lantern.add(
        part(new CylinderGeometry(0.02, 0.04, 0.02, 6), iron, 0, -0.07),
    );
    lantern.add(part(new SphereGeometry(0.035, 10, 8), ooze, 0, -0.11));
    lantern.add(part(new SphereGeometry(0.05, 8, 6), fog, 0, -0.11));
    lantern.add(
        part(new CylinderGeometry(0.04, 0.03, 0.02, 6), iron, 0, -0.16),
    );
    left.end.add(lantern);
    piece.add(left.pivot);

    return piece;
}

/** The Lich Lord (king): a skeletal king with a jagged crown and an orb. */
function lichLord(): Group {
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
            darkRag,
            10,
        ),
    );
    tatters(body, 0.22, 0.07, 7, 0.07, darkRag);
    body.add(part(new BoxGeometry(0.38, 0.44, 0.02), rag, 0, 0.41, -0.15));
    body.add(
        part(new TorusGeometry(0.15, 0.018, 6, 16), iron, 0, 0.42).rotateX(
            Math.PI / 2,
        ),
    );

    // Bare ribs showing through the robe, with a green heart.
    for (let i = 0; i < 3; i++) {
        body.add(
            part(
                new BoxGeometry(0.12 - i * 0.02, 0.014, 0.02),
                bone,
                0,
                0.6 - i * 0.04,
                0.13,
            ),
        );
    }

    body.add(part(new OctahedronGeometry(0.025, 0), ooze, 0, 0.5, 0.145));

    // Skull pauldrons.
    for (const side of [-1, 1]) {
        const shoulder = skull(0.05);
        shoulder.position.set(side * 0.19, 0.67, 0);
        shoulder.rotation.y = side * 0.4;
        body.add(shoulder);
    }

    piece.add(body);

    const head = joint(RIG.head, 0, 0.8, 0);
    const cranium = part(new SphereGeometry(0.075, 12, 10), bone);
    cranium.scale.set(1, 1.05, 1.05);
    head.add(cranium);
    head.add(part(new BoxGeometry(0.08, 0.035, 0.07), bone, 0, -0.065, 0.02));
    eyes(head, 0, 0.065, 0.028, 0.017);
    head.add(part(new BoxGeometry(0.05, 0.006, 0.01), stitch, 0, -0.05, 0.058));
    head.add(part(new CylinderGeometry(0.08, 0.075, 0.035, 8), iron, 0, 0.07));

    for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        const spike = part(
            new ConeGeometry(0.018, 0.06 + (i % 2) * 0.05, 4),
            iron,
            Math.sin(angle) * 0.07,
            0.11 + (i % 2) * 0.025,
            Math.cos(angle) * 0.07,
        );
        spike.rotation.z = Math.sin(angle) * -0.25;
        spike.rotation.x = Math.cos(angle) * 0.25;
        head.add(spike);
    }

    head.add(part(new OctahedronGeometry(0.018, 0), ooze, 0, 0.07, 0.08));
    piece.add(head);

    const right = limb(
        RIG.armRight,
        [-0.2, 0.62, 0],
        0.22,
        0.028,
        darkRag,
        bone,
    );
    right.end.add(rod([0, -0.1, 0.03], [0, 0.42, 0.03], 0.013, iron));
    right.end.add(
        part(new CylinderGeometry(0.035, 0.015, 0.04, 6), iron, 0, 0.44, 0.03),
    );
    right.end.add(part(new SphereGeometry(0.045, 12, 10), ooze, 0, 0.49, 0.03));
    right.end.add(part(new SphereGeometry(0.065, 10, 8), fog, 0, 0.49, 0.03));
    piece.add(right.pivot);
    piece.add(
        limb(RIG.armLeft, [0.2, 0.62, 0], 0.22, 0.028, darkRag, bone).pivot,
    );

    return piece;
}
