<?php

namespace Tests\Feature\Clans;

use App\Enums\InvitationStatus;
use App\Models\Clan;
use App\Models\ClanInvitation;
use App\Models\User;
use App\Notifications\ClanInvitationReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class InviteToClanTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_leader_can_invite_a_player_by_username()
    {
        $clan = Clan::factory()->create();
        $player = User::factory()->create(['username' => 'rook_runner']);

        $this->actingAs($clan->leader)
            ->post(route('clans.invitations.store', $clan), ['username' => ' Rook_Runner '])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $invitation = ClanInvitation::sole();
        $this->assertTrue($invitation->clan->is($clan));
        $this->assertTrue($invitation->inviter->is($clan->leader));
        $this->assertTrue($invitation->invitee->is($player));
        $this->assertSame(InvitationStatus::Pending, $invitation->status);
        $this->assertTrue($invitation->isOpen());
    }

    public function test_the_invited_player_is_notified()
    {
        Notification::fake();
        $clan = Clan::factory()->create(['name' => 'Iron Ring']);
        $player = User::factory()->create();

        $this->actingAs($clan->leader)
            ->post(route('clans.invitations.store', $clan), ['username' => $player->username]);

        Notification::assertSentTo($player, ClanInvitationReceived::class, function (ClanInvitationReceived $notification) use ($player) {
            $this->assertSame(['mail', 'broadcast'], $notification->via($player));

            $data = $notification->toBroadcast($player)->data;
            $this->assertSame('clan.invited', $data['kind']);
            $this->assertSame(route('clan'), $data['url']);
            $this->assertStringContainsString('Iron Ring', $data['message']);

            $this->assertStringContainsString('Iron Ring', $notification->toMail($player)->subject);

            return true;
        });
    }

    public function test_members_and_outsiders_cannot_invite()
    {
        $clan = Clan::factory()->create();
        $player = User::factory()->create();

        foreach ([User::factory()->for($clan)->create(), User::factory()->create()] as $user) {
            $this->actingAs($user)
                ->post(route('clans.invitations.store', $clan), ['username' => $player->username])
                ->assertForbidden();
        }

        $this->assertDatabaseCount('clan_invitations', 0);
    }

    public function test_unknown_players_cannot_be_invited()
    {
        $clan = Clan::factory()->create();

        $this->actingAs($clan->leader)
            ->post(route('clans.invitations.store', $clan), ['username' => 'nobody_here'])
            ->assertSessionHasErrors(['username' => 'No player found with that username.']);
    }

    public function test_players_already_in_a_clan_cannot_be_invited()
    {
        $clan = Clan::factory()->create();
        $member = User::factory()->for($clan)->create();
        $rival = User::factory()->for(Clan::factory())->create();

        $this->actingAs($clan->leader)
            ->post(route('clans.invitations.store', $clan), ['username' => $member->username])
            ->assertSessionHasErrors(['username' => 'That player is already in your clan.']);

        $this->actingAs($clan->leader)
            ->post(route('clans.invitations.store', $clan), ['username' => $rival->username])
            ->assertSessionHasErrors(['username' => 'That player is already in a clan.']);

        $this->assertDatabaseCount('clan_invitations', 0);
    }

    public function test_a_player_cannot_be_invited_twice()
    {
        $invitation = ClanInvitation::factory()->create();

        $this->actingAs($invitation->clan->leader)
            ->post(route('clans.invitations.store', $invitation->clan), ['username' => $invitation->invitee->username])
            ->assertSessionHasErrors(['username' => 'That player already has an invitation to your clan.']);

        $this->assertDatabaseCount('clan_invitations', 1);
    }

    public function test_a_player_can_be_invited_again_after_declining()
    {
        $invitation = ClanInvitation::factory()->responded(InvitationStatus::Declined)->create();

        $this->actingAs($invitation->clan->leader)
            ->post(route('clans.invitations.store', $invitation->clan), ['username' => $invitation->invitee->username])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('clan_invitations', 2);
    }
}
