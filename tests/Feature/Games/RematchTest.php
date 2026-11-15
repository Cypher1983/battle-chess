<?php

namespace Tests\Feature\Games;

use App\Enums\Army;
use App\Models\Game;
use App\Models\Invitation;
use App\Models\User;
use App\Notifications\InvitationReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RematchTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_player_can_challenge_their_opponent_to_a_rematch()
    {
        Notification::fake();
        $game = Game::factory()->finished()->create();

        $this->actingAs($game->black)
            ->post(route('games.rematch', $game))
            ->assertRedirect(route('games.show', $game));

        $invitation = Invitation::sole();
        $this->assertTrue($invitation->inviter->is($game->black));
        $this->assertTrue($invitation->invitee->is($game->white));
        $this->assertTrue($invitation->isOpen());
        Notification::assertSentTo($game->white, InvitationReceived::class);
    }

    public function test_accepting_a_rematch_starts_a_new_game()
    {
        $game = Game::factory()->finished()->create();

        $this->actingAs($game->white)->post(route('games.rematch', $game));
        $this->actingAs($game->black)->post(route('invitations.accept', Invitation::sole()));

        $rematch = Game::latest('id')->first();
        $this->assertNotSame($game->id, $rematch->id);
        $this->assertEqualsCanonicalizing([$game->white_id, $game->black_id], [$rematch->white_id, $rematch->black_id]);
        $this->assertTrue($rematch->isActive());
    }

    public function test_rematch_is_not_possible_while_the_game_is_active()
    {
        $game = Game::factory()->create();

        $this->actingAs($game->white)->post(route('games.rematch', $game));

        $this->assertDatabaseCount('invitations', 0);
    }

    public function test_asking_twice_does_not_send_a_second_challenge()
    {
        $game = Game::factory()->finished()->create();

        $this->actingAs($game->white)->post(route('games.rematch', $game));
        $this->actingAs($game->white)->post(route('games.rematch', $game));

        $this->assertDatabaseCount('invitations', 1);
    }

    public function test_if_the_opponent_already_asked_you_are_sent_to_accept_it()
    {
        $game = Game::factory()->finished()->create();

        $this->actingAs($game->white)->post(route('games.rematch', $game));

        $this->actingAs($game->black)
            ->post(route('games.rematch', $game))
            ->assertRedirect(route('invites'));

        $this->assertDatabaseCount('invitations', 1);
    }

    public function test_other_users_cannot_request_a_rematch()
    {
        $game = Game::factory()->finished()->create();

        $this->actingAs(User::factory()->create())
            ->post(route('games.rematch', $game))
            ->assertForbidden();
    }

    public function test_the_challenger_picks_the_army_for_the_rematch()
    {
        $game = Game::factory()->finished()->create();

        $this->actingAs($game->black)
            ->post(route('games.rematch', $game), ['army' => 'sun'])
            ->assertSessionHasNoErrors();

        $this->assertSame(Army::Sun, Invitation::sole()->inviter_army);
    }

    public function test_unknown_armies_are_rejected_for_a_rematch()
    {
        $game = Game::factory()->finished()->create();

        $this->actingAs($game->black)
            ->post(route('games.rematch', $game), ['army' => 'pirates'])
            ->assertSessionHasErrors('army');

        $this->assertDatabaseCount('invitations', 0);
    }

    public function test_unknown_board_themes_are_rejected_for_a_rematch()
    {
        $game = Game::factory()->finished()->create();

        $this->actingAs($game->black)
            ->post(route('games.rematch', $game), ['board_theme' => 'plaid'])
            ->assertSessionHasErrors('board_theme');

        $this->assertDatabaseCount('invitations', 0);
    }
}
