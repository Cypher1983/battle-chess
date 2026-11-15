<?php

namespace App\Http\Requests;

use App\Enums\Army;
use App\Models\Invitation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AcceptInvitationRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * The challenged player may bring any army except the challenger's.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'army' => [
                'nullable',
                Rule::enum(Army::class),
                Rule::notIn([$this->invitation()->challengerArmy()->value]),
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'army.not_in' => __('Your opponent already leads this army. Choose another.'),
        ];
    }

    /**
     * The army picked for this game, if any.
     */
    public function army(): ?Army
    {
        return $this->enum('army', Army::class);
    }

    private function invitation(): Invitation
    {
        $invitation = $this->route('invitation');

        assert($invitation instanceof Invitation);

        return $invitation;
    }
}
