import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { Group, Plane, Raycaster, Vector2, Vector3 } from 'three';
import type { Object3D } from 'three';
import type { PieceColor, PieceType } from '@/lib/armies';
import { createBoard } from '@/lib/board3d/board';
import { positionToSquare, squareToPosition } from '@/lib/board3d/coords';
import { createHighlights } from '@/lib/board3d/highlights';
import type { HighlightState } from '@/lib/board3d/highlights';
import { createPiece, disposePieceModels } from '@/lib/board3d/pieces';
import { createStage, disposeObject } from '@/lib/board3d/stage';
import type { Stage } from '@/lib/board3d/stage';

export type BoardViewOptions = {
    orientation: PieceColor;
    onSquareClick: (square: Square) => void;
};

/** The marks the caller controls; check is worked out from the position. */
export type Highlights = Pick<
    HighlightState,
    'lastMove' | 'selected' | 'targets' | 'focused'
>;

type PlacedPiece = {
    color: PieceColor;
    type: PieceType;
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

    constructor(host: HTMLElement, options: BoardViewOptions) {
        this.options = options;
        this.orientation = options.orientation;
        this.stage = createStage(host);

        this.board = createBoard(this.orientation);
        this.stage.scene.add(this.board);
        this.stage.scene.add(this.highlights.group);
        this.stage.scene.add(this.piecesLayer);

        this.placeCamera();
        this.removeListeners = this.listen(this.stage.renderer.domElement);
    }

    /** Show the position described by a FEN string. */
    setPosition(fen: string): void {
        const next = readPosition(fen);
        this.checkedKing = findCheckedKing(fen);

        for (const [square, placed] of this.pieces) {
            const wanted = next.get(square);

            if (
                !wanted ||
                wanted.color !== placed.color ||
                wanted.type !== placed.type
            ) {
                this.removePiece(square);
            }
        }

        for (const [square, { color, type }] of next) {
            if (!this.pieces.has(square)) {
                this.addPiece(square, color, type);
            }
        }

        this.refreshHighlights();
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
        this.removeListeners();
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

    protected removePiece(square: Square): void {
        const placed = this.pieces.get(square);

        if (placed) {
            this.piecesLayer.remove(placed.object);
            this.pieces.delete(square);
        }
    }

    protected refreshHighlights(): void {
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
     * a drag (to turn the camera), not a click.
     */
    protected listen(canvas: HTMLCanvasElement): () => void {
        const down = (event: PointerEvent): void => {
            this.pressedAt = { x: event.clientX, y: event.clientY };
        };

        const up = (event: PointerEvent): void => {
            const start = this.pressedAt;
            this.pressedAt = null;

            if (
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

    /** Look at the board from behind the player's own army. */
    protected placeCamera(): void {
        const side = this.orientation === 'w' ? 1 : -1;
        this.stage.camera.position.set(0, 11.5, 8.5 * side);
        this.stage.camera.lookAt(0, 0, 0.5 * side);
    }
}

function readPosition(
    fen: string,
): Map<Square, { color: PieceColor; type: PieceType }> {
    const position = new Map<Square, { color: PieceColor; type: PieceType }>();

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
