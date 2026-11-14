import type { WebGLRenderer } from 'three';

export type Quality = 'low' | 'high' | 'ultra';

/** What the player picked: a level, or "auto" to let the device decide. */
export type QualityChoice = Quality | 'auto';

export type QualitySettings = {
    quality: Quality;
    /** Highest device pixel ratio to draw at (3 = sharp on 4K screens). */
    maxPixelRatio: number;
    shadowMapSize: number;
    /** Blur of shadow edges, in shadow-map texels. */
    shadowRadius: number;
    /** Draw through the post-processing pipeline (needed for the effects). */
    postProcessing: boolean;
    bloom: boolean;
    ambientOcclusion: boolean;
    /** Blur the background during battles. */
    depthOfField: boolean;
};

export const QUALITY_LEVELS: Record<Quality, QualitySettings> = {
    low: {
        quality: 'low',
        maxPixelRatio: 1.5,
        shadowMapSize: 1024,
        shadowRadius: 1,
        postProcessing: false,
        bloom: false,
        ambientOcclusion: false,
        depthOfField: false,
    },
    high: {
        quality: 'high',
        maxPixelRatio: 2,
        shadowMapSize: 2048,
        shadowRadius: 3,
        postProcessing: true,
        bloom: true,
        ambientOcclusion: false,
        depthOfField: true,
    },
    ultra: {
        quality: 'ultra',
        maxPixelRatio: 3,
        shadowMapSize: 4096,
        shadowRadius: 4,
        postProcessing: true,
        bloom: true,
        ambientOcclusion: true,
        depthOfField: true,
    },
};

/**
 * The settings for a choice. "auto" picks low for software rendering (no
 * graphics card, e.g. in automated tests) and small touch devices, and
 * high otherwise; ultra is only ever chosen by the player.
 */
export function resolveQuality(
    choice: QualityChoice,
    renderer: WebGLRenderer,
): QualitySettings {
    if (choice !== 'auto') {
        return QUALITY_LEVELS[choice];
    }

    const gl = renderer.getContext();
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(
        gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
    );
    const software = /swiftshader|llvmpipe|software|basic render/i.test(name);
    const smallTouch =
        window.matchMedia?.('(pointer: coarse)').matches === true &&
        Math.min(window.screen.width, window.screen.height) < 768;

    return QUALITY_LEVELS[software || smallTouch ? 'low' : 'high'];
}
