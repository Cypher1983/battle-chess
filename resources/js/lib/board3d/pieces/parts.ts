import {
    BoxGeometry,
    CapsuleGeometry,
    CylinderGeometry,
    Group,
    LatheGeometry,
    Mesh,
    MeshStandardMaterial,
    Quaternion,
    SphereGeometry,
    Vector2,
    Vector3,
} from 'three';
import type {
    BufferGeometry,
    Material,
    MeshStandardMaterialParameters,
} from 'three';

/**
 * Small building blocks for the procedural piece models. Pieces are built
 * facing +z, standing on y = 0, and about 1.2 units tall at most.
 */

/**
 * Names of the movable parts of a character. Battles and idle animation
 * find them with `getObjectByName`, which also works on cloned models.
 */
export const RIG = {
    body: 'body',
    head: 'head',
    armLeft: 'arm-left',
    armRight: 'arm-right',
    legLeft: 'leg-left',
    legRight: 'leg-right',
    legFrontLeft: 'leg-front-left',
    legFrontRight: 'leg-front-right',
    legBackLeft: 'leg-back-left',
    legBackRight: 'leg-back-right',
    tail: 'tail',
    /** Something that turns on its own (a halo cog). */
    spinner: 'spinner',
    /** Something that swings on its own (a pendulum). */
    swinger: 'swinger',
} as const;

export function material(
    params: MeshStandardMaterialParameters,
): MeshStandardMaterial {
    return new MeshStandardMaterial(params);
}

/** Every glowing material and its base strength, for `setGlowBoost`. */
const glows = new Map<MeshStandardMaterial, number>();
let boost = 1;

/** A material that glows, for eyes, furnaces and magic. */
export function glow(colour: number, intensity = 0.9): MeshStandardMaterial {
    const material = new MeshStandardMaterial({
        color: colour,
        emissive: colour,
        emissiveIntensity: intensity * boost,
        roughness: 0.4,
    });
    glows.set(material, intensity);

    return material;
}

/**
 * Make every glow brighter. With bloom on, glows must outshine anything
 * lit by the lights so that only they bloom; without bloom the same
 * strength would wash their colour out to white.
 */
export function setGlowBoost(value: number): void {
    boost = value;
    glows.forEach((base, material) => {
        material.emissiveIntensity = base * value;
    });
}

/** The current glow boost, for effects that make their own materials. */
export function glowBoost(): number {
    return boost;
}

/** A mesh that casts and receives shadows, placed at (x, y, z). */
export function part(
    geometry: BufferGeometry,
    mat: Material,
    x = 0,
    y = 0,
    z = 0,
): Mesh {
    const mesh = new Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}

/** A turned shape from (radius, height) points, like a classic chess piece. */
export function lathe(
    profile: [number, number][],
    mat: Material,
    segments = 32,
): Mesh {
    return part(
        new LatheGeometry(
            profile.map(([radius, height]) => new Vector2(radius, height)),
            segments,
        ),
        mat,
    );
}

/** A cylinder running from one point to another. */
export function rod(
    from: [number, number, number],
    to: [number, number, number],
    radius: number,
    mat: Material,
    tipRadius = radius,
    segments = 8,
): Mesh {
    const start = new Vector3(...from);
    const end = new Vector3(...to);
    const direction = end.clone().sub(start);
    const mesh = part(
        new CylinderGeometry(tipRadius, radius, direction.length(), segments),
        mat,
    );
    mesh.position.copy(start.add(end).multiplyScalar(0.5));
    mesh.quaternion.copy(
        new Quaternion().setFromUnitVectors(
            new Vector3(0, 1, 0),
            direction.normalize(),
        ),
    );

    return mesh;
}

/** A cog: a disc with square teeth around its rim, lying flat. */
export function gear(
    radius: number,
    thickness: number,
    teeth: number,
    mat: Material,
): Group {
    const cog = new Group();
    cog.add(part(new CylinderGeometry(radius, radius, thickness, 32), mat));

    const tooth = new BoxGeometry(radius * 0.22, thickness, radius * 0.22);

    for (let i = 0; i < teeth; i++) {
        const angle = (i / teeth) * Math.PI * 2;
        const mesh = part(
            tooth,
            mat,
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius,
        );
        mesh.rotation.y = -angle;
        cog.add(mesh);
    }

    return cog;
}

/** An empty pivot at (x, y, z) to hang parts on, e.g. a shoulder. */
export function joint(name: string, x = 0, y = 0, z = 0): Group {
    const pivot = new Group();
    pivot.name = name;
    pivot.position.set(x, y, z);

    return pivot;
}

/** A pill shape standing upright, centred on (x, y, z). */
export function capsule(
    radius: number,
    length: number,
    mat: Material,
    x = 0,
    y = 0,
    z = 0,
): Mesh {
    return part(new CapsuleGeometry(radius, length, 4, 10), mat, x, y, z);
}

/**
 * An arm or leg: a pivot at the shoulder or hip with a limb hanging
 * straight down and a hand or foot at its end. Things held in the hand are
 * added to the returned `end` group, which moves with the limb.
 */
export function limb(
    name: string,
    at: [number, number, number],
    length: number,
    radius: number,
    mat: Material,
    endMat: Material = mat,
): { pivot: Group; end: Group } {
    const pivot = joint(name, ...at);
    pivot.add(capsule(radius, length, mat, 0, -length / 2));

    const end = new Group();
    end.position.y = -length;
    end.add(part(new SphereGeometry(radius * 1.35, 10, 8), endMat));
    pivot.add(end);

    return { pivot, end };
}
