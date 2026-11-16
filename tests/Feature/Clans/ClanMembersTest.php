<?php

namespace Tests\Feature\Clans;

use App\Models\Clan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClanMembersTest extends TestCase
{
    use RefreshDatabase;

    public function test_members_can_leave_the_clan()
    {
        $clan = Clan::factory()->create();
        $member = User::factory()->for($clan)->create();

        $this->actingAs($member)
            ->post(route('clans.leave', $clan))
            ->assertRedirect();

        $this->assertNull($member->fresh()->clan_id);
    }

    public function test_the_leader_cannot_leave_without_handing_over()
    {
        $clan = Clan::factory()->create();

        $this->actingAs($clan->leader)
            ->post(route('clans.leave', $clan))
            ->assertForbidden();

        $this->assertSame($clan->id, $clan->leader->fresh()->clan_id);
    }

    public function test_outsiders_cannot_leave_a_clan_they_are_not_in()
    {
        $clan = Clan::factory()->create();
        $other = Clan::factory()->create();
        $outsider = User::factory()->for($other)->create();

        $this->actingAs($outsider)
            ->post(route('clans.leave', $clan))
            ->assertForbidden();

        $this->assertSame($other->id, $outsider->fresh()->clan_id);
    }
}
