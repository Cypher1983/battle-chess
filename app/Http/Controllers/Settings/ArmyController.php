<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ArmyUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArmyController extends Controller
{
    /**
     * Show the army picker.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/Army', [
            'army' => $request->user()->army->value,
        ]);
    }

    /**
     * Change the army the player brings to new games.
     */
    public function update(ArmyUpdateRequest $request): RedirectResponse
    {
        $request->user()->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Army chosen. It will march in your next game.')]);

        return to_route('army.edit');
    }
}
