<?php

namespace Tests\Feature\Broadcasting;

use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Tests\TestCase;

class GameChannelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Use the Reverb (Pusher protocol) broadcaster so channel auth is
        // signed locally; no Reverb server is contacted.
        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'test-key',
            'broadcasting.connections.reverb.secret' => 'test-secret',
            'broadcasting.connections.reverb.app_id' => 'test-app',
        ]);

        Broadcast::purge();
        require base_path('routes/channels.php');
    }

    public function test_players_can_join_their_game_channel()
    {
        $game = Game::factory()->create();

        $response = $this->actingAs($game->black)->post('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => "presence-games.{$game->id}",
        ]);

        $response->assertOk();
        $channelData = json_decode($response->json('channel_data'), true);
        $this->assertSame((string) $game->black_id, (string) $channelData['user_id']);
        $this->assertSame(['id' => $game->black_id, 'username' => $game->black->username, 'color' => 'b'], $channelData['user_info']);
    }

    public function test_other_users_cannot_join_a_game_channel()
    {
        $game = Game::factory()->create();

        $this->actingAs(User::factory()->create())->post('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => "presence-games.{$game->id}",
        ])->assertForbidden();
    }

    public function test_users_can_only_join_their_own_private_channel()
    {
        $me = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($me)->post('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => "private-App.Models.User.{$me->id}",
        ])->assertOk();

        $this->actingAs($me)->post('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => "private-App.Models.User.{$other->id}",
        ])->assertForbidden();
    }
}
