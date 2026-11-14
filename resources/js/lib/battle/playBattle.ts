import {
    Application,
    Assets,
    Container,
    Graphics,
    Sprite,
    Text,
} from 'pixi.js';
import type { Texture, Ticker } from 'pixi.js';
import { armies, pieceImage } from '@/lib/armies';
import type { PieceColor, PieceType } from '@/lib/armies';

export type Fighter = {
    color: PieceColor;
    type: PieceType;
};

export type BattleOptions = {
    attacker: Fighter;
    defender: Fighter;
    /** Abort to end the scene early (e.g. the player clicked to skip). */
    signal?: AbortSignal;
    /** Called every frame with the scene time, e.g. to sync sound effects. */
    onProgress?: (elapsedMs: number) => void;
};

/** Scene time (ms) at which the attack lands. */
export const IMPACT_AT = 1000;

/** Total scene length (ms). */
export const DURATION = 2200;

type AttackStyle = 'charge' | 'projectile' | 'slam';

/** How each piece type fights. */
const attackStyles: Record<PieceType, AttackStyle> = {
    p: 'charge',
    n: 'charge',
    k: 'charge',
    b: 'projectile',
    q: 'projectile',
    r: 'slam',
};

/** Effect colours per army: Clockwork sparks and lightning, Wildwood leaves and thorns. */
const effectPalettes: Record<PieceColor, number[]> = {
    w: [0xffd75e, 0xfff1b8, 0x7fd4ff, 0xc9952b],
    b: [0x3f8f3a, 0x8fcf6a, 0x6b4a2b, 0xd6336c],
};

type Particle = {
    shape: Graphics;
    vx: number;
    vy: number;
    spin: number;
    life: number;
};

/**
 * Play a short capture battle inside the given element. Resolves when the
 * scene ends or is aborted, and always cleans up its canvas.
 */
export async function playBattle(
    host: HTMLElement,
    { attacker, defender, signal, onProgress }: BattleOptions,
): Promise<void> {
    if (signal?.aborted) {
        return;
    }

    const app = new Application();
    await app.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
    });

    host.appendChild(app.canvas);

    try {
        const [attackerTexture, defenderTexture] = await Promise.all([
            loadTexture(attacker),
            loadTexture(defender),
        ]);

        if (signal?.aborted) {
            return;
        }

        await runScene(
            app,
            attacker,
            defender,
            attackerTexture,
            defenderTexture,
            signal,
            onProgress,
        );
    } finally {
        app.destroy({ removeView: true }, { children: true });
    }
}

function loadTexture({ color, type }: Fighter): Promise<Texture> {
    return Assets.load<Texture>({
        src: pieceImage(color, type),
        data: { resolution: 3 },
    });
}

function runScene(
    app: Application,
    attacker: Fighter,
    defender: Fighter,
    attackerTexture: Texture,
    defenderTexture: Texture,
    signal?: AbortSignal,
    onProgress?: (elapsedMs: number) => void,
): Promise<void> {
    const { width, height } = app.screen;
    const size = Math.min(width, height) * 0.36;
    const groundY = height * 0.68;
    const leftX = width * 0.28;
    const rightX = width * 0.72;
    const style = attackStyles[attacker.type];

    const stage = new Container();
    app.stage.addChild(stage);

    // Backdrop: dark veil with a lit arena floor.
    const backdrop = new Graphics()
        .rect(0, 0, width, height)
        .fill({ color: 0x0b0d10, alpha: 0.82 })
        .ellipse(width / 2, groundY + size * 0.05, width * 0.42, size * 0.16)
        .fill({ color: 0x5b4632, alpha: 0.6 });
    stage.addChild(backdrop);

    const hero = makeFighter(attackerTexture, size);
    const foe = makeFighter(defenderTexture, size);
    foe.scale.x *= -1; // face the attacker
    stage.addChild(foe, hero);

    // Squash and stretch are applied relative to this, never compounded.
    const heroScale = hero.scale.y;

    const caption = new Text({
        text: `${armies[attacker.color].pieces[attacker.type]} defeats ${armies[defender.color].pieces[defender.type]}`,
        style: {
            fill: '#ffffff',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSize: Math.max(14, Math.round(size * 0.13)),
            fontWeight: '700',
            dropShadow: { color: '#000000', blur: 4, distance: 0, alpha: 0.8 },
        },
    });
    caption.anchor.set(0.5);
    caption.position.set(width / 2, height * 0.16);
    caption.alpha = 0;
    stage.addChild(caption);

    const projectile = new Graphics();
    stage.addChild(projectile);

    const particles: Particle[] = [];
    const effects = effectPalettes[attacker.color];
    const debris = effectPalettes[defender.color];
    let elapsed = 0;
    let impacted = false;

    return new Promise((resolve) => {
        const finish = (): void => {
            app.ticker.remove(tick);
            signal?.removeEventListener('abort', finish);
            resolve();
        };

        signal?.addEventListener('abort', finish, { once: true });

        const tick = (ticker: Ticker): void => {
            elapsed += ticker.deltaMS;
            const t = elapsed;

            // 0–400ms: fighters slide in.
            const enter = easeOut(clamp(t / 400));
            stage.alpha =
                t > DURATION - 300 ? clamp((DURATION - t) / 300) : enter;

            if (t <= 400) {
                hero.position.set(lerp(-size, leftX, enter), groundY);
                foe.position.set(lerp(width + size, rightX, enter), groundY);
            }

            // 400–IMPACT: wind up, then strike according to the attack style.
            if (t > 400 && t <= IMPACT_AT) {
                const p = (t - 400) / (IMPACT_AT - 400);
                animateAttack(
                    style,
                    p,
                    hero,
                    heroScale,
                    foe,
                    projectile,
                    effects,
                    size,
                    groundY,
                    leftX,
                    rightX,
                );
            }

            if (t > IMPACT_AT && !impacted) {
                impacted = true;
                projectile.clear();
                burst(
                    stage,
                    particles,
                    foe.x,
                    groundY - size * 0.45,
                    effects,
                    26,
                    size,
                );
                burst(
                    stage,
                    particles,
                    foe.x,
                    groundY - size * 0.45,
                    debris,
                    18,
                    size,
                );
                foe.tint = 0xff6b6b;
                hero.scale.set(heroScale);
            }

            // IMPACT–+700ms: screen shake, defender knocked back and fading.
            if (t > IMPACT_AT) {
                const p = clamp((t - IMPACT_AT) / 700);
                const shake = (1 - p) * size * 0.06;
                stage.position.set(
                    (Math.random() - 0.5) * shake,
                    (Math.random() - 0.5) * shake,
                );
                foe.position.set(
                    rightX + easeOut(p) * size * 0.6,
                    groundY - Math.sin(p * Math.PI) * size * 0.25,
                );
                foe.rotation = easeOut(p) * 1.2;
                foe.alpha = 1 - p;
                hero.position.x = lerp(
                    hero.position.x,
                    leftX + size * 0.2,
                    0.08,
                );
                caption.alpha = clamp((t - IMPACT_AT) / 250);

                // Victory hop for the attacker.
                const hop = clamp((t - IMPACT_AT - 400) / 500);
                hero.position.y =
                    groundY - Math.sin(hop * Math.PI) * size * 0.12;
            }

            updateParticles(particles, ticker.deltaMS, size);
            onProgress?.(t);

            if (t >= DURATION) {
                finish();
            }
        };

        app.ticker.add(tick);
    });
}

function makeFighter(texture: Texture, size: number): Sprite {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 0.92);
    const scale = size / Math.max(texture.width, texture.height);
    sprite.scale.set(scale);

    return sprite;
}

function animateAttack(
    style: AttackStyle,
    p: number,
    hero: Sprite,
    baseScale: number,
    foe: Sprite,
    projectile: Graphics,
    colors: number[],
    size: number,
    groundY: number,
    leftX: number,
    rightX: number,
): void {
    const windUp = clamp(p / 0.45);
    const strike = clamp((p - 0.45) / 0.55);

    // Squash during the wind-up for anticipation.
    hero.scale.set(
        baseScale * (1 + windUp * 0.12 - strike * 0.12),
        baseScale * (1 - windUp * 0.12 + strike * 0.12),
    );

    if (style === 'charge') {
        hero.position.set(
            lerp(
                leftX - windUp * size * 0.15,
                rightX - size * 0.45,
                easeIn(strike),
            ),
            groundY - Math.sin(strike * Math.PI) * size * 0.3,
        );
    }

    if (style === 'slam') {
        hero.position.set(
            lerp(leftX, rightX - size * 0.35, strike),
            groundY -
                Math.sin(Math.min(strike * 1.4, 1) * Math.PI * 0.5) *
                    size *
                    0.9 *
                    (1 - easeIn(strike)),
        );
    }

    if (style === 'projectile') {
        hero.position.set(leftX - windUp * size * 0.08, groundY);
        projectile.clear();

        if (strike > 0) {
            const x = lerp(leftX + size * 0.3, foe.x, easeIn(strike));
            const y =
                groundY - size * 0.5 - Math.sin(strike * Math.PI) * size * 0.25;
            const radius = size * 0.09;

            projectile
                .circle(x, y, radius * 1.8)
                .fill({ color: colors[1], alpha: 0.35 })
                .circle(x, y, radius)
                .fill({ color: colors[0] })
                .moveTo(x - radius * 4, y + radius * 0.6)
                .lineTo(x - radius * 2, y - radius * 0.4)
                .lineTo(x - radius * 3, y)
                .lineTo(x - radius, y)
                .stroke({ width: 3, color: colors[2], alpha: 0.9 });
        }
    }
}

function burst(
    stage: Container,
    particles: Particle[],
    x: number,
    y: number,
    colors: number[],
    count: number,
    size: number,
): void {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.4 + Math.random()) * size * 0.012;
        const shape = new Graphics();
        const color = colors[i % colors.length];
        const scale = size * (0.015 + Math.random() * 0.03);

        if (i % 3 === 0) {
            shape.ellipse(0, 0, scale * 1.6, scale * 0.7).fill(color); // leaf / shard
        } else if (i % 3 === 1) {
            shape.circle(0, 0, scale).fill(color); // spark / spore
        } else {
            shape
                .moveTo(-scale * 1.5, 0)
                .lineTo(scale * 1.5, 0)
                .stroke({ width: 2, color }); // streak / thorn
        }

        shape.position.set(x, y);
        stage.addChild(shape);
        particles.push({
            shape,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - size * 0.008,
            spin: (Math.random() - 0.5) * 0.3,
            life: 1,
        });
    }
}

function updateParticles(
    particles: Particle[],
    deltaMS: number,
    size: number,
): void {
    const step = deltaMS / 16.67;

    for (const particle of particles) {
        if (particle.life <= 0) {
            continue;
        }

        particle.vy += size * 0.0006 * step; // gravity
        particle.shape.x += particle.vx * step;
        particle.shape.y += particle.vy * step;
        particle.shape.rotation += particle.spin * step;
        particle.life -= 0.012 * step;
        particle.shape.alpha = Math.max(particle.life, 0);
    }
}

function clamp(value: number): number {
    return Math.min(Math.max(value, 0), 1);
}

function lerp(from: number, to: number, t: number): number {
    return from + (to - from) * t;
}

function easeOut(t: number): number {
    return 1 - (1 - t) ** 3;
}

function easeIn(t: number): number {
    return t ** 3;
}
