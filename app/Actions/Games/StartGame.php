<?php

namespace App\Actions\Games;

use App\Enums\Army;
use App\Enums\GameStatus;
use App\Models\Game;
use App\Models\Invitation;
use LogicException;

class StartGame
{
    /**
     * Start a game between the two players of an accepted challenge.
     *
     * Colours are assigned at random. The challenger brings the army chosen
     * for the challenge and the challenged player the army they accepted
     * with (or their saved one). Armies are saved with the game, so changing
     * them later does not change games already under way.
     */
    public function __invoke(Invitation $invitation, ?Army $inviteeArmy = null): Game
    {
        $invitee = $invitation->invitee ?? throw new LogicException('Only an accepted challenge can start a game.');

        $players = [
            ['user' => $invitation->inviter, 'army' => $invitation->challengerArmy()],
            ['user' => $invitee, 'army' => $inviteeArmy ?? $invitee->army],
        ];

        if (random_int(0, 1) === 1) {
            $players = array_reverse($players);
        }

        [$white, $black] = $players;

        return Game::create([
            'white_id' => $white['user']->id,
            'black_id' => $black['user']->id,
            'white_army' => $white['army'],
            'black_army' => $black['army'],
            'invitation_id' => $invitation->id,
            'fen' => Game::START_FEN,
            'status' => GameStatus::Active,
        ]);
    }
}
