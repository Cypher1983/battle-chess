<?php

namespace Tests\Feature\Games;

use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Enums\GameStatus;
use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MoveDeadlineTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_deadline_is_three_days_after_the_last_move_or_the_start()
    {
        // Timestamps are stored to the second.
        $this->freezeSecond();
        $game = Game::factory()->create();

        $this->assertTrue($game->moveDeadline()->equalTo(now()->addHours(72)));

        $game->update(['last_move_at' => now()->addDay()]);

        $this->assertTrue($game->moveDeadline()->equalTo(now()->addDay()->addHours(72)));
    }

    public function test_the_waiting_player_can_claim_once_the_deadline_passes()
    {
        $game = Game::factory()->create(); // white to move

        $this->assertFalse($game->canClaimTimeout($game->black));

        $this->travel(73)->hours();

        $this->assertTrue($game->canClaimTimeout($game->black));
        $this->assertFalse($game->canClaimTimeout($game->white), 'The late player cannot claim');
        $this->assertFalse($game->canClaimTimeout(User::factory()->create()));
    }

    public function test_claiming_ends_the_game_and_updates_ratings()
    {
        $game = Game::factory()->create();
        $this->travel(73)->hours();

        $this->actingAs($game->black)
            ->post(route('games.claim-timeout', $game))
            ->assertRedirect(route('games.show', $game));

        $game->refresh();
        $this->assertSame(GameStatus::Finished, $game->status);
        $this->assertSame(GameResult::BlackWins, $game->result);
        $this->assertSame(GameEndReason::Timeout, $game->end_reason);
        $this->assertSame(1216, $game->black->refresh()->rating);
    }

    public function test_claiming_before_the_deadline_does_nothing()
    {
        $game = Game::factory()->create();
        $this->travel(71)->hours();

        $this->actingAs($game->black)->post(route('games.claim-timeout', $game));

        $this->assertSame(GameStatus::Active, $game->refresh()->status);
    }

    public function test_a_move_resets_the_deadline()
    {
        $game = Game::factory()->create();
        $this->travel(71)->hours();

        $this->actingAs($game->white)->post(route('games.moves.store', $game), ['from' => 'e2', 'to' => 'e4']);
        $this->travel(5)->hours();

        $this->assertFalse($game->refresh()->canClaimTimeout($game->white));
    }
}
