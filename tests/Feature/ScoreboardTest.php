<?php

namespace Tests\Feature;

use App\Models\Clan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ScoreboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_players_are_ranked_by_rating_then_wins()
    {
        $me = $this->player('me', 1200, wins: 1, losses: 1);
        $this->player('champion', 1350, wins: 5);
        $this->player('runner_up', 1250, wins: 3, losses: 1);
        $this->player('tied_more_wins', 1200, wins: 2, losses: 2);
        $this->player('newcomer', 1200);

        $this->actingAs($me)
            ->get(route('scoreboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Scoreboard')
                ->has('players.data', 4)
                ->where('players.data.0.username', 'champion')
                ->where('players.data.0.rank', 1)
                ->where('players.data.1.username', 'runner_up')
                ->where('players.data.2.username', 'tied_more_wins')
                ->where('players.data.3.username', 'me')
                ->where('players.data.3.is_me', true)
                ->where('players.data.3.games', 2)
                ->where('me.rank', 4)
                ->where('me.rating', 1200)
            );
    }

    public function test_players_without_finished_games_are_not_ranked()
    {
        $me = $this->player('fresh', 1200);

        $this->actingAs($me)
            ->get(route('scoreboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('players.data', 0)
                ->where('me.rank', null)
                ->where('me.games', 0)
            );
    }

    public function test_scoreboard_is_paginated()
    {
        $me = $this->player('me', 1000, wins: 1);

        for ($i = 0; $i < 25; $i++) {
            $this->player("player_{$i}", 1300 + $i, wins: 1);
        }

        $this->actingAs($me)
            ->get(route('scoreboard', ['page' => 2]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('players.data', 1)
                ->where('players.data.0.username', 'me')
                ->where('players.data.0.rank', 26)
                ->where('players.current_page', 2)
                ->where('players.last_page', 2)
                ->where('me.rank', 26)
            );
    }

    public function test_guests_see_the_public_scoreboard_with_usernames_only()
    {
        $this->player('alpha', 1300, wins: 2);

        $this->get(route('scoreboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/Scoreboard')
                ->missing('me')
                ->where('players.data.0.username', 'alpha')
                ->where('players.data.0.rank', 1)
                ->missing('players.data.0.name')
                ->missing('players.data.0.is_me')
            );
    }

    public function test_signed_in_players_see_each_players_clan()
    {
        $me = $this->player('me', 1200, wins: 1);
        $clan = Clan::factory()->for($this->player('chief', 1300, wins: 2), 'leader')->create();

        $this->actingAs($me)
            ->get(route('scoreboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('players.data.0.username', 'chief')
                ->where('players.data.0.clan', $clan->summary())
                ->where('players.data.1.username', 'me')
                ->where('players.data.1.clan', null)
                ->where('me.clan', null)
            );
    }

    public function test_guests_do_not_see_clans()
    {
        Clan::factory()->for($this->player('chief', 1300, wins: 2), 'leader')->create();

        $this->get(route('scoreboard'))
            ->assertInertia(fn (Assert $page) => $page->missing('players.data.0.clan'));
    }

    private function player(string $username, int $rating, int $wins = 0, int $losses = 0, int $draws = 0): User
    {
        $user = User::factory()->create(['username' => $username]);
        $user->forceFill(compact('rating', 'wins', 'losses', 'draws'))->save();

        return $user;
    }
}
