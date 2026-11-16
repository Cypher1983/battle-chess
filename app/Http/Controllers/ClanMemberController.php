<?php

namespace App\Http\Controllers;

use App\Models\Clan;
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
}
