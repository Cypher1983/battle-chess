<?php

namespace Tests\Feature\Invitations;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClaimEmailInvitationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_verifying_an_email_claims_invitations_sent_to_it()
    {
        $invitation = Invitation::factory()->forEmail('newbie@example.com')->create();
        $other = Invitation::factory()->forEmail('someone-else@example.com')->create();

        $user = User::factory()->unverified()->create(['email' => 'newbie@example.com']);

        $this->assertNull($invitation->refresh()->invitee_id);

        $this->actingAs($user)->get($this->verificationUrl($user));

        $this->assertTrue($invitation->refresh()->invitee->is($user));
        $this->assertNull($other->refresh()->invitee_id);
    }

    public function test_claimed_invitations_appear_on_the_invites_page()
    {
        Invitation::factory()->forEmail('newbie@example.com')->create();
        $user = User::factory()->unverified()->create(['email' => 'newbie@example.com']);

        $this->actingAs($user)->get($this->verificationUrl($user));

        $this->actingAs($user->refresh())
            ->get(route('invites'))
            ->assertInertia(fn (Assert $page) => $page->has('received', 1));
    }

    public function test_registration_alone_does_not_claim_invitations()
    {
        $invitation = Invitation::factory()->forEmail('newbie@example.com')->create();

        $this->post(route('register.store'), [
            'name' => 'Newbie',
            'username' => 'newbie',
            'email' => 'newbie@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $this->assertNull($invitation->refresh()->invitee_id);
    }

    private function verificationUrl(User $user): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)],
        );
    }
}
