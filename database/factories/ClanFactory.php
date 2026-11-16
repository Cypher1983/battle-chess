<?php

namespace Database\Factories;

use App\Enums\EmblemIcon;
use App\Enums\EmblemShape;
use App\Models\Clan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Clan>
 */
class ClanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => Str::limit(fake()->unique()->company(), 40, ''),
            'tag' => strtoupper(fake()->unique()->lexify('???')),
            'description' => null,
            'emblem_shape' => fake()->randomElement(EmblemShape::cases()),
            'emblem_icon' => fake()->randomElement(EmblemIcon::cases()),
            'emblem_primary' => fake()->hexColor(),
            'emblem_secondary' => fake()->hexColor(),
            'leader_id' => User::factory(),
        ];
    }

    /**
     * Configure the model factory: the leader is always a member.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Clan $clan) {
            $clan->leader->clan()->associate($clan)->save();
        });
    }
}
