<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_dashboard_shows_rating_record_and_games_awaiting_a_move()
    {
        $me = User::factory()->create();
        $me->forceFill(['rating' => 1234, 'wins' => 3, 'losses' => 2, 'draws' => 1])->save();

        Game::factory()->for($me, 'white')->create();                    // my move
        Game::factory()->for($me, 'black')->create();                    // opponent's move
        Game::factory()->for($me, 'white')->finished()->create();        // not active

        $this->actingAs($me)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('stats', [
                    'rating' => 1234,
                    'wins' => 3,
                    'losses' => 2,
                    'draws' => 1,
                    'active_games' => 2,
                    'your_turn' => 1,
                ])
            );
    }
}
