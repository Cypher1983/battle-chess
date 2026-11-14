<?php

namespace App\Enums;

enum InvitationStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Declined = 'declined';
    case Cancelled = 'cancelled';

    /**
     * Whether the invitation can still be answered.
     */
    public function isOpen(): bool
    {
        return $this === self::Pending;
    }
}
