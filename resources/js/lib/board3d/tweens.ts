type Tween = {
    start: number;
    duration: number;
    update: (t: number) => void;
    done?: () => void;
};

/** Smooth start and end. */
export function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export function easeOut(t: number): number {
    return 1 - (1 - t) ** 3;
}

export function easeIn(t: number): number {
    return t * t * t;
}

export function lerp(from: number, to: number, t: number): number {
    return from + (to - from) * t;
}

export function clamp01(t: number): number {
    return Math.min(Math.max(t, 0), 1);
}

/**
 * Time-based animations driven by the render loop. `update` gets progress
 * from 0 to 1; `done` runs once at the end, or when animations are
 * finished early.
 */
export class Tweens {
    protected readonly running = new Set<Tween>();
    protected now = performance.now();

    add(
        duration: number,
        update: (t: number) => void,
        done?: () => void,
        delay = 0,
    ): void {
        const tween = { start: this.now + delay, duration, update, done };

        if (duration <= 0 && delay <= 0) {
            update(1);
            done?.();

            return;
        }

        this.running.add(tween);
    }

    /** Advance every animation to the time `now` (ms). */
    tick(now: number): void {
        this.now = now;

        for (const tween of this.running) {
            if (now < tween.start) {
                continue;
            }

            const t = clamp01((now - tween.start) / tween.duration);
            tween.update(t);

            if (t >= 1) {
                this.running.delete(tween);
                tween.done?.();
            }
        }
    }

    /** Jump every animation to its end. */
    finishAll(): void {
        while (this.running.size > 0) {
            const tweens = [...this.running];
            this.running.clear();

            for (const tween of tweens) {
                tween.update(1);
                tween.done?.();
            }
        }
    }

    get busy(): boolean {
        return this.running.size > 0;
    }
}
