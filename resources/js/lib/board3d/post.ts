import { HalfFloatType, Vector2, WebGLRenderTarget } from 'three';
import type { PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import type { QualitySettings } from '@/lib/board3d/quality';

export type PostProcessing = {
    render: () => void;
    /**
     * Keep `point` sharp and blur what is nearer or further, by `amount`
     * (0 = off, 1 = full); null turns the blur off.
     */
    focusOn: (point: Vector3 | null, amount?: number) => void;
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

    if (quality.ambientOcclusion) {
        // Soft contact shadows in creases and where pieces meet the board.
        const occlusion = new GTAOPass(scene, camera, size.x, size.y);
        occlusion.updateGtaoMaterial({
            radius: 0.6,
            distanceExponent: 2,
            scale: 2.2,
        });
        occlusion.blendIntensity = 0.9;
        composer.addPass(occlusion);
    }

    if (quality.bloom) {
        // Only light brighter than this (the boosted glows) blooms.
        composer.addPass(new UnrealBloomPass(size.clone(), 0.75, 0.4, 3.2));
    }

    const depthOfField = quality.depthOfField
        ? new BokehPass(scene, camera, {
              focus: 10,
              aperture: 0,
              maxblur: 0.008,
          })
        : null;

    if (depthOfField) {
        // Keep the canvas see-through: the stock shader makes every pixel
        // opaque, which turns the page behind the board black.
        const shader = depthOfField.materialBokeh;
        shader.fragmentShader = shader.fragmentShader.replace(
            'gl_FragColor.a = 1.0;',
            '',
        );
        shader.needsUpdate = true;
        depthOfField.enabled = false;
        composer.addPass(depthOfField);
    }

    composer.addPass(new OutputPass());

    let focus: Vector3 | null = null;

    return {
        render() {
            if (depthOfField && focus) {
                depthOfField.materialBokeh.uniforms.focus.value =
                    camera.position.distanceTo(focus);
            }

            composer.render();
        },
        focusOn(point, amount = 1) {
            focus = point;

            if (depthOfField) {
                depthOfField.enabled = point !== null && amount > 0;
                depthOfField.materialBokeh.uniforms.aperture.value =
                    0.006 * amount;
            }
        },
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
