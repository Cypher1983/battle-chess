<?php

use App\Models\User;

it('lets a guest browse the public pages', function () {
    $leader = User::factory()->create(['name' => 'Secret Name', 'username' => 'top_dog']);
    $leader->forceFill(['rating' => 1300, 'wins' => 3])->save();

    visit('/')
        ->assertSee('Chess where every capture is a fight')
        ->assertSee('top_dog')
        ->assertDontSee('Secret Name')
        ->assertNoJavaScriptErrors()
        ->click('@all-armies-link')
        ->assertPathIs('/armies')
        ->assertSee('Clockwork Legion')
        ->assertNoJavaScriptErrors();

    visit('/rules')
        ->assertSee('Special moves')
        ->assertSee('Rating')
        ->assertNoJavaScriptErrors();

    visit('/scoreboard')
        ->assertSee('top_dog')
        ->assertDontSee('Secret Name')
        ->assertNoJavaScriptErrors();
});
