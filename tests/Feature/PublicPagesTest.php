<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_can_view_the_armies_page()
    {
        $this->get(route('armies'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('public/Armies'));
    }

    public function test_players_can_view_the_armies_page()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('armies'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('public/Armies'));
    }
}
