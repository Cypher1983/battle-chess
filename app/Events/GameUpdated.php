<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Tells both players that a game changed, so their pages reload it.
 *
 * Only the id and position are sent; the server stays the source of truth.
 */
class GameUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Game $game)
    {
        //
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, PresenceChannel>
     */
    public function broadcastOn(): array
    {
        return [new PresenceChannel("games.{$this->game->id}")];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'game.updated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array{id: int, fen: string, status: string}
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->game->id,
            'fen' => $this->game->fen,
            'status' => $this->game->status->value,
        ];
    }
}
