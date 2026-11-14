<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreMoveRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'from' => ['required', 'string', 'regex:/^[a-h][1-8]$/'],
            'to' => ['required', 'string', 'regex:/^[a-h][1-8]$/', 'different:from'],
            'promotion' => ['nullable', 'string', 'in:q,r,b,n'],
        ];
    }
}
