<?php

namespace Tests\Feature\Models;

use App\Enums\InvitationStatus;
use App\Models\Clan;
use App\Models\ClanInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClanInvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_invitations_are_open_and_come_from_the_leader()
    {
        $invitation = ClanInvitation::factory()->create();

        $this->assertTrue($invitation->isOpen());
        $this->assertTrue($invitation->inviter->is($invitation->clan->leader));
    }

    public function test_expired_and_answered_invitations_are_not_open()
    {
        $this->assertFalse(ClanInvitation::factory()->expired()->create()->isOpen());

        foreach ([InvitationStatus::Accepted, InvitationStatus::Declined, InvitationStatus::Cancelled] as $status) {
            $this->assertFalse(ClanInvitation::factory()->responded($status)->create()->isOpen(), $status->value);
        }
    }

    public function test_open_scope_only_returns_pending_unexpired_invitations()
    {
        $open = ClanInvitation::factory()->create();
        ClanInvitation::factory()->expired()->create();
        ClanInvitation::factory()->responded(InvitationStatus::Declined)->create();

        $this->assertSame([$open->id], ClanInvitation::open()->pluck('id')->all());
    }

    public function test_clans_have_invitations_for_players()
    {
        $clan = Clan::factory()->create();
        $player = User::factory()->create();

        $invitation = ClanInvitation::factory()->for($clan)->for($player, 'invitee')->create();

        $this->assertTrue($clan->invitations->contains($invitation));
        $this->assertTrue($invitation->invitee->is($player));
    }

    public function test_closing_an_invitation_records_the_answer()
    {
        $invitation = ClanInvitation::factory()->create();

        $invitation->close(InvitationStatus::Declined);

        $this->assertSame(InvitationStatus::Declined, $invitation->fresh()->status);
        $this->assertNotNull($invitation->fresh()->responded_at);
    }
}
