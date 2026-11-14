<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class GamePagesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function pages(): array
    {
        return [
            'play' => ['play', 'Play'],
            'invites' => ['invites', 'Invites'],
            'scoreboard' => ['scoreboard', 'Scoreboard'],
        ];
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function routes(): array
    {
        return array_map(fn (array $page) => [$page[0]], self::pages());
    }

    #[DataProvider('routes')]
    public function test_guests_are_redirected_to_the_login_page(string $route)
    {
        $this->get(route($route))->assertRedirect(route('login'));
    }

    #[DataProvider('pages')]
    public function test_authenticated_users_can_visit_the_page(string $route, string $component)
    {
        $this->actingAs(User::factory()->create());

        $this->get(route($route))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component($component));
    }
}
