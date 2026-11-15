<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppearanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_pages_are_dark_by_default()
    {
        $this->get(route('login'))
            ->assertOk()
            ->assertSee('class="dark"', false);
    }

    public function test_a_saved_light_appearance_is_respected()
    {
        $this->withUnencryptedCookie('appearance', 'light')
            ->get(route('login'))
            ->assertOk()
            ->assertDontSee('class="dark"', false);
    }

    public function test_a_saved_system_appearance_is_respected()
    {
        $this->withUnencryptedCookie('appearance', 'system')
            ->get(route('login'))
            ->assertOk()
            ->assertDontSee('class="dark"', false)
            ->assertSee("const appearance = 'system'", false);
    }
}
