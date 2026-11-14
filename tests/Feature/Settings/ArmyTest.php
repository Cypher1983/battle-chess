<?php

namespace Tests\Feature\Settings;

use App\Enums\Army;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ArmyTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_army_picker_shows_the_current_army()
    {
        $user = User::factory()->create(['army' => Army::Wildwood]);

        $this->actingAs($user)
            ->get(route('army.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/Army')
                ->where('army', 'wildwood')
            );
    }

    public function test_new_players_command_the_clockwork_legion()
    {
        $this->assertSame(Army::Clockwork, User::factory()->create()->refresh()->army);
    }

    public function test_a_player_can_choose_another_army()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patch(route('army.update'), ['army' => 'wildwood'])
            ->assertRedirect(route('army.edit'));

        $this->assertSame(Army::Wildwood, $user->refresh()->army);
    }

    public function test_only_known_armies_can_be_chosen()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patch(route('army.update'), ['army' => 'dragons'])
            ->assertSessionHasErrors('army');

        $this->assertSame(Army::Clockwork, $user->refresh()->army);
    }

    public function test_guests_cannot_choose_an_army()
    {
        $this->get(route('army.edit'))->assertRedirect(route('login'));
    }
}
