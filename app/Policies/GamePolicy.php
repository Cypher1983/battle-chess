<?php

namespace App\Policies;

use App\Models\Game;
use App\Models\User;

class GamePolicy
{
    /**
     * Only the two players may open a game for now.
     */
    public function view(User $user, Game $game): bool
    {
        return $game->hasPlayer($user);
    }
}
