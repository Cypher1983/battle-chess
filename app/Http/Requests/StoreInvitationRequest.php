<?php

namespace App\Http\Requests;

use App\Enums\Army;
use App\Models\Invitation;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreInvitationRequest extends FormRequest
{
    /**
     * The registered player being challenged, if the recipient has an account.
     */
    private ?User $invitee = null;

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('recipient'))) {
            $this->merge(['recipient' => Str::lower(trim($this->input('recipient')))]);
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
            'recipient' => ['required', 'string', 'max:255'],
            'army' => ['nullable', Rule::enum(Army::class)],
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

                $this->resolveRecipient($validator);
            },
        ];
    }

    /**
     * The registered player being challenged, or null for an email-only invitation.
     */
    public function invitee(): ?User
    {
        return $this->invitee;
    }

    /**
     * The army the challenger brings: the one picked, or their saved army.
     */
    public function army(): Army
    {
        return $this->enum('army', Army::class) ?? $this->user()->army;
    }

    /**
     * The email address to invite when the recipient has no account yet.
     */
    public function inviteEmail(): ?string
    {
        return $this->invitee === null ? $this->recipient() : null;
    }

    /**
     * Look up the recipient by email or username and reject invalid targets.
     */
    private function resolveRecipient(Validator $validator): void
    {
        $recipient = $this->recipient();
        $isEmail = filter_var($recipient, FILTER_VALIDATE_EMAIL) !== false;

        $user = User::where($isEmail ? 'email' : 'username', $recipient)->first();

        if (! $isEmail && $user === null) {
            $validator->errors()->add('recipient', __('No player found with that username.'));

            return;
        }

        if ($user !== null && $user->is($this->user())) {
            $validator->errors()->add('recipient', __('You cannot challenge yourself.'));

            return;
        }

        $alreadyInvited = Invitation::open()
            ->where('inviter_id', $this->user()->id)
            ->when(
                $user,
                fn ($query, User $user) => $query->where('invitee_id', $user->id),
                fn ($query) => $query->where('email', $recipient),
            )
            ->exists();

        if ($alreadyInvited) {
            $validator->errors()->add('recipient', __('You already have a pending challenge to this player.'));

            return;
        }

        $this->invitee = $user;
    }

    /**
     * The normalised recipient input.
     */
    private function recipient(): string
    {
        return $this->string('recipient')->toString();
    }
}
