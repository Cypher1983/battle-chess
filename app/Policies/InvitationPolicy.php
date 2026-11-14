<?php

namespace App\Policies;

use App\Models\Invitation;
use App\Models\User;

class InvitationPolicy
{
    /**
     * Only the challenged player may accept or decline.
     */
    public function respond(User $user, Invitation $invitation): bool
    {
        return $invitation->invitee_id === $user->id;
    }

    /**
     * Only the player who sent the challenge may cancel it.
     */
    public function cancel(User $user, Invitation $invitation): bool
    {
        return $invitation->inviter_id === $user->id;
    }
}
