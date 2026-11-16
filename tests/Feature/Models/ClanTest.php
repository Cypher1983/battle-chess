<?php

namespace Tests\Feature\Models;

use App\Enums\EmblemIcon;
use App\Enums\EmblemShape;
use App\Models\Clan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClanTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_clan_has_a_leader()
    {
        $leader = User::factory()->create();

        $clan = Clan::factory()->for($leader, 'leader')->create();

        $this->assertTrue($clan->leader->is($leader));
    }

    public function test_new_clans_get_a_default_emblem()
    {
        $clan = Clan::create([
            'name' => 'Iron Ring',
            'tag' => 'IRON',
            'leader_id' => User::factory()->create()->id,
        ])->fresh();

        $this->assertSame(EmblemShape::Shield, $clan->emblem_shape);
        $this->assertSame(EmblemIcon::Crown, $clan->emblem_icon);
        $this->assertSame([
            'shape' => 'shield',
            'icon' => 'crown',
            'primary' => '#b8860b',
            'secondary' => '#1f2937',
        ], $clan->emblem());
    }
}
