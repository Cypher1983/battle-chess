<?php

namespace Tests\Feature\Clans;

use App\Enums\EmblemIcon;
use App\Enums\EmblemShape;
use App\Models\Clan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FoundClanTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function clanDetails(array $overrides = []): array
    {
        return [
            'name' => 'Iron Ring',
            'tag' => 'iron',
            'description' => 'We never castle.',
            'emblem_shape' => 'hex',
            'emblem_icon' => 'wolf',
            'emblem_primary' => '#AA3300',
            'emblem_secondary' => '#112233',
            ...$overrides,
        ];
    }

    public function test_guests_cannot_found_a_clan()
    {
        $this->post(route('clans.store'), $this->clanDetails())
            ->assertRedirect(route('login'));

        $this->assertDatabaseCount('clans', 0);
    }

    public function test_players_can_found_a_clan_and_lead_it()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('clans.store'), $this->clanDetails())
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $clan = Clan::sole();
        $this->assertSame('Iron Ring', $clan->name);
        $this->assertSame('IRON', $clan->tag);
        $this->assertSame('We never castle.', $clan->description);
        $this->assertSame(EmblemShape::Hex, $clan->emblem_shape);
        $this->assertSame(EmblemIcon::Wolf, $clan->emblem_icon);
        $this->assertSame('#aa3300', $clan->emblem_primary);
        $this->assertSame('#112233', $clan->emblem_secondary);
        $this->assertTrue($clan->leader->is($user));
        $this->assertTrue($user->fresh()->clan->is($clan));
    }

    public function test_players_already_in_a_clan_cannot_found_another()
    {
        $clan = Clan::factory()->create();
        $member = User::factory()->for($clan)->create();

        $this->actingAs($member)
            ->post(route('clans.store'), $this->clanDetails())
            ->assertForbidden();

        $this->assertDatabaseCount('clans', 1);
    }

    public function test_names_and_tags_must_be_unique()
    {
        Clan::factory()->create(['name' => 'Iron Ring', 'tag' => 'IRON']);

        $this->actingAs(User::factory()->create())
            ->post(route('clans.store'), $this->clanDetails())
            ->assertSessionHasErrors(['name', 'tag']);
    }

    public function test_the_details_are_validated()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('clans.store'), $this->clanDetails([
                'name' => 'X',
                'tag' => 'TOOLONG',
                'description' => str_repeat('a', 281),
                'emblem_shape' => 'triangle',
                'emblem_icon' => 'banana',
                'emblem_primary' => 'red',
                'emblem_secondary' => '#12345',
            ]))
            ->assertSessionHasErrors(['name', 'tag', 'description', 'emblem_shape', 'emblem_icon', 'emblem_primary', 'emblem_secondary']);

        $this->assertDatabaseCount('clans', 0);
    }

    public function test_the_description_is_optional()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('clans.store'), $this->clanDetails(['description' => '']))
            ->assertSessionHasNoErrors();

        $this->assertNull(Clan::sole()->description);
    }
}
