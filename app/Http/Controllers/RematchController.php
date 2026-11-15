<?php

namespace App\Http\Controllers;

use App\Actions\Invitations\SendInvitation;
use App\Http\Requests\StoreRematchRequest;
use App\Models\Game;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class RematchController extends Controller
{
    /**
     * Challenge the opponent of a finished game to another battle, bringing
     * the army picked for it, on the board picked (or the same board).
     */
    public function store(StoreRematchRequest $request, Game $game, SendInvitation $sendInvitation): RedirectResponse
    {
        Gate::authorize('view', $game);

        $user = $request->user();

        if ($game->isActive()) {
            return $this->fail($game, __('Finish this battle before asking for a rematch.'));
        }

        $opponent = User::findOrFail($game->white_id === $user->id ? $game->black_id : $game->white_id);

        if ($this->hasOpenChallenge($user, $opponent)) {
            return $this->fail($game, __('You already challenged :name.', ['name' => $opponent->name]));
        }

        if ($this->hasOpenChallenge($opponent, $user)) {
            Inertia::flash('toast', ['type' => 'info', 'message' => __(':name already wants a rematch. Accept it here.', ['name' => $opponent->name])]);

            return to_route('invites');
        }

        $sendInvitation(
            $user,
            $opponent,
            army: $request->army(),
            boardTheme: $request->boardTheme() ?? $game->board_theme,
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Rematch challenge sent to :name.', ['name' => $opponent->name])]);

        return to_route('games.show', $game);
    }

    private function hasOpenChallenge(User $from, User $to): bool
    {
        return Invitation::open()
            ->where('inviter_id', $from->id)
            ->where('invitee_id', $to->id)
            ->exists();
    }

    private function fail(Game $game, string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'error', 'message' => $message]);

        return to_route('games.show', $game);
    }
}
