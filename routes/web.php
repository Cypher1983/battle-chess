<?php

use App\Http\Controllers\ClanController;
use App\Http\Controllers\ClanInvitationController;
use App\Http\Controllers\ClanMemberController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GameActionController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\GameMoveController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\RematchController;
use App\Http\Controllers\ScoreboardController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', WelcomeController::class)->name('home');
Route::inertia('armies', 'public/Armies')->name('armies');
Route::inertia('rules', 'public/Rules')->name('rules');
Route::get('scoreboard', [ScoreboardController::class, 'index'])->name('scoreboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('scoreboard/clans', [ScoreboardController::class, 'clans'])->name('scoreboard.clans');
    Route::get('scoreboard/clans/versus', [ScoreboardController::class, 'versus'])->name('scoreboard.clans.versus');
    Route::get('play', [GameController::class, 'index'])->name('play');
    Route::get('invites', [InvitationController::class, 'index'])->name('invites');
    Route::post('invitations', [InvitationController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('invitations.store');
    Route::post('invitations/{invitation}/accept', [InvitationController::class, 'accept'])->name('invitations.accept');
    Route::post('invitations/{invitation}/decline', [InvitationController::class, 'decline'])->name('invitations.decline');
    Route::post('invitations/{invitation}/cancel', [InvitationController::class, 'cancel'])->name('invitations.cancel');

    Route::get('clan', [ClanController::class, 'show'])->name('clan');
    Route::post('clans', [ClanController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('clans.store');
    Route::patch('clans/{clan}', [ClanController::class, 'update'])->name('clans.update');
    Route::delete('clans/{clan}', [ClanController::class, 'destroy'])->name('clans.destroy');
    Route::post('clans/{clan}/leave', [ClanMemberController::class, 'leave'])->name('clans.leave');
    Route::delete('clans/{clan}/members/{member}', [ClanMemberController::class, 'destroy'])->name('clans.members.destroy');
    Route::post('clans/{clan}/members/{member}/lead', [ClanMemberController::class, 'promote'])->name('clans.members.promote');
    Route::post('clans/{clan}/invitations', [ClanInvitationController::class, 'store'])
        ->middleware(['can:manageMembers,clan', 'throttle:20,1'])
        ->name('clans.invitations.store');
    Route::post('clan-invitations/{invitation}/accept', [ClanInvitationController::class, 'accept'])->name('clan-invitations.accept');
    Route::post('clan-invitations/{invitation}/decline', [ClanInvitationController::class, 'decline'])->name('clan-invitations.decline');
    Route::post('clan-invitations/{invitation}/cancel', [ClanInvitationController::class, 'cancel'])->name('clan-invitations.cancel');

    Route::get('games/{game}', [GameController::class, 'show'])->name('games.show');
    Route::post('games/{game}/moves', [GameMoveController::class, 'store'])
        ->middleware('throttle:60,1')
        ->name('games.moves.store');
    Route::post('games/{game}/resign', [GameActionController::class, 'resign'])->name('games.resign');
    Route::post('games/{game}/claim-timeout', [GameActionController::class, 'claimTimeout'])->name('games.claim-timeout');
    Route::post('games/{game}/rematch', [RematchController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('games.rematch');
    Route::post('games/{game}/draw/offer', [GameActionController::class, 'offerDraw'])->name('games.draw.offer');
    Route::post('games/{game}/draw/accept', [GameActionController::class, 'acceptDraw'])->name('games.draw.accept');
    Route::post('games/{game}/draw/decline', [GameActionController::class, 'declineDraw'])->name('games.draw.decline');
});

require __DIR__.'/settings.php';
