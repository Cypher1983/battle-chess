<?php

namespace Tests\Feature\Models;

use App\Enums\Army;
use App\Enums\InvitationStatus;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_invitations_are_open()
    {
        $invitation = Invitation::factory()->create();

        $this->assertTrue($invitation->isOpen());
        $this->assertFalse($invitation->isExpired());
    }

    public function test_expired_invitations_are_not_open()
    {
        $invitation = Invitation::factory()->expired()->create();

        $this->assertTrue($invitation->isExpired());
        $this->assertFalse($invitation->isOpen());
    }

    public function test_answered_invitations_are_not_open()
    {
        foreach ([InvitationStatus::Accepted, InvitationStatus::Declined, InvitationStatus::Cancelled] as $status) {
            $this->assertFalse(Invitation::factory()->responded($status)->create()->isOpen(), $status->value);
        }
    }

    public function test_open_scope_only_returns_pending_unexpired_invitations()
    {
        $open = Invitation::factory()->create();
        Invitation::factory()->expired()->create();
        Invitation::factory()->responded(InvitationStatus::Declined)->create();

        $this->assertSame([$open->id], Invitation::open()->pluck('id')->all());
    }

    public function test_users_have_sent_and_received_invitations()
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $invitation = Invitation::factory()->for($alice, 'inviter')->for($bob, 'invitee')->create();

        $this->assertTrue($alice->sentInvitations->contains($invitation));
        $this->assertTrue($bob->receivedInvitations->contains($invitation));
        $this->assertTrue($invitation->inviter->is($alice));
        $this->assertTrue($invitation->invitee->is($bob));
    }

    public function test_email_invitations_have_no_invitee()
    {
        $invitation = Invitation::factory()->forEmail('friend@example.com')->create();

        $this->assertNull($invitation->invitee);
        $this->assertSame('friend@example.com', $invitation->email);
    }

    public function test_the_challenger_brings_the_army_chosen_for_the_challenge()
    {
        $inviter = User::factory()->create(['army' => Army::Clockwork]);
        $invitation = Invitation::factory()->for($inviter, 'inviter')->create(['inviter_army' => Army::Viking]);

        $this->assertSame(Army::Viking, $invitation->fresh()->challengerArmy());
    }

    public function test_older_challenges_fall_back_to_the_challengers_saved_army()
    {
        $inviter = User::factory()->create(['army' => Army::Greek]);
        $invitation = Invitation::factory()->for($inviter, 'inviter')->create();

        $this->assertSame(Army::Greek, $invitation->fresh()->challengerArmy());
    }
}
