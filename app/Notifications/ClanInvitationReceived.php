<?php

namespace App\Notifications;

use App\Models\ClanInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClanInvitationReceived extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public ClanInvitation $invitation)
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
        return ['mail', 'broadcast'];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'kind' => 'clan.invited',
            'message' => __(':clan invites you to join their clan!', ['clan' => $this->invitation->clan->name]),
            'url' => route('clan'),
        ]);
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $clan = $this->invitation->clan;
        $inviter = $this->invitation->inviter;

        return (new MailMessage)
            ->subject(__('You are invited to join :clan', ['clan' => $clan->name]))
            ->greeting(__('A clan wants you!'))
            ->line(__(':name (@:username) invites you to join :clan [:tag].', [
                'name' => $inviter->name,
                'username' => $inviter->username,
                'clan' => $clan->name,
                'tag' => $clan->tag,
            ]))
            ->action(__('View invitation'), route('clan'))
            ->line(__('This invitation expires on :date.', [
                'date' => $this->invitation->expires_at->toFormattedDayDateString(),
            ]));
    }
}
