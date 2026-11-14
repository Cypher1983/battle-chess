<?php

namespace App\Http\Controllers;

use App\Enums\InvitationStatus;
use App\Http\Requests\StoreInvitationRequest;
use App\Models\Invitation;
use App\Models\User;
use App\Notifications\InvitationReceived;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    /**
     * Show the player's open challenges, received and sent.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Invites', [
            'received' => $user->receivedInvitations()
                ->open()
                ->with('inviter')
                ->latest('id')
                ->get()
                ->map(fn (Invitation $invitation) => [
                    ...$this->present($invitation),
                    'player' => $this->presentPlayer($invitation->inviter),
                ]),
            'sent' => $user->sentInvitations()
                ->open()
                ->with('invitee')
                ->latest('id')
                ->get()
                ->map(fn (Invitation $invitation) => [
                    ...$this->present($invitation),
                    'player' => $invitation->invitee ? $this->presentPlayer($invitation->invitee) : null,
                    'email' => $invitation->email,
                ]),
        ]);
    }

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

    /**
     * Accept a challenge.
     */
    public function accept(Invitation $invitation): RedirectResponse
    {
        return $this->close($invitation, 'respond', InvitationStatus::Accepted, __('Challenge accepted.'));
    }

    /**
     * Decline a challenge.
     */
    public function decline(Invitation $invitation): RedirectResponse
    {
        return $this->close($invitation, 'respond', InvitationStatus::Declined, __('Challenge declined.'));
    }

    /**
     * Withdraw a challenge you sent.
     */
    public function cancel(Invitation $invitation): RedirectResponse
    {
        return $this->close($invitation, 'cancel', InvitationStatus::Cancelled, __('Challenge cancelled.'));
    }

    /**
     * Authorize and close an invitation, if it is still open.
     */
    private function close(Invitation $invitation, string $ability, InvitationStatus $status, string $message): RedirectResponse
    {
        Gate::authorize($ability, $invitation);

        if (! $invitation->isOpen()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This challenge is no longer open.')]);

            return back();
        }

        $invitation->close($status);

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    /**
     * The fields shared by received and sent invitations.
     *
     * @return array{id: int, sent_at: string, expires_at: string, expires_in: string}
     */
    private function present(Invitation $invitation): array
    {
        return [
            'id' => $invitation->id,
            'sent_at' => $invitation->created_at?->diffForHumans() ?? '',
            'expires_at' => $invitation->expires_at->toIso8601String(),
            'expires_in' => $invitation->expires_at->diffForHumans(),
        ];
    }

    /**
     * The public details of a player.
     *
     * @return array{name: string, username: string}
     */
    private function presentPlayer(User $user): array
    {
        return [
            'name' => $user->name,
            'username' => $user->username,
        ];
    }
}
