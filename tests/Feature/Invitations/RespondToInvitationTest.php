<?php

namespace Tests\Feature\Invitations;

use App\Enums\InvitationStatus;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RespondToInvitationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{0: string, 1: InvitationStatus}>
     */
    public static function inviteeActions(): array
    {
        return [
            'accept' => ['invitations.accept', InvitationStatus::Accepted],
            'decline' => ['invitations.decline', InvitationStatus::Declined],
        ];
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function inviteeRoutes(): array
    {
        return array_map(fn (array $action) => [$action[0]], self::inviteeActions());
    }

    #[DataProvider('inviteeActions')]
    public function test_invitee_can_answer_a_challenge(string $route, InvitationStatus $expected)
    {
        $invitation = Invitation::factory()->create();

        $this->actingAs($invitation->invitee)
            ->from(route('invites'))
            ->post(route($route, $invitation))
            ->assertRedirect(route('invites'));

        $invitation->refresh();
        $this->assertSame($expected, $invitation->status);
        $this->assertNotNull($invitation->responded_at);
    }

    #[DataProvider('inviteeRoutes')]
    public function test_inviter_cannot_answer_their_own_challenge(string $route)
    {
        $invitation = Invitation::factory()->create();

        $this->actingAs($invitation->inviter)
            ->post(route($route, $invitation))
            ->assertForbidden();

        $this->assertSame(InvitationStatus::Pending, $invitation->refresh()->status);
    }

    #[DataProvider('inviteeRoutes')]
    public function test_other_players_cannot_answer_a_challenge(string $route)
    {
        $invitation = Invitation::factory()->create();

        $this->actingAs(User::factory()->create())
            ->post(route($route, $invitation))
            ->assertForbidden();
    }

    #[DataProvider('inviteeRoutes')]
    public function test_expired_challenges_cannot_be_answered(string $route)
    {
        $invitation = Invitation::factory()->expired()->create();

        $this->actingAs($invitation->invitee)
            ->post(route($route, $invitation))
            ->assertRedirect();

        $this->assertSame(InvitationStatus::Pending, $invitation->refresh()->status);
        $this->assertNull($invitation->responded_at);
    }

    #[DataProvider('inviteeRoutes')]
    public function test_closed_challenges_cannot_be_answered_again(string $route)
    {
        $invitation = Invitation::factory()->responded(InvitationStatus::Cancelled)->create();

        $this->actingAs($invitation->invitee)
            ->post(route($route, $invitation))
            ->assertRedirect();

        $this->assertSame(InvitationStatus::Cancelled, $invitation->refresh()->status);
    }

    public function test_inviter_can_cancel_a_challenge()
    {
        $invitation = Invitation::factory()->create();

        $this->actingAs($invitation->inviter)
            ->post(route('invitations.cancel', $invitation))
            ->assertRedirect();

        $this->assertSame(InvitationStatus::Cancelled, $invitation->refresh()->status);
    }

    public function test_inviter_can_cancel_an_email_invitation()
    {
        $invitation = Invitation::factory()->forEmail()->create();

        $this->actingAs($invitation->inviter)
            ->post(route('invitations.cancel', $invitation))
            ->assertRedirect();

        $this->assertSame(InvitationStatus::Cancelled, $invitation->refresh()->status);
    }

    public function test_invitee_cannot_cancel_a_challenge()
    {
        $invitation = Invitation::factory()->create();

        $this->actingAs($invitation->invitee)
            ->post(route('invitations.cancel', $invitation))
            ->assertForbidden();

        $this->assertSame(InvitationStatus::Pending, $invitation->refresh()->status);
    }

    public function test_guests_cannot_answer_challenges()
    {
        $invitation = Invitation::factory()->create();

        $this->post(route('invitations.accept', $invitation))->assertRedirect(route('login'));

        $this->assertSame(InvitationStatus::Pending, $invitation->refresh()->status);
    }
}
