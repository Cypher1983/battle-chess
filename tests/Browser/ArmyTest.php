<?php

use App\Enums\Army;
use App\Models\User;

it('chooses an army in the settings', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    visit('/settings/army')
        ->assertSee('Your army')
        ->assertSee('Clockwork Legion')
        ->click('@army-wildwood')
        ->click('@choose-army-button')
        ->assertSee('Army chosen')
        ->assertNoJavaScriptErrors();

    expect($user->refresh()->army)->toBe(Army::Wildwood);
});
