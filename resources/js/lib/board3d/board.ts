import {
    BoxGeometry,
    CanvasTexture,
    Group,
    Mesh,
    MeshStandardMaterial,
    PlaneGeometry,
    SRGBColorSpace,
} from 'three';
import type { PieceColor } from '@/lib/armies';
import { FILES } from '@/lib/board3d/coords';
import type { BoardTheme } from '@/lib/boardThemes';

/** Pixels per board unit in the board texture. */
const UNIT = 128;

/** The width of the frame round the squares, in units (squares). */
const BORDER = 0.5;

/** The board plus its frame, in units. */
const SIZE = 8 + BORDER * 2;

/**
 * The chessboard: a block in the colours of `theme` whose top is painted
 * with the squares and, on the frame, the file and rank letters (turned to
 * face `orientation`).
 */
export function createBoard(orientation: PieceColor, theme: BoardTheme): Group {
    const board = new Group();
    board.name = 'board';

    const texture = new CanvasTexture(paintBoard(orientation, theme));
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;

    const top = new Mesh(
        new PlaneGeometry(SIZE, SIZE),
        new MeshStandardMaterial({ map: texture, ...theme.finish }),
    );
    top.rotation.x = -Math.PI / 2;
    top.position.y = 0.001;
    top.receiveShadow = true;
    board.add(top);

    const sides = new MeshStandardMaterial({
        color: theme.frame,
        roughness: Math.min(theme.finish.roughness + 0.15, 1),
        metalness: theme.finish.metalness,
    });

    const block = new Mesh(new BoxGeometry(SIZE, 0.4, SIZE), sides);
    block.position.y = -0.2;
    block.castShadow = true;
    block.receiveShadow = true;
    board.add(block);

    const plinth = new Mesh(
        new BoxGeometry(SIZE + 0.4, 0.2, SIZE + 0.4),
        new MeshStandardMaterial({ color: theme.plinth, roughness: 0.8 }),
    );
    plinth.position.y = -0.5;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    board.add(plinth);

    return board;
}

function paintBoard(
    orientation: PieceColor,
    theme: BoardTheme,
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE * UNIT;
    canvas.height = SIZE * UNIT;
    const ctx = canvas.getContext('2d')!;

    // Frame with a little grain.
    ctx.fillStyle = theme.frame;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    grain(
        ctx,
        0,
        0,
        canvas.width,
        canvas.height,
        theme.grain.frame,
        theme.grain.lines,
    );

    // Squares. Canvas row 0 is rank 8 (the far side for white).
    for (let file = 0; file < 8; file++) {
        for (let rank = 0; rank < 8; rank++) {
            const x = (BORDER + file) * UNIT;
            const y = (BORDER + 7 - rank) * UNIT;
            const light = (file + rank) % 2 === 1;
            ctx.fillStyle = light ? theme.light : theme.dark;
            ctx.fillRect(x, y, UNIT, UNIT);
            grain(
                ctx,
                x,
                y,
                UNIT,
                UNIT,
                light ? theme.grain.light : theme.grain.dark,
                theme.grain.lines > 0 ? 10 : 0,
            );
        }
    }

    // Gold trim between the squares and the frame.
    ctx.strokeStyle = theme.trim;
    ctx.lineWidth = 6;
    const edge = BORDER * UNIT;
    ctx.strokeRect(edge - 3, edge - 3, 8 * UNIT + 6, 8 * UNIT + 6);
    ctx.lineWidth = 2;
    const inset = UNIT * 0.08;
    ctx.strokeRect(
        inset,
        inset,
        SIZE * UNIT - inset * 2,
        SIZE * UNIT - inset * 2,
    );

    // Coordinates on the frame, turned to read from the player's side.
    ctx.fillStyle = theme.label;
    ctx.font = `600 ${UNIT * 0.26}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const turn = orientation === 'b' ? Math.PI : 0;

    // Centred in the frame, nudged in a little past the outer line.
    const near = (BORDER / 2 + 0.03) * UNIT;
    const far = SIZE * UNIT - near;

    FILES.forEach((letter, file) => {
        const x = (BORDER + 0.5 + file) * UNIT;
        label(ctx, letter, x, near, turn);
        label(ctx, letter, x, far, turn);
    });

    for (let rank = 0; rank < 8; rank++) {
        const y = (BORDER + 7.5 - rank) * UNIT;
        label(ctx, String(rank + 1), near, y, turn);
        label(ctx, String(rank + 1), far, y, turn);
    }

    return canvas;
}

function label(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    angle: number,
): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillText(text, 0, 0);
    ctx.restore();
}

/** Thin wavy streaks that read as wood grain. Deterministic per area. */
function grain(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    colour: string,
    lines: number,
): void {
    let seed = (x * 31 + y * 17) % 997;
    const random = (): number => {
        seed = (seed * 9301 + 49297) % 233280;

        return seed / 233280;
    };

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.5;

    for (let i = 0; i < lines; i++) {
        const startY = y + random() * height;
        const wave = 2 + random() * 4;
        ctx.beginPath();
        ctx.moveTo(x, startY);

        for (let step = 0; step <= width; step += 16) {
            ctx.lineTo(
                x + step,
                startY + Math.sin((step + i * 13) / 40) * wave,
            );
        }

        ctx.stroke();
    }

    ctx.restore();
}
