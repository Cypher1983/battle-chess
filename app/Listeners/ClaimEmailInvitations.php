<?php

namespace App\Listeners;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Str;

class ClaimEmailInvitations
{
    /**
     * Link invitations sent to an email address to the player who verified it.
     *
     * Claiming happens on verification, not registration, so nobody can
     * collect someone else's challenges by signing up with their address.
     */
    public function handle(Verified $event): void
    {
        $user = $event->user;

        if (! $user instanceof User) {
            return;
        }

        Invitation::query()
            ->whereNull('invitee_id')
            ->where('email', Str::lower($user->email))
            ->where('inviter_id', '!=', $user->id)
            ->update(['invitee_id' => $user->id]);
    }
}
