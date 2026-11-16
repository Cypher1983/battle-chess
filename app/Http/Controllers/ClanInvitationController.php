<?php

namespace App\Http\Controllers;

use App\Enums\InvitationStatus;
use App\Http\Requests\StoreClanInvitationRequest;
use App\Models\Clan;
use App\Models\ClanInvitation;
use App\Notifications\ClanInvitationReceived;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ClanInvitationController extends Controller
{
    /**
     * Invite a player who is not in a clan to join this one.
     */
    public function store(StoreClanInvitationRequest $request, Clan $clan): RedirectResponse
    {
        $invitee = $request->invitee();

        $invitation = $clan->invitations()->create([
            'inviter_id' => $request->user()->id,
            'invitee_id' => $invitee->id,
            'status' => InvitationStatus::Pending,
            'expires_at' => now()->addDays(ClanInvitation::EXPIRES_AFTER_DAYS),
        ]);

        $invitee->notify(new ClanInvitationReceived($invitation));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation sent.')]);

        return back();
    }

    /**
     * Join the clan, unless the player has joined another one since.
     */
    public function accept(Request $request, ClanInvitation $invitation): RedirectResponse
    {
        Gate::authorize('respond', $invitation);

        $this->ensureOpen($invitation);

        $user = $request->user();

        if ($user->clan_id !== null) {
            throw ValidationException::withMessages([
                'invitation' => __('Leave your current clan before joining another.'),
            ]);
        }

        DB::transaction(function () use ($invitation, $user) {
            $invitation->close(InvitationStatus::Accepted);

            $user->clan()->associate($invitation->clan)->save();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Welcome to :clan!', ['clan' => $invitation->clan->name])]);

        return back();
    }

    /**
     * Turn the invitation down.
     */
    public function decline(ClanInvitation $invitation): RedirectResponse
    {
        Gate::authorize('respond', $invitation);

        $this->ensureOpen($invitation);

        $invitation->close(InvitationStatus::Declined);

        return back();
    }

    /**
     * Withdraw an invitation the clan sent.
     */
    public function cancel(ClanInvitation $invitation): RedirectResponse
    {
        Gate::authorize('cancel', $invitation);

        $this->ensureOpen($invitation);

        $invitation->close(InvitationStatus::Cancelled);

        return back();
    }

    /**
     * Reject answers to invitations that were already answered or have expired.
     */
    private function ensureOpen(ClanInvitation $invitation): void
    {
        if (! $invitation->isOpen()) {
            throw ValidationException::withMessages([
                'invitation' => __('This invitation is no longer open.'),
            ]);
        }
    }
}
