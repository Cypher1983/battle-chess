<?php

namespace App\Actions\Games;

use App\Enums\GameStatus;
use App\Models\Game;
use App\Models\Invitation;

class StartGame
{
    /**
     * Start a game between the two players of an accepted challenge.
     *
     * Colours are assigned at random: white commands the Clockwork Legion,
     * black commands the Wildwood Court.
     */
    public function __invoke(Invitation $invitation): Game
    {
        $players = [$invitation->inviter_id, (int) $invitation->invitee_id];

        if (random_int(0, 1) === 1) {
            $players = array_reverse($players);
        }

        return Game::create([
            'white_id' => $players[0],
            'black_id' => $players[1],
            'invitation_id' => $invitation->id,
            'fen' => Game::START_FEN,
            'status' => GameStatus::Active,
        ]);
    }
}
