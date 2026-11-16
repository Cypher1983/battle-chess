<?php

namespace Tests\Feature\Clans;

use App\Enums\InvitationStatus;
use App\Models\Clan;
use App\Models\ClanInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RespondToClanInvitationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{0: string}>
     */
    public static function inviteeRoutes(): array
    {
        return [
            'accept' => ['clan-invitations.accept'],
            'decline' => ['clan-invitations.decline'],
        ];
    }

    public function test_the_invitee_can_accept_and_join_the_clan()
    {
        $invitation = ClanInvitation::factory()->create();

        $this->actingAs($invitation->invitee)
            ->post(route('clan-invitations.accept', $invitation))
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertSame(InvitationStatus::Accepted, $invitation->refresh()->status);
        $this->assertTrue($invitation->invitee->fresh()->clan->is($invitation->clan));
    }

    public function test_the_invitee_can_decline()
    {
        $invitation = ClanInvitation::factory()->create();

        $this->actingAs($invitation->invitee)
            ->post(route('clan-invitations.decline', $invitation))
            ->assertRedirect();

        $this->assertSame(InvitationStatus::Declined, $invitation->refresh()->status);
        $this->assertNull($invitation->invitee->fresh()->clan_id);
    }

    #[DataProvider('inviteeRoutes')]
    public function test_only_the_invitee_can_answer(string $route)
    {
        $invitation = ClanInvitation::factory()->create();

        foreach ([$invitation->inviter, User::factory()->create()] as $user) {
            $this->actingAs($user)
                ->post(route($route, $invitation))
                ->assertForbidden();
        }

        $this->assertSame(InvitationStatus::Pending, $invitation->refresh()->status);
    }

    #[DataProvider('inviteeRoutes')]
    public function test_closed_invitations_cannot_be_answered(string $route)
    {
        foreach ([
            ClanInvitation::factory()->expired()->create(),
            ClanInvitation::factory()->responded(InvitationStatus::Cancelled)->create(),
        ] as $invitation) {
            $this->actingAs($invitation->invitee)
                ->post(route($route, $invitation))
                ->assertSessionHasErrors('invitation');

            $this->assertNull($invitation->invitee->fresh()->clan_id);
        }
    }

    public function test_players_who_joined_another_clan_cannot_accept()
    {
        $invitation = ClanInvitation::factory()->create();
        $other = Clan::factory()->create();
        $invitation->invitee->clan()->associate($other)->save();

        $this->actingAs($invitation->invitee)
            ->post(route('clan-invitations.accept', $invitation))
            ->assertSessionHasErrors(['invitation' => 'Leave your current clan before joining another.']);

        $this->assertSame(InvitationStatus::Pending, $invitation->refresh()->status);
        $this->assertSame($other->id, $invitation->invitee->fresh()->clan_id);
    }

    public function test_the_leader_can_cancel_an_invitation()
    {
        $invitation = ClanInvitation::factory()->create();

        $this->actingAs($invitation->clan->leader)
            ->post(route('clan-invitations.cancel', $invitation))
            ->assertRedirect();

        $this->assertSame(InvitationStatus::Cancelled, $invitation->refresh()->status);
    }

    public function test_only_the_leader_can_cancel_an_invitation()
    {
        $invitation = ClanInvitation::factory()->create();
        $member = User::factory()->for($invitation->clan)->create();

        foreach ([$invitation->invitee, $member] as $user) {
            $this->actingAs($user)
                ->post(route('clan-invitations.cancel', $invitation))
                ->assertForbidden();
        }

        $this->assertSame(InvitationStatus::Pending, $invitation->refresh()->status);
    }
}
