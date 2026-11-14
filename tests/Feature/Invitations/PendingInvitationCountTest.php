<?php

namespace Tests\Feature\Invitations;

use App\Enums\InvitationStatus;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PendingInvitationCountTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_invitation_count_is_shared_with_every_page()
    {
        $me = User::factory()->create();

        Invitation::factory()->count(2)->for($me, 'invitee')->create();
        Invitation::factory()->for($me, 'invitee')->expired()->create();
        Invitation::factory()->for($me, 'invitee')->responded(InvitationStatus::Declined)->create();
        Invitation::factory()->for($me, 'inviter')->create();

        $this->actingAs($me)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->where('pendingInvitations', 2));
    }

    public function test_guests_get_a_zero_count()
    {
        $this->get(route('login'))
            ->assertInertia(fn (Assert $page) => $page->where('pendingInvitations', 0));
    }
}
