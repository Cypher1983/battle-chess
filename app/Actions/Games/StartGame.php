<?php

namespace App\Actions\Games;

use App\Enums\GameStatus;
use App\Models\Game;
use App\Models\Invitation;
use LogicException;

class StartGame
{
    /**
     * Start a game between the two players of an accepted challenge.
     *
     * Colours are assigned at random. Each player brings the army they have
     * chosen; it is saved with the game, so choosing another army later
     * does not change games already under way.
     */
    public function __invoke(Invitation $invitation): Game
    {
        $players = [
            $invitation->inviter,
            $invitation->invitee ?? throw new LogicException('Only an accepted challenge can start a game.'),
        ];

        if (random_int(0, 1) === 1) {
            $players = array_reverse($players);
        }

        [$white, $black] = $players;

        return Game::create([
            'white_id' => $white->id,
            'black_id' => $black->id,
            'white_army' => $white->army,
            'black_army' => $black->army,
            'invitation_id' => $invitation->id,
            'fen' => Game::START_FEN,
            'status' => GameStatus::Active,
        ]);
    }
}
