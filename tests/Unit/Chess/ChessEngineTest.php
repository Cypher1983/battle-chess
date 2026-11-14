<?php

namespace Tests\Unit\Chess;

use App\Chess\ChessEngine;
use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Enums\PieceColor;
use App\Models\Game;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class ChessEngineTest extends TestCase
{
    public function test_a_new_game_starts_from_the_standard_position()
    {
        $engine = ChessEngine::start();

        $this->assertSame(Game::START_FEN, $engine->fen());
        $this->assertSame(PieceColor::White, $engine->turn());
        $this->assertNull($engine->outcome());
    }

    public function test_legal_moves_are_applied()
    {
        $engine = ChessEngine::start();

        $move = $engine->play('e2', 'e4');

        $this->assertNotNull($move);
        $this->assertSame('e4', $move->san);
        $this->assertSame('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', $move->fen);
        $this->assertSame(PieceColor::Black, $engine->turn());
    }

    public function test_illegal_moves_are_rejected_without_changing_the_position()
    {
        $engine = ChessEngine::start();

        $this->assertNull($engine->play('e2', 'e5'));
        $this->assertNull($engine->play('e7', 'e5'));
        $this->assertSame(Game::START_FEN, $engine->fen());
    }

    public function test_captures_report_the_captured_piece()
    {
        $engine = ChessEngine::replay(['e4', 'd5']);

        $move = $engine->play('e4', 'd5');

        $this->assertSame('exd5', $move?->san);
        $this->assertSame('p', $move->piece);
        $this->assertSame('p', $move->captured);
    }

    public function test_replay_rebuilds_a_position()
    {
        $engine = ChessEngine::replay(['e4', 'e5', 'Nf3']);

        $this->assertSame(PieceColor::Black, $engine->turn());
        $this->assertSame('rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2', $engine->fen());
    }

    public function test_replay_rejects_corrupt_history()
    {
        $this->expectException(RuntimeException::class);

        ChessEngine::replay(['e4', 'e4']);
    }

    public function test_checkmate_ends_the_game_for_the_side_that_delivered_it()
    {
        $engine = ChessEngine::replay(['f3', 'e5', 'g4']);

        $engine->play('d8', 'h4');

        $outcome = $engine->outcome();
        $this->assertSame(GameResult::BlackWins, $outcome?->result);
        $this->assertSame(GameEndReason::Checkmate, $outcome->reason);
    }

    public function test_promotion_requires_choosing_a_piece()
    {
        $engine = ChessEngine::replay(['h4', 'g5', 'hxg5', 'Nf6', 'g6', 'Ng8', 'g7', 'Nf6']);

        $this->assertNull($engine->play('g7', 'h8'));

        $move = $engine->play('g7', 'h8', 'n');
        $this->assertSame('gxh8=N', $move?->san);
        $this->assertSame('n', $move->promotion);
    }

    public function test_stalemate_is_a_draw()
    {
        // Sam Loyd's ten-move stalemate.
        $engine = ChessEngine::replay([
            'e3', 'a5', 'Qh5', 'Ra6', 'Qxa5', 'h5', 'h4', 'Rah6', 'Qxc7', 'f6',
            'Qxd7+', 'Kf7', 'Qxb7', 'Qd3', 'Qxb8', 'Qh7', 'Qxc8', 'Kg6',
        ]);

        $engine->play('c8', 'e6');

        $this->assertSame(GameEndReason::Stalemate, $engine->outcome()?->reason);
        $this->assertSame(GameResult::Draw, $engine->outcome()->result);
    }

    public function test_threefold_repetition_is_a_draw()
    {
        $engine = ChessEngine::replay(['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1']);

        $engine->play('f6', 'g8');

        $this->assertSame(GameEndReason::ThreefoldRepetition, $engine->outcome()?->reason);
    }

    public function test_check_is_detected()
    {
        $engine = ChessEngine::replay(['e4', 'f5', 'Qh5+']);

        $this->assertTrue($engine->inCheck());
        $this->assertNull($engine->outcome());
    }
}
