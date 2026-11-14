import {
    AdditiveBlending,
    BoxGeometry,
    CanvasTexture,
    ConeGeometry,
    CylinderGeometry,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    RingGeometry,
    SphereGeometry,
    Sprite,
    SpriteMaterial,
    Vector3,
} from 'three';
import type { BufferGeometry } from 'three';
import { armies } from '@/lib/armies';
import { IMPACT_AT } from '@/lib/board3d/battle/core';
import type { BattleScene, Beat } from '@/lib/board3d/battle/core';
import { glowBoost } from '@/lib/board3d/pieces/parts';
import { armyStyles } from '@/lib/board3d/styles';
import type { DebrisKind } from '@/lib/board3d/styles';
import { clamp01, easeOut } from '@/lib/board3d/tweens';

/** Cogs and sparks, or leaves and thorns. */
function debrisShapes(kind: DebrisKind): BufferGeometry[] {
    if (kind === 'cogs') {
        return [
            new CylinderGeometry(0.05, 0.05, 0.02, 7),
            new BoxGeometry(0.02, 0.02, 0.12),
        ];
    }

    const leaf = new SphereGeometry(0.06, 6, 4);
    leaf.scale(1, 0.2, 0.55);

    return [leaf, new ConeGeometry(0.02, 0.1, 5)];
}

type Particle = {
    mesh: Mesh;
    velocity: Vector3;
    spin: Vector3;
    life: number;
    age: number;
};

const GRAVITY = 7;
const COUNT = 40;

/**
 * The blow lands: a burst of the attacker's army debris, a flash of light
 * and a shockwave ring across the board.
 */
export function impactBurst(battle: BattleScene): Beat {
    const { attacker, defender, props } = battle;
    const centre = defender.position.clone().setY(0.45);
    const style = armyStyles[attacker.army];
    const palette = armies[attacker.army].palette;
    const shapes = debrisShapes(style.debris);
    const materials = palette.map(
        (colour) =>
            new MeshStandardMaterial({
                color: colour,
                emissive: colour,
                // Sparks glow; with bloom on, gently, or forty of them wash out the shot.
                emissiveIntensity:
                    style.debrisGlow * Math.min(glowBoost(), 2.5),
                roughness: 0.5,
            }),
    );

    const particles: Particle[] = [];

    const flash = battle.light;

    const ringMaterial = new MeshBasicMaterial({
        color: palette[0],
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
    });
    const ring = new Mesh(new RingGeometry(0.36, 0.4, 48), ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(defender.position).setY(0.02);
    props.add(ring);

    let burst = false;
    let previous = 0;

    function spawn(): void {
        for (let i = 0; i < COUNT; i++) {
            const mesh = new Mesh(
                shapes[i % shapes.length],
                materials[i % materials.length],
            );
            mesh.position.copy(centre);
            mesh.rotation.set(
                Math.random() * 6,
                Math.random() * 6,
                Math.random() * 6,
            );
            mesh.castShadow = true;
            props.add(mesh);

            const angle = Math.random() * Math.PI * 2;
            const speed = 1.2 + Math.random() * 2.4;
            particles.push({
                mesh,
                velocity: new Vector3(
                    Math.cos(angle) * speed,
                    1.5 + Math.random() * 3,
                    Math.sin(angle) * speed,
                ),
                spin: new Vector3(
                    Math.random() * 12 - 6,
                    Math.random() * 12 - 6,
                    Math.random() * 12 - 6,
                ),
                life: 0.9 + Math.random() * 0.6,
                age: 0,
            });
        }
    }

    return {
        update(elapsed) {
            const dt = Math.max(elapsed - previous, 0) / 1000;
            previous = elapsed;

            if (!burst && elapsed >= IMPACT_AT) {
                burst = true;
                battle.flash(0.6);
                spawn();
            }

            const since = elapsed - IMPACT_AT;

            if (since >= 0) {
                flash.color.set(palette[0]);
                flash.position.copy(centre);
                flash.intensity =
                    (glowBoost() > 1 ? 4 : 14) *
                    (1 - easeOut(clamp01(since / 350)));
                const t = clamp01(since / 600);
                ring.scale.setScalar(1 + easeOut(t) * 3);
                ringMaterial.opacity = 0.45 * (1 - t);
            }

            for (const particle of particles) {
                particle.age += dt;
                const { mesh, velocity, spin } = particle;

                velocity.y -= GRAVITY * dt;
                mesh.position.addScaledVector(velocity, dt);

                // Bounce off the board, losing most of the energy.
                if (mesh.position.y < 0.02) {
                    mesh.position.y = 0.02;
                    velocity.y = Math.abs(velocity.y) * 0.35;
                    velocity.x *= 0.6;
                    velocity.z *= 0.6;
                    spin.multiplyScalar(0.6);
                }

                mesh.rotation.x += spin.x * dt;
                mesh.rotation.y += spin.y * dt;
                mesh.rotation.z += spin.z * dt;

                const left = 1 - particle.age / particle.life;
                mesh.scale.setScalar(Math.max(Math.min(left * 3, 1), 0.001));
                mesh.visible = left > 0;
            }
        },
        finish() {
            shapes.forEach((shape) => shape.dispose());
            materials.forEach((material) => material.dispose());
            ring.geometry.dispose();
            ringMaterial.dispose();
        },
    };
}

/** A soft round puff, drawn once and shared by every dust sprite. */
function puffTexture(): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.45)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    return new CanvasTexture(canvas);
}

/** Dust billows out along the board where the blow lands. */
export function dustCloud(battle: BattleScene): Beat {
    const { defender, props } = battle;
    const texture = puffTexture();
    const puffs: {
        sprite: Sprite;
        material: SpriteMaterial;
        drift: Vector3;
    }[] = [];
    let spawned = false;

    return {
        update(elapsed) {
            const since = elapsed - IMPACT_AT;

            if (since < 0) {
                return;
            }

            if (!spawned) {
                spawned = true;

                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
                    const material = new SpriteMaterial({
                        map: texture,
                        color: 0xb9a27c,
                        transparent: true,
                        depthWrite: false,
                        opacity: 0,
                    });
                    const sprite = new Sprite(material);
                    sprite.position.copy(defender.position).setY(0.12);
                    props.add(sprite);
                    puffs.push({
                        sprite,
                        material,
                        drift: new Vector3(
                            Math.cos(angle),
                            0.25 + Math.random() * 0.2,
                            Math.sin(angle),
                        ),
                    });
                }
            }

            const t = clamp01(since / 900);

            for (const { sprite, material, drift } of puffs) {
                sprite.position
                    .copy(defender.position)
                    .setY(0.12)
                    .addScaledVector(drift, easeOut(t) * 0.9);
                sprite.scale.setScalar(0.35 + easeOut(t) * 0.8);
                material.opacity = 0.75 * Math.min(t * 8, 1) * (1 - t);
            }
        },
        finish() {
            texture.dispose();
            puffs.forEach(({ material }) => material.dispose());
        },
    };
}
