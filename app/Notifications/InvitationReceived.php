<?php

namespace App\Notifications;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvitationReceived extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public Invitation $invitation)
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
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $inviter = $this->invitation->inviter;
        $hasAccount = $this->invitation->invitee_id !== null;

        $message = (new MailMessage)
            ->subject(__(':name challenges you to Battle Chess', ['name' => $inviter->name]))
            ->greeting(__('You have been challenged!'))
            ->line(__(':name (@:username) wants to face you on the battlefield.', [
                'name' => $inviter->name,
                'username' => $inviter->username,
            ]));

        if ($hasAccount) {
            $message->action(__('View challenge'), route('invites'));
        } else {
            $message
                ->line(__('Create a free account with this email address to accept.'))
                ->action(__('Join Battle Chess'), route('register'));
        }

        return $message->line(__('This challenge expires on :date.', [
            'date' => $this->invitation->expires_at->toFormattedDayDateString(),
        ]));
    }
}
