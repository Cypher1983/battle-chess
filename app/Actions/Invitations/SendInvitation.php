<?php

namespace App\Actions\Invitations;

use App\Enums\Army;
use App\Enums\InvitationStatus;
use App\Models\Invitation;
use App\Models\User;
use App\Notifications\InvitationReceived;
use Illuminate\Support\Facades\Notification;

class SendInvitation
{
    /**
     * Challenge a registered player, or invite an email address to join.
     * The challenger brings the given army, or their saved one.
     */
    public function __invoke(User $inviter, ?User $invitee, ?string $email = null, ?Army $army = null): Invitation
    {
        $invitation = $inviter->sentInvitations()->create([
            'invitee_id' => $invitee?->id,
            'email' => $invitee === null ? $email : null,
            'inviter_army' => $army ?? $inviter->army,
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
