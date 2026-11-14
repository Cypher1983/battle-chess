<?php

use App\Http\Controllers\GameActionController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\GameMoveController;
use App\Http\Controllers\InvitationController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'Welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'Dashboard')->name('dashboard');
    Route::get('play', [GameController::class, 'index'])->name('play');
    Route::get('invites', [InvitationController::class, 'index'])->name('invites');
    Route::post('invitations', [InvitationController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('invitations.store');
    Route::post('invitations/{invitation}/accept', [InvitationController::class, 'accept'])->name('invitations.accept');
    Route::post('invitations/{invitation}/decline', [InvitationController::class, 'decline'])->name('invitations.decline');
    Route::post('invitations/{invitation}/cancel', [InvitationController::class, 'cancel'])->name('invitations.cancel');
    Route::inertia('scoreboard', 'Scoreboard')->name('scoreboard');

    Route::get('games/{game}', [GameController::class, 'show'])->name('games.show');
    Route::post('games/{game}/moves', [GameMoveController::class, 'store'])
        ->middleware('throttle:60,1')
        ->name('games.moves.store');
    Route::post('games/{game}/resign', [GameActionController::class, 'resign'])->name('games.resign');
    Route::post('games/{game}/draw/offer', [GameActionController::class, 'offerDraw'])->name('games.draw.offer');
    Route::post('games/{game}/draw/accept', [GameActionController::class, 'acceptDraw'])->name('games.draw.accept');
    Route::post('games/{game}/draw/decline', [GameActionController::class, 'declineDraw'])->name('games.draw.decline');
});

require __DIR__.'/settings.php';
