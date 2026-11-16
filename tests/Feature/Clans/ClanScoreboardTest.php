<?php

namespace Tests\Feature\Clans;

use App\Models\Clan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClanScoreboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_see_how_clans_compare()
    {
        $this->get(route('scoreboard.clans'))->assertRedirect(route('login'));
    }

    public function test_clans_are_ranked_by_the_average_rating_of_members_who_have_played()
    {
        $strong = $this->clan('Strong', [[1400, 3, 0, 0], [1300, 1, 1, 0]]);
        $mine = $this->clan('Mine', [[1250, 2, 1, 1], [1000, 0, 0, 0]]);
        $this->clan('Unplayed', [[1200, 0, 0, 0]]);
        $me = User::factory()->for($mine)->create();

        $this->actingAs($me)
            ->get(route('scoreboard.clans'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ClanScoreboard')
                ->has('clans.data', 2)
                ->where('clans.data.0.rank', 1)
                ->where('clans.data.0.name', 'Strong')
                ->where('clans.data.0.rating', 1350)
                ->where('clans.data.0.members', 2)
                ->where('clans.data.0.wins', 4)
                ->where('clans.data.0.losses', 1)
                ->where('clans.data.0.is_mine', false)
                ->where('clans.data.0.emblem', $strong->emblem())
                ->where('clans.data.1.rank', 2)
                ->where('clans.data.1.name', 'Mine')
                ->where('clans.data.1.rating', 1250)
                ->where('clans.data.1.members', 3)
                ->where('clans.data.1.wins', 2)
                ->where('clans.data.1.losses', 1)
                ->where('clans.data.1.draws', 1)
                ->where('clans.data.1.is_mine', true)
            );
    }

    public function test_ties_are_broken_by_wins()
    {
        $this->clan('Fewer', [[1200, 1, 0, 0]]);
        $this->clan('More', [[1200, 4, 3, 0]]);

        $this->actingAs(User::factory()->create())
            ->get(route('scoreboard.clans'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('clans.data.0.name', 'More')
                ->where('clans.data.1.name', 'Fewer')
            );
    }

    /**
     * A clan whose members have the given [rating, wins, losses, draws]; the first is its leader.
     *
     * @param  list<array{0: int, 1: int, 2: int, 3: int}>  $members
     */
    private function clan(string $name, array $members): Clan
    {
        $stats = fn (array $member) => [
            'rating' => $member[0],
            'wins' => $member[1],
            'losses' => $member[2],
            'draws' => $member[3],
        ];

        $leader = User::factory()->create($stats(array_shift($members)));
        $clan = Clan::factory()->for($leader, 'leader')->create(['name' => $name]);

        foreach ($members as $member) {
            User::factory()->for($clan)->create($stats($member));
        }

        return $clan;
    }
}
