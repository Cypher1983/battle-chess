<?php

namespace App\Http\Requests;

use App\Models\Clan;
use App\Models\ClanInvitation;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

class StoreClanInvitationRequest extends FormRequest
{
    /**
     * The player being invited, once found.
     */
    private ?User $invitee = null;

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('username'))) {
            $this->merge(['username' => Str::lower(trim($this->input('username')))]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * Get the "after" validation callables for the request.
     *
     * @return array<int, Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $this->resolveInvitee($validator);
            },
        ];
    }

    /**
     * The player being invited.
     */
    public function invitee(): User
    {
        return $this->invitee ?? throw new \LogicException('The request has not been validated.');
    }

    /**
     * Find the player and reject anyone who cannot be invited.
     */
    private function resolveInvitee(Validator $validator): void
    {
        $clan = $this->route('clan');
        $user = User::where('username', $this->string('username')->toString())->first();

        if ($user === null) {
            $validator->errors()->add('username', __('No player found with that username.'));

            return;
        }

        if ($user->clan_id !== null) {
            $validator->errors()->add('username', $clan instanceof Clan && $user->clan_id === $clan->id
                ? __('That player is already in your clan.')
                : __('That player is already in a clan.'));

            return;
        }

        $alreadyInvited = ClanInvitation::open()
            ->where('clan_id', $clan instanceof Clan ? $clan->id : null)
            ->where('invitee_id', $user->id)
            ->exists();

        if ($alreadyInvited) {
            $validator->errors()->add('username', __('That player already has an invitation to your clan.'));

            return;
        }

        $this->invitee = $user;
    }
}
