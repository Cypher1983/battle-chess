<?php

namespace App\Http\Controllers;

use App\Enums\InvitationStatus;
use App\Http\Requests\StoreInvitationRequest;
use App\Models\Invitation;
use App\Notifications\InvitationReceived;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class InvitationController extends Controller
{
    /**
     * Challenge another player by username or email.
     */
    public function store(StoreInvitationRequest $request): RedirectResponse
    {
        $invitation = $request->user()->sentInvitations()->create([
            'invitee_id' => $request->invitee()?->id,
            'email' => $request->inviteEmail(),
            'status' => InvitationStatus::Pending,
            'expires_at' => now()->addDays(Invitation::EXPIRES_AFTER_DAYS),
        ]);

        $notification = new InvitationReceived($invitation);

        if ($request->invitee() !== null) {
            $request->invitee()->notify($notification);
        } else {
            Notification::route('mail', $invitation->email)->notify($notification);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Challenge sent.')]);

        return back();
    }
}
