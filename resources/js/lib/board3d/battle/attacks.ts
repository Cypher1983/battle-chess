import {
    AdditiveBlending,
    IcosahedronGeometry,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PointLight,
    Vector3,
} from 'three';
import type { PieceColor, PieceType } from '@/lib/armies';
import { approach, IMPACT_AT, onImpact } from '@/lib/board3d/battle/core';
import type { BattleScene, Beat } from '@/lib/board3d/battle/core';
import { clamp01, easeIn, easeOut, lerp } from '@/lib/board3d/tweens';

/** When the attack starts, once the camera has swooped in (ms). */
const ATTACK_FROM = 550;

type AttackStyle = 'charge' | 'projectile' | 'slam';

/** How each piece fights (the same as in the 2D battles). */
const attackStyles: Record<PieceType, AttackStyle> = {
    p: 'charge',
    n: 'charge',
    k: 'charge',
    b: 'projectile',
    q: 'projectile',
    r: 'slam',
};

const attacks: Partial<Record<AttackStyle, (battle: BattleScene) => Beat>> = {
    charge,
    projectile,
    slam,
};

/** Clockwork throws blue lightning, the Wildwood green magic. */
const orbColours: Record<PieceColor, number> = {
    w: 0x7fd4ff,
    b: 0x9dff6a,
};

/** The attacker's part of the battle, up to and just after the blow. */
export function attack(battle: BattleScene): Beat {
    const style = attackStyles[battle.attacker.type];

    return (attacks[style] ?? approach)(battle);
}

/**
 * Lean back and shuffle away, then dash in leaning forward. Knights leap;
 * everyone recoils a little after the hit.
 */
function charge(battle: BattleScene): Beat {
    const { attacker, heading, contact } = battle;
    const object = attacker.object;
    const start = attacker.position;
    const windUp = start.clone().addScaledVector(heading, -0.2);
    const recoil = contact.clone().addScaledVector(heading, -0.12);
    const leap = attacker.type === 'n' ? 0.55 : 0.08;
    const dashFrom = 850;
    const impact = onImpact(() => battle.shake(0.08));

    return {
        update(elapsed) {
            impact(elapsed);

            if (elapsed < ATTACK_FROM) {
                return;
            }

            if (elapsed < dashFrom) {
                const t = easeOut(
                    clamp01((elapsed - ATTACK_FROM) / (dashFrom - ATTACK_FROM)),
                );
                object.position.lerpVectors(start, windUp, t);
                object.rotation.x = lerp(0, -0.25, t);
            } else if (elapsed < IMPACT_AT) {
                const t = clamp01(
                    (elapsed - dashFrom) / (IMPACT_AT - dashFrom),
                );
                object.position.lerpVectors(windUp, contact, easeIn(t));
                object.position.y = Math.sin(Math.PI * t) * leap;
                object.rotation.x = lerp(-0.25, 0.35, easeOut(t));
            } else {
                const t = clamp01((elapsed - IMPACT_AT) / 250);
                object.position.lerpVectors(contact, recoil, easeOut(t));
                object.position.y = 0;
                object.rotation.x = lerp(0.35, 0, easeOut(t));
            }
        },
    };
}

/**
 * Float up while a glowing orb gathers overhead, then hurl it at the
 * defender in an arc, timed to hit on impact.
 */
function projectile(battle: BattleScene): Beat {
    const { attacker, defender, props } = battle;
    const object = attacker.object;
    const colour = orbColours[attacker.color];
    const throwFrom = 950;

    const material = new MeshStandardMaterial({
        color: colour,
        emissive: colour,
        emissiveIntensity: 0.8,
    });
    const haloMaterial = new MeshBasicMaterial({
        color: colour,
        transparent: true,
        opacity: 0.35,
        blending: AdditiveBlending,
        depthWrite: false,
    });
    const orb = new Mesh(new IcosahedronGeometry(0.1, 1), material);
    const halo = new Mesh(new IcosahedronGeometry(0.2, 1), haloMaterial);
    orb.add(halo);
    orb.visible = false;
    orb.add(new PointLight(colour, 4, 3));
    props.add(orb);

    const hand = attacker.position.clone().add(new Vector3(0, 1.15, 0));
    const target = defender.position.clone().add(new Vector3(0, 0.45, 0));
    const impact = onImpact(() => battle.shake(0.1));

    return {
        update(elapsed) {
            impact(elapsed);

            if (elapsed < ATTACK_FROM) {
                return;
            }

            // The caster hovers while casting and settles after the hit.
            const hover =
                elapsed < IMPACT_AT
                    ? easeOut(clamp01((elapsed - ATTACK_FROM) / 300)) * 0.18
                    : (1 - easeOut(clamp01((elapsed - IMPACT_AT) / 300))) *
                      0.18;
            object.position.y =
                hover + Math.sin(elapsed / 90) * 0.02 * Math.sign(hover);

            if (elapsed < throwFrom) {
                const t = clamp01(
                    (elapsed - ATTACK_FROM) / (throwFrom - ATTACK_FROM),
                );
                orb.visible = true;
                orb.position.copy(hand);
                orb.position.y += hover;
                orb.scale.setScalar(
                    Math.max(easeOut(t), 0.01) *
                        (1 + Math.sin(elapsed / 40) * 0.08),
                );
                orb.rotation.y = elapsed / 120;
                object.rotation.x = lerp(0, -0.18, easeOut(t));
            } else if (elapsed < IMPACT_AT) {
                const t = clamp01(
                    (elapsed - throwFrom) / (IMPACT_AT - throwFrom),
                );
                orb.position.lerpVectors(hand, target, easeIn(t));
                orb.position.y += Math.sin(Math.PI * t) * 0.6;
                orb.rotation.y = elapsed / 60;
                object.rotation.x = lerp(-0.18, 0.25, easeOut(t));
            } else {
                orb.visible = false;
                object.rotation.x = lerp(
                    0.25,
                    0,
                    easeOut(clamp01((elapsed - IMPACT_AT) / 300)),
                );
            }
        },
        finish() {
            orb.geometry.dispose();
            halo.geometry.dispose();
            material.dispose();
            haloMaterial.dispose();
        },
    };
}

/**
 * Crouch, leap high over the defender and crash down on it: a squash on
 * landing and a heavy camera shake.
 */
function slam(battle: BattleScene): Beat {
    const { attacker, defender, heading } = battle;
    const object = attacker.object;
    const start = attacker.position;
    const landing = defender.position.clone().addScaledVector(heading, -0.4);
    const apex = start.clone().lerp(landing, 0.6).setY(1.6);
    const crouchUntil = 700;
    const fallFrom = 1000;
    const impact = onImpact(() => battle.shake(0.22));

    const squash = (amount: number): void => {
        object.scale.set(1 + amount * 0.5, 1 - amount, 1 + amount * 0.5);
    };

    return {
        update(elapsed) {
            impact(elapsed);

            if (elapsed < ATTACK_FROM) {
                return;
            }

            if (elapsed < crouchUntil) {
                squash(
                    0.18 *
                        easeOut(
                            clamp01(
                                (elapsed - ATTACK_FROM) /
                                    (crouchUntil - ATTACK_FROM),
                            ),
                        ),
                );
            } else if (elapsed < fallFrom) {
                const t = easeOut(
                    clamp01((elapsed - crouchUntil) / (fallFrom - crouchUntil)),
                );
                squash(lerp(0.18, -0.08, t));
                object.position.lerpVectors(start, apex, t);
                object.rotation.x = lerp(0, -0.3, t);
            } else if (elapsed < IMPACT_AT) {
                const t = easeIn(
                    clamp01((elapsed - fallFrom) / (IMPACT_AT - fallFrom)),
                );
                squash(-0.08);
                object.position.lerpVectors(apex, landing, t);
                object.rotation.x = lerp(-0.3, 0.15, t);
            } else {
                // Land hard, squash, and spring back to shape.
                const t = clamp01((elapsed - IMPACT_AT) / 350);
                object.position.copy(landing);
                squash(0.25 * Math.sin(Math.PI * t) * (1 - t));
                object.rotation.x = lerp(0.15, 0, easeOut(t));
            }
        },
    };
}
