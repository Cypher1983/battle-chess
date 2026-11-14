import {
    ACESFilmicToneMapping,
    DirectionalLight,
    HemisphereLight,
    Mesh,
    PCFShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    PMREMGenerator,
    Scene,
    ShadowMaterial,
    SRGBColorSpace,
    Texture,
    WebGLRenderer,
} from 'three';
import type { Object3D } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Called every frame with the time (ms) since the previous frame. */
export type FrameCallback = (deltaMs: number, now: number) => void;

export type Stage = {
    renderer: WebGLRenderer;
    scene: Scene;
    camera: PerspectiveCamera;
    /** Run a callback every frame. Returns a function that removes it. */
    onFrame: (callback: FrameCallback) => () => void;
    dispose: () => void;
};

/**
 * The 3D stage the board sits on: a renderer filling `host`, a camera,
 * warm lighting with soft shadows, and a render loop. The canvas keeps
 * the size of its host element.
 */
export function createStage(host: HTMLElement): Stage {
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.appendChild(renderer.domElement);

    const scene = new Scene();

    // A soft studio for metal and varnish to reflect.
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    scene.environment = pmrem.fromScene(room, 0.04).texture;
    scene.environmentIntensity = 0.45;
    room.dispose();
    pmrem.dispose();
    const camera = new PerspectiveCamera(38, 1, 0.1, 100);

    scene.add(new HemisphereLight(0xfff4e0, 0x3a2a1c, 1.4));

    const sun = new DirectionalLight(0xfff0d6, 2.4);
    sun.position.set(-4, 12, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -7;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 30;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);

    const rim = new DirectionalLight(0xbfd8ff, 0.6);
    rim.position.set(5, 6, -8);
    scene.add(rim);

    // A see-through floor that only shows the board's shadow.
    const floor = new Mesh(
        new PlaneGeometry(40, 40),
        new ShadowMaterial({ opacity: 0.25 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.6;
    floor.receiveShadow = true;
    scene.add(floor);

    function resize(): void {
        const width = Math.max(host.clientWidth, 1);
        const height = Math.max(host.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const callbacks = new Set<FrameCallback>();
    let previous = performance.now();

    renderer.setAnimationLoop((now: number) => {
        const delta = Math.min(now - previous, 100);
        previous = now;
        callbacks.forEach((callback) => callback(delta, now));
        renderer.render(scene, camera);
    });

    return {
        renderer,
        scene,
        camera,
        onFrame(callback) {
            callbacks.add(callback);

            return () => callbacks.delete(callback);
        },
        dispose() {
            renderer.setAnimationLoop(null);
            observer.disconnect();
            callbacks.clear();
            disposeObject(scene);
            scene.environment?.dispose();
            renderer.dispose();
            renderer.domElement.remove();
        },
    };
}

/**
 * Free the GPU memory (geometries, materials, textures) of an object and
 * everything inside it. Shared materials may be disposed more than once,
 * which three.js allows.
 */
export function disposeObject(root: Object3D): void {
    root.traverse((object) => {
        if (!(object instanceof Mesh)) {
            return;
        }

        object.geometry.dispose();

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

        materials.forEach((material) => {
            Object.values(material).forEach((value) => {
                if (value instanceof Texture) {
                    value.dispose();
                }
            });
            material.dispose();
        });
    });
}
