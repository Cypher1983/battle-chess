import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { Group, Plane, Raycaster, Vector2, Vector3 } from 'three';
import type { Object3D } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { PieceColor, PieceType } from '@/lib/armies';
import { playBattle } from '@/lib/board3d/battle';
import { createBoard } from '@/lib/board3d/board';
import { positionToSquare, squareToPosition } from '@/lib/board3d/coords';
import { createHighlights } from '@/lib/board3d/highlights';
import type { HighlightState } from '@/lib/board3d/highlights';
import { createPiece, disposePieceModels } from '@/lib/board3d/pieces';
import type { QualityChoice } from '@/lib/board3d/quality';
import { createStage, disposeObject } from '@/lib/board3d/stage';
import type { Stage } from '@/lib/board3d/stage';
import { easeIn, easeInOut, easeOut, Tweens } from '@/lib/board3d/tweens';

export { IMPACT_AT as BATTLE_IMPACT_AT } from '@/lib/board3d/battle';

export type BoardViewOptions = {
    orientation: PieceColor;
    /** Graphics level; "auto" lets the device decide. */
    quality?: QualityChoice;
    onSquareClick: (square: Square) => void;
};

/** The marks the caller controls; check is worked out from the position. */
export type Highlights = Pick<
    HighlightState,
    'lastMove' | 'selected' | 'targets' | 'focused'
>;

type Occupant = {
    color: PieceColor;
    type: PieceType;
};

type PlacedPiece = Occupant & {
    object: Group;
};

/**
 * The 3D chessboard: owns the three.js stage, the board and the pieces,
 * and keeps them in sync with the position it is given.
 */
export class BoardView {
    protected readonly stage: Stage;
    protected orientation: PieceColor;
    protected readonly options: BoardViewOptions;
    protected board: Group;
    protected readonly piecesLayer = new Group();
    protected pieces = new Map<Square, PlacedPiece>();
    protected readonly raycaster = new Raycaster();
    protected readonly surface = new Plane(new Vector3(0, 1, 0), 0);
    protected readonly highlights = createHighlights();
    protected marks: Highlights = {
        lastMove: null,
        selected: null,
        targets: [],
        focused: null,
    };
    protected checkedKing: Square | null = null;
    protected pressedAt: { x: number; y: number } | null = null;
    protected readonly removeListeners: () => void;
    protected readonly tweens = new Tweens();
    protected readonly controls: OrbitControls;
    protected battling = false;
    /** Ends the running battle early. */
    protected battleAbort: AbortController | null = null;
    /** A position that arrived during a battle, shown when it ends. */
    protected queuedFen: string | null = null;

    constructor(host: HTMLElement, options: BoardViewOptions) {
        this.options = options;
        this.orientation = options.orientation;
        this.stage = createStage(host, options.quality);

        this.board = createBoard(this.orientation);
        this.stage.scene.add(this.board);
        this.stage.scene.add(this.highlights.group);
        this.stage.scene.add(this.piecesLayer);

        this.controls = new OrbitControls(
            this.stage.camera,
            this.stage.renderer.domElement,
        );
        // The board keeps each player's fixed view: zoom only, no turning.
        this.controls.enableRotate = false;
        this.controls.enablePan = false;
        this.controls.enableDamping = true;
        this.controls.minDistance = 9;
        this.controls.maxDistance = 21;

        this.placeCamera();
        this.removeListeners = this.listen(this.stage.renderer.domElement);
        this.stage.onFrame((_delta, now) => {
            const animating = this.tweens.busy;
            this.tweens.tick(now);

            // During a battle the battle moves the camera, not the controls.
            const turned = this.controls.enabled && this.controls.update();

            return animating || turned;
        });
    }

    /**
     * Show the position described by a FEN string. Pieces that moved slide
     * to their new squares, captured pieces sink away and promoted pawns
     * change shape when they arrive. The first position appears at once.
     */
    setPosition(fen: string): void {
        if (this.battling) {
            // A newer position ends the battle; it is shown when it does.
            this.queuedFen = fen;
            this.battleAbort?.abort();

            return;
        }

        this.tweens.finishAll();

        const next = readPosition(fen);
        const animate = this.pieces.size > 0 && !prefersReducedMotion();
        this.checkedKing = findCheckedKing(fen);

        const vacated = new Map<Square, PlacedPiece>();
        const arrived = new Map<Square, Occupant>();

        for (const [square, placed] of this.pieces) {
            const wanted = next.get(square);

            if (!wanted || !sameOccupant(wanted, placed)) {
                vacated.set(square, placed);
                this.pieces.delete(square);
            }
        }

        for (const [square, occupant] of next) {
            if (!this.pieces.has(square)) {
                arrived.set(square, occupant);
            }
        }

        for (const [square, occupant] of arrived) {
            // The piece that went there: same kind first, else a promoting pawn.
            const from =
                closest(square, vacated, (placed) =>
                    sameOccupant(placed, occupant),
                ) ??
                closest(
                    square,
                    vacated,
                    (placed) =>
                        placed.color === occupant.color && placed.type === 'p',
                );

            if (from) {
                const placed = vacated.get(from)!;
                vacated.delete(from);
                this.pieces.set(square, placed);
                this.slide(placed, from, square, occupant, animate);
            } else {
                const placed = this.addPiece(
                    square,
                    occupant.color,
                    occupant.type,
                );
                this.growIn(placed.object, animate);
            }
        }

        for (const placed of vacated.values()) {
            this.sinkAway(placed.object, animate);
        }

        this.refreshHighlights();
    }

    /**
     * Fight out the capture that leads to `fen`, then show that position.
     * The attacker is the piece on `from`; the defender is the enemy piece
     * that the new position no longer has (so en passant works too).
     * Resolves when the battle ends or is skipped via `signal`.
     */
    async playBattle(
        fen: string,
        move: { from: Square; to: Square },
        options: {
            signal?: AbortSignal;
            onProgress?: (elapsedMs: number) => void;
        } = {},
    ): Promise<void> {
        this.tweens.finishAll();

        const next = readPosition(fen);
        const attacker = this.pieces.get(move.from);
        let defenderSquare: Square | null = null;

        for (const [square, placed] of this.pieces) {
            const wanted = next.get(square);

            if (
                attacker &&
                placed.color !== attacker.color &&
                (!wanted || !sameOccupant(wanted, placed))
            ) {
                defenderSquare = square;
            }
        }

        const defender = defenderSquare
            ? this.pieces.get(defenderSquare)
            : null;

        if (!attacker || !defenderSquare || !defender) {
            // The board isn't showing the position before this capture.
            this.setPosition(fen);

            return;
        }

        this.battling = true;
        this.highlights.group.visible = false;
        this.battleAbort = new AbortController();
        const signal = options.signal
            ? AbortSignal.any([options.signal, this.battleAbort.signal])
            : this.battleAbort.signal;

        try {
            await playBattle(
                { stage: this.stage, controls: this.controls },
                {
                    attacker: {
                        ...attacker,
                        position: attacker.object.position.clone(),
                    },
                    defender: {
                        ...defender,
                        position: defender.object.position.clone(),
                    },
                    destination: squareToPosition(move.to),
                    bystanders: [...this.pieces.values()]
                        .filter(
                            (placed) =>
                                placed !== attacker && placed !== defender,
                        )
                        .map((placed) => placed.object),
                    onProgress: options.onProgress,
                    signal,
                },
            );
        } finally {
            // The battle left the attacker on its new square, the defender gone.
            this.pieces.delete(move.from);
            this.pieces.delete(defenderSquare);
            this.pieces.set(move.to, attacker);
            this.battling = false;
            this.battleAbort = null;
            this.highlights.group.visible = true;
            const latest = this.queuedFen ?? fen;
            this.queuedFen = null;
            this.setPosition(latest);
        }
    }

    setHighlights(marks: Partial<Highlights>): void {
        this.marks = { ...this.marks, ...marks };
        this.refreshHighlights();
    }

    setOrientation(orientation: PieceColor): void {
        if (orientation === this.orientation) {
            return;
        }

        this.orientation = orientation;
        this.stage.scene.remove(this.board);
        disposeObject(this.board);
        this.board = createBoard(orientation);
        this.stage.scene.add(this.board);
        this.placeCamera();
    }

    /**
     * The square under a point on screen (client coordinates). A piece
     * counts as standing on its square, even where it overlaps the square
     * behind it.
     */
    squareAt(clientX: number, clientY: number): Square | null {
        const canvas = this.stage.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const pointer = new Vector2(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            -((clientY - rect.top) / rect.height) * 2 + 1,
        );
        this.raycaster.setFromCamera(pointer, this.stage.camera);

        const [hit] = this.raycaster.intersectObjects(
            this.piecesLayer.children,
            true,
        );

        if (hit) {
            const square = this.squareOf(hit.object);

            if (square) {
                return square;
            }
        }

        const point = this.raycaster.ray.intersectPlane(
            this.surface,
            new Vector3(),
        );

        return point ? positionToSquare(point.x, point.z) : null;
    }

    dispose(): void {
        this.battleAbort?.abort();
        this.removeListeners();
        this.controls.dispose();
        this.tweens.finishAll();
        this.stage.dispose();
        disposePieceModels();
    }

    protected addPiece(
        square: Square,
        color: PieceColor,
        type: PieceType,
    ): PlacedPiece {
        const object = createPiece(color, type);
        object.position.copy(squareToPosition(square));
        this.piecesLayer.add(object);

        const placed = { color, type, object };
        this.pieces.set(square, placed);

        return placed;
    }

    /** Move a piece along a low arc (knights hop higher). */
    protected slide(
        placed: PlacedPiece,
        from: Square,
        to: Square,
        becomes: Occupant,
        animate: boolean,
    ): void {
        const start = squareToPosition(from);
        const end = squareToPosition(to);
        const distance = start.distanceTo(end);
        const height = placed.type === 'n' ? 0.9 : 0.15 + distance * 0.05;
        const object = placed.object;

        this.tweens.add(
            animate ? 260 + distance * 45 : 0,
            (t) => {
                const eased = easeInOut(t);
                object.position.lerpVectors(start, end, eased);
                object.position.y = Math.sin(Math.PI * eased) * height;
            },
            () => {
                if (becomes.type !== placed.type) {
                    this.piecesLayer.remove(object);
                    const promoted = this.addPiece(
                        to,
                        becomes.color,
                        becomes.type,
                    );
                    this.growIn(promoted.object, animate);
                }
            },
        );
    }

    /** A captured piece shrinks into the board, just as the attacker lands. */
    protected sinkAway(object: Group, animate: boolean): void {
        this.tweens.add(
            animate ? 300 : 0,
            (t) => {
                const eased = easeIn(t);
                object.scale.setScalar(1 - eased);
                object.position.y = -0.3 * eased;
                object.rotation.z = 0.6 * eased;
            },
            () => this.piecesLayer.remove(object),
            animate ? 220 : 0,
        );
    }

    protected growIn(object: Group, animate: boolean): void {
        if (!animate) {
            return;
        }

        object.scale.setScalar(0.001);
        this.tweens.add(260, (t) =>
            object.scale.setScalar(Math.max(easeOut(t), 0.001)),
        );
    }

    protected refreshHighlights(): void {
        this.stage.invalidate();
        this.highlights.update({
            ...this.marks,
            occupied: new Set(this.pieces.keys()),
            check: this.checkedKing,
        });
    }

    /** The square of the piece that `object` is part of. */
    protected squareOf(object: Object3D): Square | null {
        let node: Object3D | null = object;

        while (node && node.parent !== this.piecesLayer) {
            node = node.parent;
        }

        for (const [square, placed] of this.pieces) {
            if (placed.object === node) {
                return square;
            }
        }

        return null;
    }

    /**
     * Clicks select squares; a press that moves more than a few pixels is
     * a drag (e.g. a pinch to zoom), not a click.
     */
    protected listen(canvas: HTMLCanvasElement): () => void {
        const down = (event: PointerEvent): void => {
            this.pressedAt = { x: event.clientX, y: event.clientY };
        };

        const up = (event: PointerEvent): void => {
            const start = this.pressedAt;
            this.pressedAt = null;

            if (
                this.battling ||
                !start ||
                Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
            ) {
                return;
            }

            const square = this.squareAt(event.clientX, event.clientY);

            if (square) {
                this.options.onSquareClick(square);
            }
        };

        const move = (event: PointerEvent): void => {
            if (event.buttons === 0) {
                canvas.style.cursor = this.squareAt(
                    event.clientX,
                    event.clientY,
                )
                    ? 'pointer'
                    : '';
            }
        };

        canvas.addEventListener('pointerdown', down);
        canvas.addEventListener('pointerup', up);
        canvas.addEventListener('pointermove', move);

        return () => {
            canvas.removeEventListener('pointerdown', down);
            canvas.removeEventListener('pointerup', up);
            canvas.removeEventListener('pointermove', move);
        };
    }

    /** Glide the camera back to its starting view. */
    resetCamera(): void {
        const camera = this.stage.camera;
        const fromPosition = camera.position.clone();
        const fromTarget = this.controls.target.clone();
        const { position, target } = this.homeView();

        this.tweens.add(prefersReducedMotion() ? 0 : 600, (t) => {
            const eased = easeInOut(t);
            camera.position.lerpVectors(fromPosition, position, eased);
            this.controls.target.lerpVectors(fromTarget, target, eased);
        });
    }

    /** Behind the player's own army, looking down at the board. */
    protected homeView(): { position: Vector3; target: Vector3 } {
        const side = this.orientation === 'w' ? 1 : -1;

        return {
            position: new Vector3(0, 13.2, 10.6 * side),
            target: new Vector3(0, -0.4, 0.7 * side),
        };
    }

    protected placeCamera(): void {
        this.stage.invalidate();
        const { position, target } = this.homeView();
        this.stage.camera.position.copy(position);
        this.controls.target.copy(target);
        this.controls.update();
    }
}

function readPosition(fen: string): Map<Square, Occupant> {
    const position = new Map<Square, Occupant>();

    for (const row of new Chess(fen).board()) {
        for (const piece of row) {
            if (piece) {
                position.set(piece.square, {
                    color: piece.color,
                    type: piece.type,
                });
            }
        }
    }

    return position;
}

/** The square of the king to move, if it is in check. */
function findCheckedKing(fen: string): Square | null {
    const chess = new Chess(fen);

    if (!chess.inCheck()) {
        return null;
    }

    for (const row of chess.board()) {
        for (const piece of row) {
            if (piece?.type === 'k' && piece.color === chess.turn()) {
                return piece.square;
            }
        }
    }

    return null;
}

function sameOccupant(a: Occupant, b: Occupant): boolean {
    return a.color === b.color && a.type === b.type;
}

/** The nearest square in `candidates` to `square` whose piece matches. */
function closest(
    square: Square,
    candidates: Map<Square, PlacedPiece>,
    matches: (placed: PlacedPiece) => boolean,
): Square | null {
    const target = squareToPosition(square);
    let best: Square | null = null;
    let bestDistance = Infinity;

    for (const [candidate, placed] of candidates) {
        const distance = squareToPosition(candidate).distanceTo(target);

        if (matches(placed) && distance < bestDistance) {
            best = candidate;
            bestDistance = distance;
        }
    }

    return best;
}

function prefersReducedMotion(): boolean {
    return (
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    );
}
