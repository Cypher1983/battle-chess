<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClanRequest;
use App\Models\Clan;
use App\Models\ClanInvitation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ClanController extends Controller
{
    /**
     * Show the player's clan, or the form to found one.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();
        $clan = $user->clan;

        return Inertia::render('Clan', [
            'clan' => $clan === null ? null : [
                ...$this->present($clan),
                'description' => $clan->description,
                'is_leader' => $user->leads($clan),
                'members' => $clan->members()
                    ->orderByRaw('id = ? desc', [$clan->leader_id])
                    ->orderByDesc('rating')
                    ->orderBy('username')
                    ->get(['id', 'name', 'username', 'rating', 'wins', 'losses', 'draws'])
                    ->map(fn (User $member) => [
                        'id' => $member->id,
                        'name' => $member->name,
                        'username' => $member->username,
                        'rating' => $member->rating,
                        'wins' => $member->wins,
                        'losses' => $member->losses,
                        'draws' => $member->draws,
                        'is_leader' => $member->leads($clan),
                        'is_me' => $member->is($user),
                    ]),
                'invitations' => $user->leads($clan)
                    ? $clan->invitations()->open()->with('invitee')->latest('id')->get()
                        ->map(fn (ClanInvitation $invitation) => [
                            'id' => $invitation->id,
                            'player' => [
                                'name' => $invitation->invitee->name,
                                'username' => $invitation->invitee->username,
                            ],
                            'expires_in' => $invitation->expires_at->diffForHumans(),
                        ])
                    : [],
            ],
            'invitations' => $user->receivedClanInvitations()->open()->with(['clan', 'inviter'])->latest('id')->get()
                ->map(fn (ClanInvitation $invitation) => [
                    'id' => $invitation->id,
                    'clan' => $this->present($invitation->clan),
                    'inviter' => [
                        'name' => $invitation->inviter->name,
                        'username' => $invitation->inviter->username,
                    ],
                    'expires_in' => $invitation->expires_at->diffForHumans(),
                ]),
        ]);
    }

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

    /**
     * The details of a clan everyone signed in may see.
     *
     * @return array{id: int, name: string, tag: string, emblem: array{shape: string, icon: string, primary: string, secondary: string}}
     */
    private function present(Clan $clan): array
    {
        return [
            'id' => $clan->id,
            'name' => $clan->name,
            'tag' => $clan->tag,
            'emblem' => $clan->emblem(),
        ];
    }
}
