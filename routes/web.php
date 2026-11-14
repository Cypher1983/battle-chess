<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'Welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'Dashboard')->name('dashboard');
    Route::inertia('play', 'Play')->name('play');
    Route::inertia('invites', 'Invites')->name('invites');
    Route::inertia('scoreboard', 'Scoreboard')->name('scoreboard');
});

require __DIR__.'/settings.php';
