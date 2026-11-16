<?php

namespace Tests\Feature\Clans;

use App\Enums\InvitationStatus;
use App\Models\Clan;
use App\Models\ClanInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PendingClanInvitationCountTest extends TestCase
{
    use RefreshDatabase;

    public function test_open_clan_invitations_are_counted_on_every_page()
    {
        $me = User::factory()->create();

        ClanInvitation::factory()->count(2)->for($me, 'invitee')->create();
        ClanInvitation::factory()->for($me, 'invitee')->expired()->create();
        ClanInvitation::factory()->for($me, 'invitee')->responded(InvitationStatus::Declined)->create();

        $this->actingAs($me)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->where('pendingClanInvitations', 2));
    }

    public function test_players_already_in_a_clan_are_not_nagged()
    {
        $me = User::factory()->for(Clan::factory())->create();
        ClanInvitation::factory()->for($me, 'invitee')->create();

        $this->actingAs($me)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->where('pendingClanInvitations', 0));
    }

    public function test_guests_get_a_zero_count()
    {
        $this->get(route('login'))
            ->assertInertia(fn (Assert $page) => $page->where('pendingClanInvitations', 0));
    }
}
