<?php

namespace Database\Factories;

use App\Enums\InvitationStatus;
use App\Models\Clan;
use App\Models\ClanInvitation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClanInvitation>
 */
class ClanInvitationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'clan_id' => Clan::factory(),
            'inviter_id' => fn (array $attributes) => Clan::query()->whereKey($attributes['clan_id'])->value('leader_id'),
            'invitee_id' => User::factory(),
            'status' => InvitationStatus::Pending,
            'expires_at' => now()->addDays(ClanInvitation::EXPIRES_AFTER_DAYS),
            'responded_at' => null,
        ];
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
