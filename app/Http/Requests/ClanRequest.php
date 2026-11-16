<?php

namespace App\Http\Requests;

use App\Enums\EmblemIcon;
use App\Enums\EmblemShape;
use App\Models\Clan;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A clan's name, tag, description and emblem, when founding or editing it.
 */
class ClanRequest extends FormRequest
{
    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge(array_filter([
            'name' => is_string($this->input('name')) ? trim($this->input('name')) : null,
            'tag' => is_string($this->input('tag')) ? strtoupper(trim($this->input('tag'))) : null,
            'description' => is_string($this->input('description')) ? trim($this->input('description')) : null,
            'emblem_primary' => is_string($this->input('emblem_primary')) ? strtolower($this->input('emblem_primary')) : null,
            'emblem_secondary' => is_string($this->input('emblem_secondary')) ? strtolower($this->input('emblem_secondary')) : null,
        ], fn ($value) => $value !== null));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $clan = $this->route('clan');
        $ignore = $clan instanceof Clan ? $clan->id : null;

        return [
            'name' => ['required', 'string', 'min:3', 'max:40', Rule::unique('clans', 'name')->ignore($ignore)],
            'tag' => ['required', 'string', 'regex:/^[A-Z0-9]{2,4}$/', Rule::unique('clans', 'tag')->ignore($ignore)],
            'description' => ['nullable', 'string', 'max:280'],
            'emblem_shape' => ['required', Rule::enum(EmblemShape::class)],
            'emblem_icon' => ['required', Rule::enum(EmblemIcon::class)],
            'emblem_primary' => ['required', 'regex:/^#[0-9a-f]{6}$/'],
            'emblem_secondary' => ['required', 'regex:/^#[0-9a-f]{6}$/'],
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
            'tag.regex' => __('The tag must be 2 to 4 letters or digits.'),
            'emblem_primary.regex' => __('Pick a colour for the emblem.'),
            'emblem_secondary.regex' => __('Pick a colour for the emblem.'),
        ];
    }
}
