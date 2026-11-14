<?php

namespace Tests\Feature\Games;

use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Enums\GameStatus;
use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MakeMoveTest extends TestCase
{
    use RefreshDatabase;

    public function test_white_can_make_the_first_move()
    {
        $game = Game::factory()->create();

        $this->actingAs($game->white)
            ->post(route('games.moves.store', $game), ['from' => 'e2', 'to' => 'e4'])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('games.show', $game));

        $game->refresh();
        $move = $game->moves->sole();
        $this->assertSame(1, $move->ply);
        $this->assertSame('e4', $move->san);
        $this->assertTrue($move->user->is($game->white));
        $this->assertSame($move->fen, $game->fen);
        $this->assertSame('b', $game->turn()->value);
        $this->assertNotNull($game->last_move_at);
    }

    public function test_players_cannot_move_out_of_turn()
    {
        $game = Game::factory()->create();

        $this->actingAs($game->black)
            ->post(route('games.moves.store', $game), ['from' => 'e7', 'to' => 'e5'])
            ->assertSessionHasErrors(['move' => 'It is not your turn.']);

        $this->assertDatabaseCount('moves', 0);
    }

    public function test_illegal_moves_are_rejected()
    {
        $game = Game::factory()->create();

        $this->actingAs($game->white)
            ->post(route('games.moves.store', $game), ['from' => 'e2', 'to' => 'e5'])
            ->assertSessionHasErrors(['move' => 'That move is not allowed.']);

        $this->assertSame(Game::START_FEN, $game->refresh()->fen);
    }

    public function test_malformed_squares_are_rejected()
    {
        $game = Game::factory()->create();

        $this->actingAs($game->white)
            ->post(route('games.moves.store', $game), ['from' => 'z9', 'to' => 'e4', 'promotion' => 'k'])
            ->assertSessionHasErrors(['from', 'promotion']);
    }

    public function test_other_users_cannot_move()
    {
        $game = Game::factory()->create();

        $this->actingAs(User::factory()->create())
            ->post(route('games.moves.store', $game), ['from' => 'e2', 'to' => 'e4'])
            ->assertForbidden();
    }

    public function test_checkmate_ends_the_game()
    {
        $game = Game::factory()->create();

        $this->playMoves($game, [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]);

        $game->refresh();
        $this->assertSame(GameStatus::Finished, $game->status);
        $this->assertSame(GameResult::BlackWins, $game->result);
        $this->assertSame(GameEndReason::Checkmate, $game->end_reason);
        $this->assertNotNull($game->finished_at);
        $this->assertSame('Qh4#', $game->moves->last()->san);

        $this->actingAs($game->white)
            ->post(route('games.moves.store', $game), ['from' => 'a2', 'to' => 'a3'])
            ->assertSessionHasErrors('move');
    }

    public function test_promotion_requires_a_piece_choice()
    {
        $game = Game::factory()->create();
        $this->playMoves($game, [
            ['h2', 'h4'], ['g7', 'g5'], ['h4', 'g5'], ['g8', 'f6'],
            ['g5', 'g6'], ['f6', 'g8'], ['g6', 'g7'], ['g8', 'f6'],
        ]);

        $this->actingAs($game->white)
            ->post(route('games.moves.store', $game), ['from' => 'g7', 'to' => 'h8'])
            ->assertSessionHasErrors('move');

        $this->actingAs($game->white)
            ->post(route('games.moves.store', $game), ['from' => 'g7', 'to' => 'h8', 'promotion' => 'q'])
            ->assertSessionHasNoErrors();

        $move = $game->refresh()->moves->last();
        $this->assertSame('gxh8=Q', $move->san);
        $this->assertSame('q', $move->promotion);
    }

    public function test_moving_withdraws_a_pending_draw_offer()
    {
        $game = Game::factory()->create();
        $game->update(['draw_offered_by_id' => $game->black_id]);

        $this->playMoves($game, [['e2', 'e4']]);

        $this->assertNull($game->refresh()->draw_offered_by_id);
    }

    /**
     * Play moves alternately as white and black.
     *
     * @param  array<int, array{0: string, 1: string}>  $moves
     */
    private function playMoves(Game $game, array $moves): void
    {
        foreach ($moves as $index => [$from, $to]) {
            $player = $index % 2 === 0 ? $game->white : $game->black;

            $this->actingAs($player)
                ->post(route('games.moves.store', $game), ['from' => $from, 'to' => $to])
                ->assertSessionHasNoErrors();
        }
    }
}
