<?php

namespace Tests\Feature\Games;

use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Enums\GameStatus;
use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GameActionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_white_resigning_gives_black_the_win()
    {
        $game = Game::factory()->create();

        $this->actingAs($game->white)
            ->post(route('games.resign', $game))
            ->assertRedirect(route('games.show', $game));

        $game->refresh();
        $this->assertSame(GameStatus::Finished, $game->status);
        $this->assertSame(GameResult::BlackWins, $game->result);
        $this->assertSame(GameEndReason::Resignation, $game->end_reason);
    }

    public function test_black_can_resign_even_when_it_is_not_their_turn()
    {
        $game = Game::factory()->create();

        $this->actingAs($game->black)->post(route('games.resign', $game));

        $this->assertSame(GameResult::WhiteWins, $game->refresh()->result);
    }

    public function test_finished_games_cannot_be_resigned()
    {
        $game = Game::factory()->finished(GameResult::WhiteWins)->create();

        $this->actingAs($game->black)->post(route('games.resign', $game));

        $this->assertSame(GameResult::WhiteWins, $game->refresh()->result);
        $this->assertSame(GameEndReason::Checkmate, $game->end_reason);
    }

    public function test_players_can_offer_a_draw()
    {
        $game = Game::factory()->create();

        $this->actingAs($game->white)->post(route('games.draw.offer', $game));

        $this->assertSame($game->white_id, $game->refresh()->draw_offered_by_id);

        $this->actingAs($game->black)
            ->get(route('games.show', $game))
            ->assertInertia(fn (Assert $page) => $page->where('game.draw_offered_by', 'w'));
    }

    public function test_accepting_a_draw_offer_ends_the_game_in_a_draw()
    {
        $game = Game::factory()->create(['draw_offered_by_id' => null]);
        $game->update(['draw_offered_by_id' => $game->white_id]);

        $this->actingAs($game->black)->post(route('games.draw.accept', $game));

        $game->refresh();
        $this->assertSame(GameResult::Draw, $game->result);
        $this->assertSame(GameEndReason::DrawAgreed, $game->end_reason);
        $this->assertNull($game->draw_offered_by_id);
    }

    public function test_offering_after_the_opponent_offered_agrees_the_draw()
    {
        $game = Game::factory()->create();
        $game->update(['draw_offered_by_id' => $game->black_id]);

        $this->actingAs($game->white)->post(route('games.draw.offer', $game));

        $this->assertSame(GameEndReason::DrawAgreed, $game->refresh()->end_reason);
    }

    public function test_players_cannot_accept_their_own_draw_offer()
    {
        $game = Game::factory()->create();
        $game->update(['draw_offered_by_id' => $game->white_id]);

        $this->actingAs($game->white)->post(route('games.draw.accept', $game));

        $this->assertSame(GameStatus::Active, $game->refresh()->status);
    }

    public function test_declining_clears_the_offer()
    {
        $game = Game::factory()->create();
        $game->update(['draw_offered_by_id' => $game->white_id]);

        $this->actingAs($game->black)->post(route('games.draw.decline', $game));

        $game->refresh();
        $this->assertNull($game->draw_offered_by_id);
        $this->assertSame(GameStatus::Active, $game->status);
    }

    public function test_accepting_without_an_offer_does_nothing()
    {
        $game = Game::factory()->create();

        $this->actingAs($game->black)->post(route('games.draw.accept', $game));

        $this->assertSame(GameStatus::Active, $game->refresh()->status);
    }

    public function test_other_users_cannot_act_on_a_game()
    {
        $game = Game::factory()->create();
        $stranger = User::factory()->create();

        foreach (['games.resign', 'games.draw.offer', 'games.draw.accept', 'games.draw.decline'] as $route) {
            $this->actingAs($stranger)->post(route($route, $game))->assertForbidden();
        }

        $this->assertSame(GameStatus::Active, $game->refresh()->status);
    }
}
