<?php

namespace App\Notifications;

use App\Enums\InvitationStatus;
use App\Models\Game;
use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells the challenger, live, that their challenge was accepted or declined.
 */
class ChallengeAnswered extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public Invitation $invitation, public ?Game $game = null)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['broadcast'];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        $name = $this->invitation->invitee->name ?? __('Your opponent');
        $accepted = $this->invitation->status === InvitationStatus::Accepted;

        return new BroadcastMessage([
            'kind' => $accepted ? 'challenge.accepted' : 'challenge.declined',
            'message' => $accepted
                ? __(':name accepted your challenge. To battle!', ['name' => $name])
                : __(':name declined your challenge.', ['name' => $name]),
            'url' => $accepted && $this->game ? route('games.show', $this->game) : null,
        ]);
    }
}
