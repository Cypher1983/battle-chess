<?php

namespace Tests\Feature\Broadcasting;

use App\Events\GameUpdated;
use App\Models\Game;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class GameUpdatedTest extends TestCase
{
    use RefreshDatabase;

    public function test_moves_broadcast_a_game_update()
    {
        Event::fake([GameUpdated::class]);
        $game = Game::factory()->create();

        $this->actingAs($game->white)->post(route('games.moves.store', $game), ['from' => 'e2', 'to' => 'e4']);

        Event::assertDispatched(GameUpdated::class, fn (GameUpdated $event) => $event->game->is($game)
            && $event->game->fen === $game->refresh()->fen);
    }

    public function test_rejected_moves_do_not_broadcast()
    {
        Event::fake([GameUpdated::class]);
        $game = Game::factory()->create();

        $this->actingAs($game->white)->post(route('games.moves.store', $game), ['from' => 'e2', 'to' => 'e5']);

        Event::assertNotDispatched(GameUpdated::class);
    }

    public function test_resigning_and_draw_actions_broadcast()
    {
        Event::fake([GameUpdated::class]);
        $game = Game::factory()->create();

        $this->actingAs($game->white)->post(route('games.draw.offer', $game));
        $this->actingAs($game->black)->post(route('games.draw.decline', $game));
        $this->actingAs($game->black)->post(route('games.resign', $game));

        Event::assertDispatchedTimes(GameUpdated::class, 3);
    }

    public function test_actions_that_do_nothing_do_not_broadcast()
    {
        Event::fake([GameUpdated::class]);
        $game = Game::factory()->create();

        $this->actingAs($game->black)->post(route('games.draw.accept', $game));

        Event::assertNotDispatched(GameUpdated::class);
    }

    public function test_event_broadcasts_on_the_game_presence_channel()
    {
        $game = Game::factory()->create();
        $event = new GameUpdated($game);

        $channels = $event->broadcastOn();

        $this->assertInstanceOf(PresenceChannel::class, $channels[0]);
        $this->assertSame("presence-games.{$game->id}", $channels[0]->name);
        $this->assertSame('game.updated', $event->broadcastAs());
        $this->assertSame(['id' => $game->id, 'fen' => Game::START_FEN, 'status' => 'active'], $event->broadcastWith());
    }
}
