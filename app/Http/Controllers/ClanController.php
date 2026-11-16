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
}
