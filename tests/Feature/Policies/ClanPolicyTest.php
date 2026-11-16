<?php

namespace Tests\Feature\Policies;

use App\Models\Clan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ClanPolicyTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{0: string}>
     */
    public static function leaderAbilities(): array
    {
        return [
            'update' => ['update'],
            'delete' => ['delete'],
            'manage members' => ['manageMembers'],
        ];
    }

    public function test_only_players_without_a_clan_can_found_one()
    {
        $clan = Clan::factory()->create();

        $this->assertTrue(User::factory()->create()->can('create', Clan::class));
        $this->assertFalse($clan->leader->can('create', Clan::class));
        $this->assertFalse(User::factory()->for($clan)->create()->can('create', Clan::class));
    }

    #[DataProvider('leaderAbilities')]
    public function test_only_the_leader_runs_the_clan(string $ability)
    {
        $clan = Clan::factory()->create();

        $this->assertTrue($clan->leader->can($ability, $clan));
        $this->assertFalse(User::factory()->for($clan)->create()->can($ability, $clan));
        $this->assertFalse(User::factory()->create()->can($ability, $clan));
    }

    public function test_only_members_other_than_the_leader_can_leave()
    {
        $clan = Clan::factory()->create();

        $this->assertTrue(User::factory()->for($clan)->create()->can('leave', $clan));
        $this->assertFalse($clan->leader->can('leave', $clan));
        $this->assertFalse(User::factory()->create()->can('leave', $clan));
    }
}
