<?php

namespace App\Policies;

use App\Models\Clan;
use App\Models\User;

class ClanPolicy
{
    /**
     * Players may found a clan while they are not in one.
     */
    public function create(User $user): bool
    {
        return $user->clan_id === null;
    }

    /**
     * Only the leader may change the clan's name, tag, description or emblem.
     */
    public function update(User $user, Clan $clan): bool
    {
        return $user->leads($clan);
    }

    /**
     * Only the leader may disband the clan.
     */
    public function delete(User $user, Clan $clan): bool
    {
        return $user->leads($clan);
    }

    /**
     * Only the leader may invite, remove members or hand over leadership.
     */
    public function manageMembers(User $user, Clan $clan): bool
    {
        return $user->leads($clan);
    }

    /**
     * Members may leave; the leader must hand over leadership or disband first.
     */
    public function leave(User $user, Clan $clan): bool
    {
        return $user->clan_id === $clan->id && ! $user->leads($clan);
    }
}
