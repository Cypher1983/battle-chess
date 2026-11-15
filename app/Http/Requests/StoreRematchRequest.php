<?php

namespace App\Http\Requests;

use App\Enums\Army;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRematchRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'army' => ['nullable', Rule::enum(Army::class)],
        ];
    }

    /**
     * The army the challenger brings: the one picked, or their saved army.
     */
    public function army(): Army
    {
        return $this->enum('army', Army::class) ?? $this->user()->army;
    }
}
