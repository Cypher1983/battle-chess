/**
 * Small synthesized sound effects (Web Audio API), so no audio files or
 * licences are needed. Every function is a no-op when audio is unavailable.
 */

let context: AudioContext | null = null;

function audio(): AudioContext | null {
    if (typeof window === 'undefined' || !('AudioContext' in window)) {
        return null;
    }

    context ??= new AudioContext();

    if (context.state === 'suspended') {
        void context.resume();
    }

    return context;
}

type ToneOptions = {
    frequency: number;
    endFrequency?: number;
    type?: OscillatorType;
    start?: number;
    duration: number;
    volume?: number;
};

function tone(ctx: AudioContext, options: ToneOptions): void {
    const start = ctx.currentTime + (options.start ?? 0);
    const end = start + options.duration;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = options.type ?? 'sine';
    oscillator.frequency.setValueAtTime(options.frequency, start);

    if (options.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(
            options.endFrequency,
            end,
        );
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(options.volume ?? 0.2, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
}

function noise(
    ctx: AudioContext,
    duration: number,
    volume: number,
    cutoff: number,
): void {
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    gain.gain.value = volume;

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
}

/** A wooden "tock" for a quiet move. */
export function playMoveSound(): void {
    const ctx = audio();

    if (ctx) {
        tone(ctx, {
            frequency: 520,
            endFrequency: 180,
            type: 'triangle',
            duration: 0.09,
            volume: 0.25,
        });
        noise(ctx, 0.03, 0.15, 3000);
    }
}

/** A heavy thump with debris for a capture landing. */
export function playImpactSound(): void {
    const ctx = audio();

    if (ctx) {
        tone(ctx, {
            frequency: 140,
            endFrequency: 45,
            type: 'sine',
            duration: 0.35,
            volume: 0.5,
        });
        noise(ctx, 0.3, 0.35, 1200);
    }
}

/** A bright two-tone warning for check. */
export function playCheckSound(): void {
    const ctx = audio();

    if (ctx) {
        tone(ctx, {
            frequency: 880,
            type: 'square',
            duration: 0.12,
            volume: 0.08,
        });
        tone(ctx, {
            frequency: 1320,
            type: 'square',
            start: 0.12,
            duration: 0.18,
            volume: 0.08,
        });
    }
}

/** A short fanfare, lament or neutral chord when the game ends. */
export function playGameOverSound(outcome: 'win' | 'loss' | 'draw'): void {
    const ctx = audio();

    if (!ctx) {
        return;
    }

    const notes = {
        win: [523.25, 659.25, 783.99, 1046.5],
        loss: [392, 349.23, 311.13, 261.63],
        draw: [440, 554.37, 440],
    }[outcome];

    notes.forEach((frequency, index) => {
        tone(ctx, {
            frequency,
            type: 'triangle',
            start: index * 0.14,
            duration: 0.3,
            volume: 0.18,
        });
    });
}
