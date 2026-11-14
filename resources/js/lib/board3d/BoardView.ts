import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { Group } from 'three';
import type { PieceColor, PieceType } from '@/lib/armies';
import { createBoard } from '@/lib/board3d/board';
import { squareToPosition } from '@/lib/board3d/coords';
import { createPiece, disposePieceModels } from '@/lib/board3d/pieces';
import { createStage, disposeObject } from '@/lib/board3d/stage';
import type { Stage } from '@/lib/board3d/stage';

export type BoardViewOptions = {
    orientation: PieceColor;
    onSquareClick: (square: Square) => void;
};

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

    constructor(host: HTMLElement, options: BoardViewOptions) {
        this.options = options;
        this.orientation = options.orientation;
        this.stage = createStage(host);

        this.board = createBoard(this.orientation);
        this.stage.scene.add(this.board);
        this.stage.scene.add(this.piecesLayer);

        this.placeCamera();
    }

    /** Show the position described by a FEN string. */
    setPosition(fen: string): void {
        const next = readPosition(fen);

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

    dispose(): void {
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
