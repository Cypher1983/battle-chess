<?php

namespace Tests\Feature\Games;

use App\Enums\Army;
use App\Enums\GameStatus;
use App\Enums\InvitationStatus;
use App\Models\Game;
use App\Models\Invitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StartGameTest extends TestCase
{
    use RefreshDatabase;

    public function test_accepting_a_challenge_starts_a_game_between_both_players()
    {
        $invitation = Invitation::factory()->create();

        $this->actingAs($invitation->invitee)->post(route('invitations.accept', $invitation));

        $game = Game::sole();
        $this->assertTrue($game->invitation->is($invitation));
        $this->assertEqualsCanonicalizing(
            [$invitation->inviter_id, $invitation->invitee_id],
            [$game->white_id, $game->black_id],
        );
        $this->assertSame(GameStatus::Active, $game->status);
        $this->assertSame(Game::START_FEN, $game->fen);
    }

    public function test_each_player_brings_their_chosen_army()
    {
        $invitation = Invitation::factory()->create();
        $invitation->inviter->update(['army' => Army::Wildwood]);
        $invitation->invitee->update(['army' => Army::Wildwood]);

        $this->actingAs($invitation->invitee)->post(route('invitations.accept', $invitation));

        $game = Game::sole();
        $this->assertSame(Army::Wildwood, $game->white_army);
        $this->assertSame(Army::Wildwood, $game->black_army);
    }

    public function test_choosing_another_army_does_not_change_a_game_under_way()
    {
        $invitation = Invitation::factory()->create();
        $this->actingAs($invitation->invitee)->post(route('invitations.accept', $invitation));

        $invitation->inviter->update(['army' => Army::Wildwood]);
        $invitation->invitee->update(['army' => Army::Wildwood]);

        $game = Game::sole();
        $this->assertSame(Army::Clockwork, $game->white_army);
        $this->assertSame(Army::Clockwork, $game->black_army);
    }

    public function test_colours_are_assigned_at_random()
    {
        $inviterPlayedWhite = [];

        for ($i = 0; $i < 30; $i++) {
            $invitation = Invitation::factory()->create();
            $this->actingAs($invitation->invitee)->post(route('invitations.accept', $invitation));

            $inviterPlayedWhite[] = Game::where('invitation_id', $invitation->id)->value('white_id') === $invitation->inviter_id;
        }

        $this->assertContains(true, $inviterPlayedWhite);
        $this->assertContains(false, $inviterPlayedWhite);
    }

    public function test_declining_does_not_start_a_game()
    {
        $invitation = Invitation::factory()->create();

        $this->actingAs($invitation->invitee)->post(route('invitations.decline', $invitation));

        $this->assertDatabaseCount('games', 0);
    }

    public function test_accepting_twice_starts_only_one_game()
    {
        $invitation = Invitation::factory()->create();

        $this->actingAs($invitation->invitee)->post(route('invitations.accept', $invitation));
        $this->actingAs($invitation->invitee)->post(route('invitations.accept', $invitation));

        $this->assertDatabaseCount('games', 1);
        $this->assertSame(InvitationStatus::Accepted, $invitation->refresh()->status);
    }

    public function test_expired_challenges_do_not_start_a_game()
    {
        $invitation = Invitation::factory()->expired()->create();

        $this->actingAs($invitation->invitee)->post(route('invitations.accept', $invitation));

        $this->assertDatabaseCount('games', 0);
    }
}
