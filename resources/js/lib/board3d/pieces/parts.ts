import {
    BoxGeometry,
    CylinderGeometry,
    Group,
    LatheGeometry,
    Mesh,
    MeshStandardMaterial,
    Quaternion,
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
 * facing +z, standing on y = 0, and about 1 unit tall at most.
 */

export function material(
    params: MeshStandardMaterialParameters,
): MeshStandardMaterial {
    return new MeshStandardMaterial(params);
}

/** A material that glows, for eyes, furnaces and magic. */
export function glow(colour: number, intensity = 0.9): MeshStandardMaterial {
    return new MeshStandardMaterial({
        color: colour,
        emissive: colour,
        emissiveIntensity: intensity,
        roughness: 0.4,
    });
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
