<?php

namespace Tests\Feature\Games;

use App\Enums\Army;
use App\Enums\BoardTheme;
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

    public function test_the_challenger_brings_the_army_chosen_for_the_challenge()
    {
        $invitation = Invitation::factory()->create(['inviter_army' => Army::Viking]);
        $invitation->invitee->update(['army' => Army::Greek]);

        $this->actingAs($invitation->invitee)->post(route('invitations.accept', $invitation));

        $game = Game::sole();
        $inviterIsWhite = $game->white_id === $invitation->inviter_id;
        $this->assertSame(Army::Viking, $inviterIsWhite ? $game->white_army : $game->black_army);
        $this->assertSame(Army::Greek, $inviterIsWhite ? $game->black_army : $game->white_army);
    }

    public function test_the_challenged_player_brings_the_army_they_accept_with()
    {
        $invitation = Invitation::factory()->create(['inviter_army' => Army::Viking]);

        $this->actingAs($invitation->invitee)
            ->post(route('invitations.accept', $invitation), ['army' => 'zombie'])
            ->assertSessionHasNoErrors();

        $game = Game::sole();
        $this->assertEqualsCanonicalizing(
            [Army::Viking, Army::Zombie],
            [$game->white_army, $game->black_army],
        );
    }

    public function test_the_challenged_player_cannot_pick_the_challengers_army()
    {
        $invitation = Invitation::factory()->create(['inviter_army' => Army::Viking]);

        $this->actingAs($invitation->invitee)
            ->post(route('invitations.accept', $invitation), ['army' => 'viking'])
            ->assertSessionHasErrors(['army' => 'Your opponent already leads this army. Choose another.']);

        $this->assertDatabaseCount('games', 0);
        $this->assertSame(InvitationStatus::Pending, $invitation->refresh()->status);
    }

    public function test_unknown_armies_are_rejected_when_accepting()
    {
        $invitation = Invitation::factory()->create();

        $this->actingAs($invitation->invitee)
            ->post(route('invitations.accept', $invitation), ['army' => 'pirates'])
            ->assertSessionHasErrors('army');

        $this->assertDatabaseCount('games', 0);
    }

    public function test_games_are_played_on_the_board_the_challenger_picked()
    {
        $invitation = Invitation::factory()->create(['board_theme' => BoardTheme::Marble]);

        $this->actingAs($invitation->invitee)->post(route('invitations.accept', $invitation));

        $this->assertSame(BoardTheme::Marble, Game::sole()->board_theme);
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
