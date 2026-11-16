<?php

namespace Tests\Feature\Models;

use App\Enums\GameStatus;
use App\Enums\PieceColor;
use App\Models\Clan;
use App\Models\Game;
use App\Models\Move;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_games_start_from_the_standard_position_with_white_to_move()
    {
        $game = Game::factory()->create();

        $this->assertSame(Game::START_FEN, $game->fen);
        $this->assertSame(GameStatus::Active, $game->status);
        $this->assertSame(PieceColor::White, $game->turn());
        $this->assertTrue($game->isActive());
    }

    public function test_players_know_their_colour()
    {
        $game = Game::factory()->create();
        $spectator = User::factory()->create();

        $this->assertSame(PieceColor::White, $game->colorOf($game->white));
        $this->assertSame(PieceColor::Black, $game->colorOf($game->black));
        $this->assertNull($game->colorOf($spectator));
        $this->assertTrue($game->hasPlayer($game->white));
        $this->assertFalse($game->hasPlayer($spectator));
        $this->assertSame($game->black_id, $game->playerIdFor(PieceColor::Black));
    }

    public function test_turn_follows_the_position()
    {
        $game = Game::factory()->atPosition('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')->create();

        $this->assertSame(PieceColor::Black, $game->turn());
        $this->assertTrue($game->isTurnOf($game->black));
        $this->assertFalse($game->isTurnOf($game->white));
    }

    public function test_nobody_can_move_in_a_finished_game()
    {
        $game = Game::factory()->finished()->create();

        $this->assertFalse($game->isActive());
        $this->assertFalse($game->isTurnOf($game->white));
    }

    public function test_involving_scope_finds_games_for_either_colour()
    {
        $me = User::factory()->create();
        $asWhite = Game::factory()->for($me, 'white')->create();
        $asBlack = Game::factory()->for($me, 'black')->create();
        Game::factory()->create();

        $this->assertEqualsCanonicalizing(
            [$asWhite->id, $asBlack->id],
            Game::involving($me)->pluck('id')->all(),
        );
    }

    public function test_active_scope_excludes_finished_games()
    {
        $active = Game::factory()->create();
        Game::factory()->finished()->create();

        $this->assertSame([$active->id], Game::active()->pluck('id')->all());
    }

    public function test_moves_are_ordered_by_ply()
    {
        $game = Game::factory()->create();
        Move::factory()->for($game)->create(['ply' => 2, 'san' => 'e5']);
        Move::factory()->for($game)->create(['ply' => 1, 'san' => 'e4']);

        $this->assertSame(['e4', 'e5'], $game->moves->pluck('san')->all());
    }

    public function test_games_remember_the_players_clans_until_a_clan_is_disbanded()
    {
        $white = Clan::factory()->create();
        $black = Clan::factory()->create();
        $game = Game::factory()->finished()->create([
            'white_clan_id' => $white->id,
            'black_clan_id' => $black->id,
        ]);

        $this->assertTrue($game->whiteClan->is($white));
        $this->assertTrue($game->blackClan->is($black));

        $white->delete();

        $this->assertNull($game->fresh()->white_clan_id);
        $this->assertSame($black->id, $game->fresh()->black_clan_id);
    }
}
