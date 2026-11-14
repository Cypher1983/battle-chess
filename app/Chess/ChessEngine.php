<?php

namespace App\Chess;

use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Enums\PieceColor;
use PChess\Chess\Chess;
use RuntimeException;

/**
 * The single source of truth for chess rules.
 *
 * Positions are rebuilt by replaying every move from the start, so the
 * full history is available for threefold repetition detection.
 */
final class ChessEngine
{
    /**
     * How often each position has occurred, keyed by the FEN without move counters.
     *
     * Tracked here because the library's own check ignores the current
     * position and so reports threefold repetition one move late.
     *
     * @var array<string, int>
     */
    private array $positionCounts = [];

    private function __construct(private readonly Chess $chess)
    {
        $this->recordPosition();
    }

    /**
     * Start a new game from the standard position.
     */
    public static function start(): self
    {
        return new self(new Chess);
    }

    /**
     * Rebuild a position by replaying moves in standard algebraic notation.
     *
     * @param  iterable<string>  $sanMoves
     */
    public static function replay(iterable $sanMoves): self
    {
        $engine = self::start();

        foreach ($sanMoves as $index => $san) {
            if ($engine->chess->move($san) === null) {
                throw new RuntimeException("Illegal move [{$san}] at index {$index} while replaying game.");
            }

            $engine->recordPosition();
        }

        return $engine;
    }

    /**
     * Apply a move, or return null if it is not legal in this position.
     *
     * Promotion moves must name the piece (q, r, b or n).
     */
    public function play(string $from, string $to, ?string $promotion = null): ?PlayedMove
    {
        $move = $this->chess->move([
            'from' => $from,
            'to' => $to,
            'promotion' => $promotion,
        ]);

        if ($move === null) {
            return null;
        }

        $this->recordPosition();

        return new PlayedMove(
            from: $move->from,
            to: $move->to,
            piece: $move->piece->getType(),
            san: (string) $move->san,
            fen: $this->chess->fen(),
            promotion: $move->promotion,
            captured: $move->captured,
        );
    }

    /**
     * The current position in Forsyth-Edwards Notation.
     */
    public function fen(): string
    {
        return $this->chess->fen();
    }

    /**
     * The side to move.
     */
    public function turn(): PieceColor
    {
        return PieceColor::from(explode(' ', $this->fen())[1]);
    }

    /**
     * Whether the side to move is in check.
     */
    public function inCheck(): bool
    {
        return $this->chess->inCheck();
    }

    /**
     * The result if the game is over by the rules of chess, otherwise null.
     */
    public function outcome(): ?GameOutcome
    {
        return match (true) {
            $this->chess->inCheckmate() => new GameOutcome(GameResult::winFor($this->turn()->opposite()), GameEndReason::Checkmate),
            $this->chess->inStalemate() => new GameOutcome(GameResult::Draw, GameEndReason::Stalemate),
            $this->chess->insufficientMaterial() => new GameOutcome(GameResult::Draw, GameEndReason::InsufficientMaterial),
            ($this->positionCounts[$this->positionKey()] ?? 0) >= 3 => new GameOutcome(GameResult::Draw, GameEndReason::ThreefoldRepetition),
            $this->chess->halfMovesExceeded() => new GameOutcome(GameResult::Draw, GameEndReason::FiftyMoveRule),
            default => null,
        };
    }

    /**
     * Count the current position towards threefold repetition.
     */
    private function recordPosition(): void
    {
        $key = $this->positionKey();

        $this->positionCounts[$key] = ($this->positionCounts[$key] ?? 0) + 1;
    }

    /**
     * The position identity: pieces, side to move, castling rights and en passant square.
     */
    private function positionKey(): string
    {
        return implode(' ', array_slice(explode(' ', $this->chess->fen()), 0, 4));
    }
}
