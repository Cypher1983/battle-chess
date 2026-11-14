<?php

use App\Actions\Games\MakeMove;
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

it('plays a move on the 3D board with the keyboard', function () {
    $game = Game::factory()->create();
    $this->actingAs($game->white);

    visit("/games/{$game->id}")
        ->assertSee('Reset view')
        ->keys('[data-square-3d="e2"]', ['Enter'])
        ->keys('[data-square-3d="e2"]', ['ArrowUp', 'ArrowUp'])
        ->keys('[data-square-3d="e4"]', ['Enter'])
        ->waitForText("Opponent's move")
        ->assertSeeIn('@move-list', 'e4')
        ->assertNoJavaScriptErrors();

    expect($game->refresh()->moves->sole()->san)->toBe('e4');
});

it('plays a 3D battle on a capture that can be skipped', function () {
    $game = Game::factory()->create();
    app(MakeMove::class)($game, $game->white, 'e2', 'e4');
    app(MakeMove::class)($game, $game->black, 'd7', 'd5');
    $this->actingAs($game->white);

    visit("/games/{$game->id}")
        ->assertSee('Reset view')
        ->keys('[data-square-3d="e4"]', ['Enter'])
        ->keys('[data-square-3d="e4"]', ['ArrowUp', 'ArrowLeft'])
        ->keys('[data-square-3d="d5"]', ['Enter'])
        ->assertPresent('@battle-overlay-3d')
        // Skip with the keyboard: a mouse click waits for the page to stop
        // animating, which the software renderer in CI makes very slow.
        ->keys('@battle-overlay-3d', ['Enter'])
        ->assertMissing('@battle-overlay-3d')
        ->assertSeeIn('@move-list', 'exd5')
        ->assertNoJavaScriptErrors();

    expect($game->refresh()->moves->last()->san)->toBe('exd5');
});

it('fits the board inside the window height', function () {
    $game = Game::factory()->create();
    $this->actingAs($game->white);

    $page = visit("/games/{$game->id}")->resize(1280, 560);
    $page->assertSee('Reset view');

    $bottom = $page->script(
        "document.querySelector('[data-test=\"chess-board-3d\"]').getBoundingClientRect().bottom",
    );

    expect($bottom)->toBeLessThanOrEqual(560);
});

it('rebuilds the 3D board at the chosen graphics quality', function () {
    $game = Game::factory()->create();
    $this->actingAs($game->white);

    visit("/games/{$game->id}")
        ->assertSee('Reset view')
        ->select('@graphics-quality', 'ultra')
        ->assertSee('Reset view')
        ->refresh()
        ->assertSelected('@graphics-quality', 'ultra')
        ->assertSee('Reset view')
        ->assertNoJavaScriptErrors();
});
