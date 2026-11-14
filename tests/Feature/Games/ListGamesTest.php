<?php

namespace Tests\Feature\Games;

use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ListGamesTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_games_list_your_turn_first()
    {
        $me = User::factory()->create();
        $opponent = User::factory()->create(['name' => 'Olga', 'username' => 'olga']);

        // I am black and white has not moved: waiting on the opponent.
        $waiting = Game::factory()->for($opponent, 'white')->for($me, 'black')->create();
        // I am white at the start: my move.
        $myTurn = Game::factory()->for($me, 'white')->create();

        $this->actingAs($me)
            ->get(route('play'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Play')
                ->has('active', 2)
                ->where('active.0.id', $myTurn->id)
                ->where('active.0.your_turn', true)
                ->where('active.0.my_color', 'w')
                ->where('active.0.my_army', 'clockwork')
                ->where('active.1.id', $waiting->id)
                ->where('active.1.your_turn', false)
                ->where('active.1.my_color', 'b')
                ->where('active.1.my_army', 'wildwood')
                ->where('active.1.opponent', ['name' => 'Olga', 'username' => 'olga'])
            );
    }

    public function test_finished_games_show_the_outcome_for_the_viewer()
    {
        $me = User::factory()->create();

        Game::factory()->for($me, 'white')->finished(GameResult::WhiteWins, GameEndReason::Checkmate)->create(['finished_at' => now()->subDays(3)]);
        Game::factory()->for($me, 'white')->finished(GameResult::BlackWins, GameEndReason::Resignation)->create(['finished_at' => now()->subDays(2)]);
        Game::factory()->for($me, 'black')->finished(GameResult::Draw, GameEndReason::Stalemate)->create(['finished_at' => now()->subDay()]);

        $this->actingAs($me)
            ->get(route('play'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('active', 0)
                ->has('finished', 3)
                ->where('finished.0.outcome', 'draw')
                ->where('finished.0.end_reason', 'Stalemate')
                ->where('finished.1.outcome', 'loss')
                ->where('finished.2.outcome', 'win')
            );
    }

    public function test_other_players_games_are_not_listed()
    {
        Game::factory()->create();
        Game::factory()->finished()->create();

        $this->actingAs(User::factory()->create())
            ->get(route('play'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('active', 0)
                ->has('finished', 0)
            );
    }
}
