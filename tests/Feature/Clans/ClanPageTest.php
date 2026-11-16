<?php

namespace Tests\Feature\Clans;

use App\Models\Clan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClanPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_sent_to_log_in()
    {
        $this->get(route('clan'))->assertRedirect(route('login'));
    }

    public function test_players_without_a_clan_are_offered_to_found_one()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('clan'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Clan')
                ->where('clan', null)
            );
    }

    public function test_members_see_their_clan()
    {
        $clan = Clan::factory()->create([
            'name' => 'Iron Ring',
            'tag' => 'IRON',
            'description' => 'We never castle.',
            'emblem_shape' => 'hex',
            'emblem_icon' => 'wolf',
            'emblem_primary' => '#aa3300',
            'emblem_secondary' => '#112233',
        ]);
        $member = User::factory()->for($clan)->create();

        $this->actingAs($member)
            ->get(route('clan'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Clan')
                ->where('clan.id', $clan->id)
                ->where('clan.name', 'Iron Ring')
                ->where('clan.tag', 'IRON')
                ->where('clan.description', 'We never castle.')
                ->where('clan.emblem', [
                    'shape' => 'hex',
                    'icon' => 'wolf',
                    'primary' => '#aa3300',
                    'secondary' => '#112233',
                ])
                ->where('clan.is_leader', false)
            );

        $this->actingAs($clan->leader)
            ->get(route('clan'))
            ->assertInertia(fn (Assert $page) => $page->where('clan.is_leader', true));
    }
}
