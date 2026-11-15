<?php

use App\Actions\Games\MakeMove;
use App\Enums\Army;
use App\Enums\BoardTheme;
use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Models\Game;
use App\Models\Invitation;
use App\Models\User;
use Pest\Browser\Api\AwaitableWebpage;

/**
 * Play moves on the server, alternating white and black.
 *
 * @param  array<int, array{0: string, 1: string}>  $moves
 */
function playMoves(Game $game, array $moves): void
{
    foreach ($moves as $index => [$from, $to]) {
        app(MakeMove::class)($game, $index % 2 === 0 ? $game->white : $game->black, $from, $to);
    }
}

function square(string $name): string
{
    return "[data-square=\"{$name}\"]";
}

/**
 * Visit a page with the 2D board chosen, so squares can be clicked as
 * buttons. The choice is remembered in the browser's local storage.
 */
function visitIn2d(string $url): AwaitableWebpage
{
    $page = visit($url);
    $page->script("localStorage.setItem('battle-chess:board-view', '2d')");

    return $page->refresh();
}

it('starts a game from an accepted challenge with the armies both players pick', function () {
    $alice = User::factory()->create(['name' => 'Alice', 'username' => 'alice']);
    $bob = User::factory()->create(['name' => 'Bob', 'username' => 'bob']);

    $this->actingAs($alice);

    visit('/invites')
        ->fill('recipient', 'bob')
        ->click('@send-challenge-button')
        ->assertSee('Choose your army')
        ->click('@army-viking')
        ->click('@confirm-army-button')
        ->assertSee('Challenge sent')
        ->assertSee('@bob');

    expect(Invitation::sole()->inviter_army)->toBe(Army::Viking);

    $this->actingAs($bob);

    visitIn2d('/invites')
        ->assertSee('Alice')
        ->assertSee('Leads the Viking Clans')
        ->click('@accept-invitation-button')
        ->assertSee("Your opponent's army")
        ->assertPresent('[data-test="army-viking"][data-unavailable]')
        ->click('@army-zombie')
        ->click('@confirm-army-button')
        ->assertPathBeginsWith('/games/')
        ->assertPresent('@chess-board')
        ->assertSee('Alice')
        ->assertNoJavaScriptErrors();

    $game = Game::sole();
    expect($game->invitation_id)->toBe(Invitation::sole()->id)
        ->and([$game->white_army, $game->black_army])->toEqualCanonicalizing([Army::Viking, Army::Zombie]);
});

it('moves a piece by clicking squares', function () {
    $game = Game::factory()->create();
    $this->actingAs($game->white);

    visitIn2d("/games/{$game->id}")
        ->assertSee('Your move')
        ->click(square('e2'))
        ->assertPresent(square('e4').' span.rounded-full')
        ->click(square('e4'))
        ->waitForText("Opponent's move")
        ->assertSeeIn('@move-list', 'e4')
        ->assertNoJavaScriptErrors();

    expect($game->refresh()->moves->sole()->san)->toBe('e4');
});

it('promotes a pawn using the picker', function () {
    $game = Game::factory()->create();
    playMoves($game, [
        ['h2', 'h4'], ['g7', 'g5'], ['h4', 'g5'], ['g8', 'f6'],
        ['g5', 'g6'], ['f6', 'g8'], ['g6', 'g7'], ['g8', 'f6'],
    ]);
    $this->actingAs($game->white);

    visitIn2d("/games/{$game->id}")
        ->click(square('g7'))
        ->click(square('h8'))
        ->assertSee('Promote your pawn to')
        ->assertSee('Arc Duchess')
        ->click('@promote-q')
        ->waitForText('gxh8=Q')
        ->assertNoJavaScriptErrors();

    expect($game->refresh()->moves->last()->san)->toBe('gxh8=Q');
});

it('plays a battle scene on a capture that can be skipped', function () {
    $game = Game::factory()->create();
    playMoves($game, [['e2', 'e4'], ['d7', 'd5']]);
    $this->actingAs($game->white);

    visitIn2d("/games/{$game->id}")
        ->click(square('e4'))
        ->click(square('d5'))
        ->assertPresent('@battle-overlay')
        ->click('@battle-overlay')
        ->assertMissing('@battle-overlay')
        ->assertSeeIn('@move-list', 'exd5')
        ->assertNoJavaScriptErrors();
});

it('ends the game on checkmate and offers a rematch', function () {
    $game = Game::factory()->create();
    playMoves($game, [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4']]);
    $this->actingAs($game->black);

    visitIn2d("/games/{$game->id}")
        ->click(square('d8'))
        ->click(square('h4'))
        ->waitForText('Wildwood Court wins')
        ->assertSee('Checkmate')
        ->assertSee('1216')
        ->click('@rematch-button')
        ->assertSee('Choose your army')
        ->click('@confirm-army-button')
        ->assertSee('Rematch challenge sent')
        ->assertNoJavaScriptErrors();

    $game->refresh();
    expect($game->result)->toBe(GameResult::BlackWins)
        ->and($game->end_reason)->toBe(GameEndReason::Checkmate)
        ->and(Invitation::sole()->inviter_id)->toBe($game->black_id)
        ->and(Invitation::sole()->inviter_army)->toBe($game->black_army);
});

it('resigns after confirming', function () {
    $game = Game::factory()->create();
    $this->actingAs($game->white);

    $page = visitIn2d("/games/{$game->id}");
    $page->script('window.confirm = () => true');

    $page->click('@resign-button')
        ->waitForText('Wildwood Court wins')
        ->assertSee('Resignation')
        ->assertPresent('@rematch-button');

    expect($game->refresh()->end_reason)->toBe(GameEndReason::Resignation);
});

it('keeps playing when resignation is cancelled', function () {
    $game = Game::factory()->create();
    $this->actingAs($game->white);

    visitIn2d("/games/{$game->id}")
        ->click('@resign-button')
        ->assertSee('Your move')
        ->assertPresent('@resign-button');

    expect($game->refresh()->isActive())->toBeTrue();
});

it('plays on the board the challenger picked', function () {
    $alice = User::factory()->create(['name' => 'Alice', 'username' => 'alice']);
    $bob = User::factory()->create(['name' => 'Bob', 'username' => 'bob']);

    $this->actingAs($alice);

    visit('/invites')
        ->fill('recipient', 'bob')
        ->click('@send-challenge-button')
        ->click('@board-theme-marble')
        ->click('@confirm-army-button')
        ->assertSee('Challenge sent');

    expect(Invitation::sole()->board_theme)->toBe(BoardTheme::Marble);

    $this->actingAs($bob);

    visitIn2d('/invites')
        ->click('@accept-invitation-button')
        ->assertSee('on the Marble board')
        ->click('@confirm-army-button')
        ->assertPathBeginsWith('/games/')
        ->assertPresent('[data-test="chess-board"][data-board-theme="marble"]')
        ->assertNoJavaScriptErrors();

    expect(Game::sole()->board_theme)->toBe(BoardTheme::Marble);
});
