import type { PieceType } from '@/lib/armies';
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
