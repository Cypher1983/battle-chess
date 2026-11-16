<?php

namespace Tests\Feature\Clans;

use App\Models\Clan;
use App\Models\ClanInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DisbandClanTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_leader_can_disband_the_clan()
    {
        $clan = Clan::factory()->create();
        $leader = $clan->leader;
        $member = User::factory()->for($clan)->create();
        ClanInvitation::factory()->for($clan)->create();

        $this->actingAs($leader)
            ->delete(route('clans.destroy', $clan))
            ->assertRedirect();

        $this->assertModelMissing($clan);
        $this->assertNull($leader->fresh()->clan_id);
        $this->assertNull($member->fresh()->clan_id);
        $this->assertDatabaseCount('clan_invitations', 0);
    }

    public function test_members_and_outsiders_cannot_disband_the_clan()
    {
        $clan = Clan::factory()->create();

        foreach ([User::factory()->for($clan)->create(), User::factory()->create()] as $user) {
            $this->actingAs($user)
                ->delete(route('clans.destroy', $clan))
                ->assertForbidden();
        }

        $this->assertModelExists($clan);
    }
}
