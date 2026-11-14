<?php

use App\Models\Game;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/*
 * Presence channel for a game: carries live updates and shows which
 * players are watching. Only the two players may join.
 */
Broadcast::channel('games.{game}', function (User $user, Game $game) {
    if (! $game->hasPlayer($user)) {
        return false;
    }

    return [
        'id' => $user->id,
        'username' => $user->username,
        'color' => $game->colorOf($user)?->value,
    ];
});
