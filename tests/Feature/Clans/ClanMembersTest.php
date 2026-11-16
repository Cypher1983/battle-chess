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

    public function test_the_leader_can_remove_a_member()
    {
        $clan = Clan::factory()->create();
        $member = User::factory()->for($clan)->create();

        $this->actingAs($clan->leader)
            ->delete(route('clans.members.destroy', [$clan, $member]))
            ->assertRedirect();

        $this->assertNull($member->fresh()->clan_id);
    }

    public function test_members_cannot_remove_each_other()
    {
        $clan = Clan::factory()->create();
        $member = User::factory()->for($clan)->create();
        $other = User::factory()->for($clan)->create();

        $this->actingAs($member)
            ->delete(route('clans.members.destroy', [$clan, $other]))
            ->assertForbidden();

        $this->assertSame($clan->id, $other->fresh()->clan_id);
    }

    public function test_the_leader_cannot_remove_themselves()
    {
        $clan = Clan::factory()->create();

        $this->actingAs($clan->leader)
            ->delete(route('clans.members.destroy', [$clan, $clan->leader]))
            ->assertForbidden();

        $this->assertSame($clan->id, $clan->leader->fresh()->clan_id);
    }

    public function test_the_leader_cannot_remove_players_from_other_clans()
    {
        $clan = Clan::factory()->create();
        $other = Clan::factory()->create();
        $stranger = User::factory()->for($other)->create();

        $this->actingAs($clan->leader)
            ->delete(route('clans.members.destroy', [$clan, $stranger]))
            ->assertNotFound();

        $this->assertSame($other->id, $stranger->fresh()->clan_id);
    }

    public function test_the_leader_can_hand_over_leadership()
    {
        $clan = Clan::factory()->create();
        $leader = $clan->leader;
        $member = User::factory()->for($clan)->create();

        $this->actingAs($leader)
            ->post(route('clans.members.promote', [$clan, $member]))
            ->assertRedirect();

        $clan->refresh();
        $this->assertTrue($clan->leader->is($member));
        $this->assertSame($clan->id, $leader->fresh()->clan_id);
        $this->assertTrue($leader->fresh()->can('leave', $clan));
    }

    public function test_members_cannot_take_over_the_clan()
    {
        $clan = Clan::factory()->create();
        $member = User::factory()->for($clan)->create();

        $this->actingAs($member)
            ->post(route('clans.members.promote', [$clan, $member]))
            ->assertForbidden();

        $this->assertFalse($clan->refresh()->leader->is($member));
    }

    public function test_leadership_can_only_go_to_a_member()
    {
        $clan = Clan::factory()->create();
        $outsider = User::factory()->create();

        $this->actingAs($clan->leader)
            ->post(route('clans.members.promote', [$clan, $outsider]))
            ->assertNotFound();

        $this->assertFalse($clan->refresh()->leader->is($outsider));
    }
}
