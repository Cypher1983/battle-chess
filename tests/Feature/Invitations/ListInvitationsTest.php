<?php

namespace Tests\Feature\Invitations;

use App\Enums\InvitationStatus;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ListInvitationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_invites_page_lists_open_received_and_sent_invitations()
    {
        $me = User::factory()->create();
        $alice = User::factory()->create(['name' => 'Alice', 'username' => 'alice']);
        $bob = User::factory()->create(['name' => 'Bob', 'username' => 'bob']);

        $received = Invitation::factory()->for($alice, 'inviter')->for($me, 'invitee')->create();
        $sent = Invitation::factory()->for($me, 'inviter')->for($bob, 'invitee')->create();
        $emailed = Invitation::factory()->for($me, 'inviter')->forEmail('friend@example.com')->create();

        $this->actingAs($me)
            ->get(route('invites'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Invites')
                ->has('received', 1)
                ->where('received.0.id', $received->id)
                ->where('received.0.player', ['name' => 'Alice', 'username' => 'alice'])
                ->has('sent', 2)
                ->where('sent.0.id', $emailed->id)
                ->where('sent.0.player', null)
                ->where('sent.0.email', 'friend@example.com')
                ->where('sent.1.id', $sent->id)
                ->where('sent.1.player', ['name' => 'Bob', 'username' => 'bob'])
            );
    }

    public function test_closed_and_expired_invitations_are_hidden()
    {
        $me = User::factory()->create();

        Invitation::factory()->for($me, 'invitee')->expired()->create();
        Invitation::factory()->for($me, 'invitee')->responded(InvitationStatus::Declined)->create();
        Invitation::factory()->for($me, 'inviter')->responded(InvitationStatus::Cancelled)->create();

        $this->actingAs($me)
            ->get(route('invites'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('received', 0)
                ->has('sent', 0)
            );
    }

    public function test_other_players_invitations_are_not_shown()
    {
        $me = User::factory()->create();
        Invitation::factory()->create();

        $this->actingAs($me)
            ->get(route('invites'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('received', 0)
                ->has('sent', 0)
            );
    }
}
