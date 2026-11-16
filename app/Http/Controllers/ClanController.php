<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClanRequest;
use App\Models\Clan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ClanController extends Controller
{
    /**
     * Found a clan, with the founder as its leader.
     */
    public function store(ClanRequest $request): RedirectResponse
    {
        Gate::authorize('create', Clan::class);

        $user = $request->user();

        DB::transaction(function () use ($request, $user) {
            $clan = Clan::create([...$request->validated(), 'leader_id' => $user->id]);

            $user->clan()->associate($clan)->save();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Clan founded. Invite some players to join you.')]);

        return back();
    }

    /**
     * Change the clan's name, tag, description or emblem.
     */
    public function update(ClanRequest $request, Clan $clan): RedirectResponse
    {
        Gate::authorize('update', $clan);

        $clan->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Clan updated.')]);

        return back();
    }

    /**
     * Disband the clan. Its members are released and its invitations dropped.
     */
    public function destroy(Clan $clan): RedirectResponse
    {
        Gate::authorize('delete', $clan);

        $clan->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Clan disbanded.')]);

        return back();
    }
}
