<?php

namespace App\Actions\Invitations;

use App\Enums\InvitationStatus;
use App\Models\Invitation;
use App\Models\User;
use App\Notifications\InvitationReceived;
use Illuminate\Support\Facades\Notification;

class SendInvitation
{
    /**
     * Challenge a registered player, or invite an email address to join.
     */
    public function __invoke(User $inviter, ?User $invitee, ?string $email = null): Invitation
    {
        $invitation = $inviter->sentInvitations()->create([
            'invitee_id' => $invitee?->id,
            'email' => $invitee === null ? $email : null,
            'status' => InvitationStatus::Pending,
            'expires_at' => now()->addDays(Invitation::EXPIRES_AFTER_DAYS),
        ]);

        $notification = new InvitationReceived($invitation);

        if ($invitee !== null) {
            $invitee->notify($notification);
        } else {
            Notification::route('mail', $invitation->email)->notify($notification);
        }

        return $invitation;
    }
}
