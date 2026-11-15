<?php

namespace Tests\Feature\Invitations;

use App\Enums\Army;
use App\Enums\BoardTheme;
use App\Enums\InvitationStatus;
use App\Models\Invitation;
use App\Models\User;
use App\Notifications\InvitationReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SendInvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_send_invitations()
    {
        $this->post(route('invitations.store'), ['recipient' => 'someone'])
            ->assertRedirect(route('login'));

        $this->assertDatabaseCount('invitations', 0);
    }

    public function test_players_can_challenge_by_username()
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create(['username' => 'bob_the_bishop']);

        $this->actingAs($alice)
            ->post(route('invitations.store'), ['recipient' => 'Bob_The_Bishop'])
            ->assertSessionHasNoErrors();

        $invitation = Invitation::sole();
        $this->assertTrue($invitation->inviter->is($alice));
        $this->assertTrue($invitation->invitee->is($bob));
        $this->assertNull($invitation->email);
        $this->assertSame(InvitationStatus::Pending, $invitation->status);
        $this->assertTrue($invitation->expires_at->between(now()->addDays(6), now()->addDays(8)));
    }

    public function test_challenging_a_registered_email_links_the_player()
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create(['email' => 'bob@example.com']);

        $this->actingAs($alice)
            ->post(route('invitations.store'), ['recipient' => 'Bob@Example.com'])
            ->assertSessionHasNoErrors();

        $invitation = Invitation::sole();
        $this->assertTrue($invitation->invitee->is($bob));
        $this->assertNull($invitation->email);
    }

    public function test_challenging_an_unknown_email_creates_an_email_invitation()
    {
        $alice = User::factory()->create();

        $this->actingAs($alice)
            ->post(route('invitations.store'), ['recipient' => 'friend@example.com'])
            ->assertSessionHasNoErrors();

        $invitation = Invitation::sole();
        $this->assertNull($invitation->invitee_id);
        $this->assertSame('friend@example.com', $invitation->email);
    }

    public function test_unknown_usernames_are_rejected()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('invitations.store'), ['recipient' => 'nobody_here'])
            ->assertSessionHasErrors(['recipient' => 'No player found with that username.']);

        $this->assertDatabaseCount('invitations', 0);
    }

    public function test_players_cannot_challenge_themselves()
    {
        $alice = User::factory()->create(['username' => 'alice']);

        $this->actingAs($alice)
            ->post(route('invitations.store'), ['recipient' => 'alice'])
            ->assertSessionHasErrors(['recipient' => 'You cannot challenge yourself.']);

        $this->actingAs($alice)
            ->post(route('invitations.store'), ['recipient' => $alice->email])
            ->assertSessionHasErrors(['recipient' => 'You cannot challenge yourself.']);
    }

    public function test_duplicate_pending_challenges_are_rejected()
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create(['username' => 'bob']);
        Invitation::factory()->for($alice, 'inviter')->for($bob, 'invitee')->create();

        $this->actingAs($alice)
            ->post(route('invitations.store'), ['recipient' => 'bob'])
            ->assertSessionHasErrors(['recipient' => 'You already have a pending challenge to this player.']);

        $this->assertDatabaseCount('invitations', 1);
    }

    public function test_duplicate_pending_email_invitations_are_rejected()
    {
        $alice = User::factory()->create();
        Invitation::factory()->for($alice, 'inviter')->forEmail('friend@example.com')->create();

        $this->actingAs($alice)
            ->post(route('invitations.store'), ['recipient' => 'friend@example.com'])
            ->assertSessionHasErrors('recipient');
    }

    public function test_players_can_challenge_again_after_an_invitation_expires()
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create(['username' => 'bob']);
        Invitation::factory()->for($alice, 'inviter')->for($bob, 'invitee')->expired()->create();

        $this->actingAs($alice)
            ->post(route('invitations.store'), ['recipient' => 'bob'])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('invitations', 2);
    }

    public function test_registered_players_are_notified_by_email()
    {
        Notification::fake();

        $alice = User::factory()->create(['name' => 'Alice']);
        $bob = User::factory()->create(['username' => 'bob']);

        $this->actingAs($alice)->post(route('invitations.store'), ['recipient' => 'bob']);

        Notification::assertSentTo($bob, InvitationReceived::class, function (InvitationReceived $notification) use ($bob) {
            $mail = $notification->toMail($bob);

            return $mail->subject === 'Alice challenges you to Battle Chess'
                && $mail->actionUrl === route('invites');
        });
    }

    public function test_unregistered_emails_are_invited_to_sign_up()
    {
        Notification::fake();

        $this->actingAs(User::factory()->create())
            ->post(route('invitations.store'), ['recipient' => 'friend@example.com']);

        Notification::assertSentOnDemand(InvitationReceived::class, function (InvitationReceived $notification, array $channels, object $notifiable) {
            return $notifiable->routes['mail'] === 'friend@example.com'
                && $notification->toMail($notifiable)->actionUrl === route('register');
        });
    }

    public function test_rejected_invitations_send_no_email()
    {
        Notification::fake();

        $this->actingAs(User::factory()->create())
            ->post(route('invitations.store'), ['recipient' => 'nobody_here']);

        Notification::assertNothingSent();
    }

    public function test_recipient_is_required()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('invitations.store'), ['recipient' => ''])
            ->assertSessionHasErrors('recipient');
    }

    public function test_challengers_choose_the_army_they_bring()
    {
        $alice = User::factory()->create(['army' => Army::Clockwork]);
        User::factory()->create(['username' => 'bob']);

        $this->actingAs($alice)
            ->post(route('invitations.store'), ['recipient' => 'bob', 'army' => 'viking'])
            ->assertSessionHasNoErrors();

        $this->assertSame(Army::Viking, Invitation::sole()->inviter_army);
    }

    public function test_challengers_bring_their_saved_army_by_default()
    {
        $alice = User::factory()->create(['army' => Army::Greek]);
        User::factory()->create(['username' => 'bob']);

        $this->actingAs($alice)
            ->post(route('invitations.store'), ['recipient' => 'bob'])
            ->assertSessionHasNoErrors();

        $this->assertSame(Army::Greek, Invitation::sole()->inviter_army);
    }

    public function test_unknown_armies_are_rejected()
    {
        User::factory()->create(['username' => 'bob']);

        $this->actingAs(User::factory()->create())
            ->post(route('invitations.store'), ['recipient' => 'bob', 'army' => 'pirates'])
            ->assertSessionHasErrors('army');

        $this->assertDatabaseCount('invitations', 0);
    }

    public function test_challengers_pick_the_board_theme()
    {
        User::factory()->create(['username' => 'bob']);

        $this->actingAs(User::factory()->create())
            ->post(route('invitations.store'), ['recipient' => 'bob', 'board_theme' => 'classic'])
            ->assertSessionHasNoErrors();

        $this->assertSame(BoardTheme::Classic, Invitation::sole()->board_theme);
    }

    public function test_unknown_board_themes_are_rejected()
    {
        User::factory()->create(['username' => 'bob']);

        $this->actingAs(User::factory()->create())
            ->post(route('invitations.store'), ['recipient' => 'bob', 'board_theme' => 'plaid'])
            ->assertSessionHasErrors('board_theme');

        $this->assertDatabaseCount('invitations', 0);
    }
}
