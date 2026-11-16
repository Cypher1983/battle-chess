<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WelcomeTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_see_the_landing_page()
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Welcome'));
    }

    public function test_players_see_the_landing_page()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Welcome'));
    }

    public function test_landing_page_shows_the_top_five_by_username_only()
    {
        foreach (range(1, 6) as $i) {
            $this->player("player_{$i}", 1200 + $i * 10, wins: 1);
        }
        $this->player('newcomer', 1500);

        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('leaders', 5)
                ->where('leaders.0.username', 'player_6')
                ->where('leaders.0.rank', 1)
                ->where('leaders.0.rating', 1260)
                ->where('leaders.4.username', 'player_2')
                ->missing('leaders.0.name')
                ->missing('leaders.0.id')
            );
    }

    private function player(string $username, int $rating, int $wins = 0): User
    {
        $user = User::factory()->create(['username' => $username]);
        $user->forceFill(['rating' => $rating, 'wins' => $wins])->save();

        return $user;
    }
}
