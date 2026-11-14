<?php

namespace Tests\Feature\Broadcasting;

use App\Models\Game;
use App\Models\Invitation;
use App\Models\User;
use App\Notifications\ChallengeAnswered;
use App\Notifications\InvitationReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class LiveNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_registered_invitees_get_a_live_notification()
    {
        $invitation = Invitation::factory()->create();
        $notification = new InvitationReceived($invitation);

        $this->assertSame(['mail', 'broadcast'], $notification->via($invitation->invitee));

        $data = $notification->toBroadcast($invitation->invitee)->data;
        $this->assertSame('invitation.received', $data['kind']);
        $this->assertSame(route('invites'), $data['url']);
        $this->assertStringContainsString($invitation->inviter->name, $data['message']);
    }

    public function test_email_only_invitees_get_mail_only()
    {
        $invitation = Invitation::factory()->forEmail()->create();

        $this->assertSame(['mail'], (new InvitationReceived($invitation))->via(new AnonymousNotifiable));
    }

    public function test_inviter_is_told_when_their_challenge_is_accepted()
    {
        Notification::fake();
        $invitation = Invitation::factory()->create();

        $this->actingAs($invitation->invitee)->post(route('invitations.accept', $invitation));

        $game = Game::sole();
        Notification::assertSentTo($invitation->inviter, ChallengeAnswered::class, function (ChallengeAnswered $notification, array $channels, User $notifiable) use ($game) {
            $data = $notification->toBroadcast($notifiable)->data;

            return $channels === ['broadcast']
                && $data['kind'] === 'challenge.accepted'
                && $data['url'] === route('games.show', $game);
        });
    }

    public function test_inviter_is_told_when_their_challenge_is_declined()
    {
        Notification::fake();
        $invitation = Invitation::factory()->create();

        $this->actingAs($invitation->invitee)->post(route('invitations.decline', $invitation));

        Notification::assertSentTo($invitation->inviter, ChallengeAnswered::class, function (ChallengeAnswered $notification, array $channels, User $notifiable) {
            $data = $notification->toBroadcast($notifiable)->data;

            return $data['kind'] === 'challenge.declined' && $data['url'] === null;
        });
    }

    public function test_cancelling_does_not_notify_anyone()
    {
        Notification::fake();
        $invitation = Invitation::factory()->create();

        $this->actingAs($invitation->inviter)->post(route('invitations.cancel', $invitation));

        Notification::assertNothingSent();
    }
}
