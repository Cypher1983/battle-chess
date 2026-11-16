<?php

namespace App\Http\Controllers;

use App\Models\Clan;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ClanMemberController extends Controller
{
    /**
     * Leave the clan.
     */
    public function leave(Request $request, Clan $clan): RedirectResponse
    {
        Gate::authorize('leave', $clan);

        $request->user()->clan()->dissociate()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('You left :clan.', ['clan' => $clan->name])]);

        return back();
    }

    /**
     * Remove a member from the clan. The leader cannot remove themselves.
     */
    public function destroy(Clan $clan, User $member): RedirectResponse
    {
        Gate::authorize('manageMembers', $clan);

        abort_unless($member->clan_id === $clan->id, 404);
        abort_if($member->leads($clan), 403, __('Hand over leadership or disband the clan instead.'));

        $member->clan()->dissociate()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':player was removed from the clan.', ['player' => $member->username])]);

        return back();
    }
}
