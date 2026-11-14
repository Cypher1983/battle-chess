import { HalfFloatType, Vector2, WebGLRenderTarget } from 'three';
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import type { QualitySettings } from '@/lib/board3d/quality';

export type PostProcessing = {
    render: () => void;
    setSize: (width: number, height: number) => void;
    dispose: () => void;
};

/**
 * Draw the scene through a chain of screen effects. The scene is rendered
 * into a multisampled, high-dynamic-range target (smooth edges, and glows
 * brighter than white for bloom), then tone-mapped to the screen.
 */
export function createPostProcessing(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    quality: QualitySettings,
): PostProcessing {
    const size = renderer.getDrawingBufferSize(new Vector2());
    const target = new WebGLRenderTarget(size.x, size.y, {
        type: HalfFloatType,
        samples: 4,
    });

    const composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new OutputPass());

    return {
        render: () => composer.render(),
        setSize(width, height) {
            composer.setPixelRatio(
                Math.min(window.devicePixelRatio, quality.maxPixelRatio),
            );
            composer.setSize(width, height);
        },
        dispose() {
            composer.dispose();
            target.dispose();
        },
    };
}
