<?php

namespace Tests\Feature\Clans;

use App\Enums\EmblemIcon;
use App\Enums\EmblemShape;
use App\Models\Clan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateClanTest extends TestCase
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
            'tag' => 'IRON',
            'description' => 'Forged anew.',
            'emblem_shape' => 'banner',
            'emblem_icon' => 'flame',
            'emblem_primary' => '#ff0000',
            'emblem_secondary' => '#000000',
            ...$overrides,
        ];
    }

    public function test_the_leader_can_change_the_clan_and_its_emblem()
    {
        $clan = Clan::factory()->create();

        $this->actingAs($clan->leader)
            ->patch(route('clans.update', $clan), $this->clanDetails())
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $clan->refresh();
        $this->assertSame('Iron Ring', $clan->name);
        $this->assertSame('IRON', $clan->tag);
        $this->assertSame('Forged anew.', $clan->description);
        $this->assertSame(EmblemShape::Banner, $clan->emblem_shape);
        $this->assertSame(EmblemIcon::Flame, $clan->emblem_icon);
        $this->assertSame('#ff0000', $clan->emblem_primary);
        $this->assertSame('#000000', $clan->emblem_secondary);
    }

    public function test_the_leader_can_keep_the_current_name_and_tag()
    {
        $clan = Clan::factory()->create(['name' => 'Iron Ring', 'tag' => 'IRON']);

        $this->actingAs($clan->leader)
            ->patch(route('clans.update', $clan), $this->clanDetails())
            ->assertSessionHasNoErrors();
    }

    public function test_another_clans_name_and_tag_cannot_be_taken()
    {
        Clan::factory()->create(['name' => 'Iron Ring', 'tag' => 'IRON']);
        $clan = Clan::factory()->create();

        $this->actingAs($clan->leader)
            ->patch(route('clans.update', $clan), $this->clanDetails())
            ->assertSessionHasErrors(['name', 'tag']);
    }

    public function test_members_and_outsiders_cannot_change_the_clan()
    {
        $clan = Clan::factory()->create(['name' => 'Old Name']);

        foreach ([User::factory()->for($clan)->create(), User::factory()->create()] as $user) {
            $this->actingAs($user)
                ->patch(route('clans.update', $clan), $this->clanDetails())
                ->assertForbidden();
        }

        $this->assertSame('Old Name', $clan->refresh()->name);
    }
}
