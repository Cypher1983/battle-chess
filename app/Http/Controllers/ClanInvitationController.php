<?php

namespace App\Http\Controllers;

use App\Enums\InvitationStatus;
use App\Http\Requests\StoreClanInvitationRequest;
use App\Models\Clan;
use App\Models\ClanInvitation;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class ClanInvitationController extends Controller
{
    /**
     * Invite a player who is not in a clan to join this one.
     */
    public function store(StoreClanInvitationRequest $request, Clan $clan): RedirectResponse
    {
        $clan->invitations()->create([
            'inviter_id' => $request->user()->id,
            'invitee_id' => $request->invitee()->id,
            'status' => InvitationStatus::Pending,
            'expires_at' => now()->addDays(ClanInvitation::EXPIRES_AFTER_DAYS),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation sent.')]);

        return back();
    }
}
