<?php

namespace App\Http\Controllers;

use App\Actions\Games\MakeMove;
use App\Http\Requests\StoreMoveRequest;
use App\Models\Game;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class GameMoveController extends Controller
{
    /**
     * Play a move in a game.
     */
    public function store(StoreMoveRequest $request, Game $game, MakeMove $makeMove): RedirectResponse
    {
        Gate::authorize('view', $game);

        $makeMove(
            $game,
            $request->user(),
            $request->string('from')->toString(),
            $request->string('to')->toString(),
            $request->filled('promotion') ? $request->string('promotion')->toString() : null,
        );

        return to_route('games.show', $game);
    }
}
