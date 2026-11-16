<?php

namespace App\Http\Controllers;

use App\Actions\Games\StartGame;
use App\Actions\Invitations\SendInvitation;
use App\Enums\InvitationStatus;
use App\Http\Requests\AcceptInvitationRequest;
use App\Http\Requests\StoreInvitationRequest;
use App\Models\Invitation;
use App\Models\User;
use App\Notifications\ChallengeAnswered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
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
            'my_army' => $user->army->value,
            'received' => $user->receivedInvitations()
                ->open()
                ->with('inviter.clan')
                ->latest('id')
                ->get()
                ->map(fn (Invitation $invitation) => [
                    ...$this->present($invitation),
                    'player' => $this->presentPlayer($invitation->inviter),
                ]),
            'sent' => $user->sentInvitations()
                ->open()
                ->with(['inviter', 'invitee.clan'])
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
    public function store(StoreInvitationRequest $request, SendInvitation $sendInvitation): RedirectResponse
    {
        $sendInvitation(
            $request->user(),
            $request->invitee(),
            $request->inviteEmail(),
            $request->army(),
            $request->boardTheme(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Challenge sent.')]);

        return back();
    }

    /**
     * Accept a challenge, bringing the army picked for it.
     */
    public function accept(AcceptInvitationRequest $request, Invitation $invitation, StartGame $startGame): RedirectResponse
    {
        Gate::authorize('respond', $invitation);

        $army = $request->army();

        $game = DB::transaction(function () use ($invitation, $startGame, $army) {
            $invitation = Invitation::query()->lockForUpdate()->findOrFail($invitation->id);

            if (! $invitation->isOpen()) {
                return null;
            }

            $invitation->close(InvitationStatus::Accepted);

            return $startGame($invitation, $army);
        });

        if ($game === null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This challenge is no longer open.')]);

            return back();
        }

        $invitation->refresh()->inviter->notify(new ChallengeAnswered($invitation, $game));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Challenge accepted. To battle!')]);

        return to_route('games.show', $game);
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

        if ($status === InvitationStatus::Declined) {
            $invitation->inviter->notify(new ChallengeAnswered($invitation));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    /**
     * The fields shared by received and sent invitations.
     *
     * @return array{id: int, army: string, board_theme: string, sent_at: string, expires_at: string, expires_in: string}
     */
    private function present(Invitation $invitation): array
    {
        return [
            'id' => $invitation->id,
            'army' => $invitation->challengerArmy()->value,
            'board_theme' => $invitation->board_theme->value,
            'sent_at' => $invitation->created_at?->diffForHumans() ?? '',
            'expires_at' => $invitation->expires_at->toIso8601String(),
            'expires_in' => $invitation->expires_at->diffForHumans(),
        ];
    }

    /**
     * The public details of a player.
     *
     * @return array{name: string, username: string, clan: array<string, mixed>|null}
     */
    private function presentPlayer(User $user): array
    {
        return [
            'name' => $user->name,
            'username' => $user->username,
            'clan' => $user->clan?->summary(),
        ];
    }
}
