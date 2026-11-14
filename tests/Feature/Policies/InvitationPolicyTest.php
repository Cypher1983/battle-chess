<?php

namespace Tests\Feature\Policies;

use App\Enums\InvitationStatus;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvitationPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_the_invitee_can_respond()
    {
        $invitation = Invitation::factory()->create();

        $this->assertTrue($invitation->invitee->can('respond', $invitation));
        $this->assertFalse($invitation->inviter->can('respond', $invitation));
        $this->assertFalse(User::factory()->create()->can('respond', $invitation));
    }

    public function test_only_the_inviter_can_cancel()
    {
        $invitation = Invitation::factory()->create();

        $this->assertTrue($invitation->inviter->can('cancel', $invitation));
        $this->assertFalse($invitation->invitee->can('cancel', $invitation));
        $this->assertFalse(User::factory()->create()->can('cancel', $invitation));
    }

    public function test_close_records_the_answer_and_time()
    {
        $invitation = Invitation::factory()->create();

        $invitation->close(InvitationStatus::Accepted);

        $invitation->refresh();
        $this->assertSame(InvitationStatus::Accepted, $invitation->status);
        $this->assertNotNull($invitation->responded_at);
        $this->assertFalse($invitation->isOpen());
    }
}
