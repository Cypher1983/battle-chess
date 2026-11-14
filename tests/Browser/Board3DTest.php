<?php

use App\Models\Game;

it('shows the 3D board by default and remembers switching to 2D', function () {
    $game = Game::factory()->create();
    $this->actingAs($game->white);

    $page = visit("/games/{$game->id}")
        ->assertPresent('@chess-board-3d')
        ->assertSee('Reset view')
        ->assertMissing('@chess-board')
        ->assertNoJavaScriptErrors();

    $page->click('@board-3d-toggle')
        ->assertPresent('@chess-board')
        ->assertMissing('@chess-board-3d');

    $page->refresh()
        ->assertPresent('@chess-board')
        ->assertMissing('@chess-board-3d')
        ->assertNoJavaScriptErrors();
});
