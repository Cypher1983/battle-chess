<?php

namespace App\Http\Controllers;

use App\Enums\InvitationStatus;
use App\Http\Requests\StoreInvitationRequest;
use App\Models\Invitation;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class InvitationController extends Controller
{
    /**
     * Challenge another player by username or email.
     */
    public function store(StoreInvitationRequest $request): RedirectResponse
    {
        $request->user()->sentInvitations()->create([
            'invitee_id' => $request->invitee()?->id,
            'email' => $request->inviteEmail(),
            'status' => InvitationStatus::Pending,
            'expires_at' => now()->addDays(Invitation::EXPIRES_AFTER_DAYS),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Challenge sent.')]);

        return back();
    }
}
