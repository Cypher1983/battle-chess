<?php

namespace App\Policies;

use App\Models\ClanInvitation;
use App\Models\User;

class ClanInvitationPolicy
{
    /**
     * Only the invited player may accept or decline.
     */
    public function respond(User $user, ClanInvitation $invitation): bool
    {
        return $invitation->invitee_id === $user->id;
    }

    /**
     * Only the clan's current leader may cancel an invitation.
     */
    public function cancel(User $user, ClanInvitation $invitation): bool
    {
        return $invitation->clan->leader_id === $user->id;
    }
}
