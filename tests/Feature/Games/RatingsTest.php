<?php

namespace Tests\Feature\Games;

use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Models\Clan;
use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RatingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_players_start_at_1200_with_an_empty_record()
    {
        $user = User::factory()->create()->refresh();

        $this->assertSame(1200, $user->rating);
        $this->assertSame([0, 0, 0], [$user->wins, $user->losses, $user->draws]);
    }

    public function test_checkmate_updates_ratings_and_records()
    {
        $game = Game::factory()->create();

        $this->playMoves($game, [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]);

        $white = $game->white->refresh();
        $black = $game->black->refresh();
        $game->refresh();

        $this->assertSame(1184, $white->rating);
        $this->assertSame(1216, $black->rating);
        $this->assertSame([0, 1, 0], [$white->wins, $white->losses, $white->draws]);
        $this->assertSame([1, 0, 0], [$black->wins, $black->losses, $black->draws]);

        $this->assertSame(1200, $game->white_rating_before);
        $this->assertSame(1200, $game->black_rating_before);
        $this->assertSame(-16, $game->white_rating_change);
        $this->assertSame(16, $game->black_rating_change);
    }

    public function test_resignation_updates_ratings()
    {
        $game = Game::factory()->create();

        $this->actingAs($game->black)->post(route('games.resign', $game));

        $this->assertSame(1216, $game->white->refresh()->rating);
        $this->assertSame(1184, $game->black->refresh()->rating);
        $this->assertSame(1, $game->white->wins);
        $this->assertSame(1, $game->black->losses);
    }

    public function test_agreed_draw_between_unequal_players_moves_ratings_towards_each_other()
    {
        $strong = User::factory()->create();
        $strong->forceFill(['rating' => 1500])->save();
        $weak = User::factory()->create();

        $game = Game::factory()->for($strong, 'white')->for($weak, 'black')->create();
        $game->update(['draw_offered_by_id' => $weak->id]);

        $this->actingAs($strong)->post(route('games.draw.accept', $game));

        $this->assertSame(1489, $strong->refresh()->rating);
        $this->assertSame(1211, $weak->refresh()->rating);
        $this->assertSame(1, $strong->draws);
        $this->assertSame(1, $weak->draws);
        $this->assertSame(GameEndReason::DrawAgreed, $game->refresh()->end_reason);
    }

    public function test_finished_games_remember_the_clans_the_players_were_in()
    {
        $clan = Clan::factory()->create();
        $member = User::factory()->for($clan)->create();
        $loner = User::factory()->create();
        $game = Game::factory()->for($member, 'white')->for($loner, 'black')->create();

        $this->actingAs($loner)->post(route('games.resign', $game));

        $member->forceFill(['clan_id' => null])->save();

        $game->refresh();
        $this->assertSame($clan->id, $game->white_clan_id);
        $this->assertNull($game->black_clan_id);
    }

    public function test_ratings_are_only_applied_once()
    {
        $game = Game::factory()->create();

        $this->actingAs($game->black)->post(route('games.resign', $game));
        $this->actingAs($game->white)->post(route('games.resign', $game));

        $this->assertSame(1216, $game->white->refresh()->rating);
        $this->assertSame(GameResult::WhiteWins, $game->refresh()->result);
    }

    /**
     * @param  array<int, array{0: string, 1: string}>  $moves
     */
    private function playMoves(Game $game, array $moves): void
    {
        foreach ($moves as $index => [$from, $to]) {
            $player = $index % 2 === 0 ? $game->white : $game->black;

            $this->actingAs($player)
                ->post(route('games.moves.store', $game), ['from' => $from, 'to' => $to])
                ->assertSessionHasNoErrors();
        }
    }
}
