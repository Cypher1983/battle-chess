<?php

namespace App\Http\Requests;

use App\Enums\Army;
use App\Enums\BoardTheme;
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
            'board_theme' => ['nullable', Rule::enum(BoardTheme::class)],
        ];
    }

    /**
     * The army the challenger brings: the one picked, or their saved army.
     */
    public function army(): Army
    {
        return $this->enum('army', Army::class) ?? $this->user()->army;
    }

    /**
     * The board picked for the rematch, if any.
     */
    public function boardTheme(): ?BoardTheme
    {
        return $this->enum('board_theme', BoardTheme::class);
    }
}
