<?php

namespace Database\Factories;

use App\Enums\InvitationStatus;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invitation>
 */
class InvitationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'inviter_id' => User::factory(),
            'invitee_id' => User::factory(),
            'email' => null,
            'inviter_army' => null,
            'status' => InvitationStatus::Pending,
            'expires_at' => now()->addDays(Invitation::EXPIRES_AFTER_DAYS),
            'responded_at' => null,
        ];
    }

    /**
     * Invite someone who does not have an account yet.
     */
    public function forEmail(?string $email = null): static
    {
        return $this->state(fn (array $attributes) => [
            'invitee_id' => null,
            'email' => $email ?? fake()->unique()->safeEmail(),
        ]);
    }

    /**
     * An invitation whose expiry date has passed.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subMinute(),
        ]);
    }

    /**
     * An invitation that has been answered with the given status.
     */
    public function responded(InvitationStatus $status): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => $status,
            'responded_at' => now(),
        ]);
    }
}
