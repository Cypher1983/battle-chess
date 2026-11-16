<?php

namespace App\Models;

use App\Enums\InvitationStatus;
use Database\Factories\ClanInvitationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * An invitation from a clan leader for a player to join their clan.
 *
 * @property int $id
 * @property int $clan_id
 * @property int $inviter_id
 * @property int $invitee_id
 * @property InvitationStatus $status
 * @property Carbon $expires_at
 * @property Carbon|null $responded_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Clan $clan
 * @property-read User $inviter
 * @property-read User $invitee
 */
#[Fillable(['clan_id', 'inviter_id', 'invitee_id', 'status', 'expires_at', 'responded_at'])]
class ClanInvitation extends Model
{
    /** @use HasFactory<ClanInvitationFactory> */
    use HasFactory;

    /**
     * Number of days an invitation stays open.
     */
    public const EXPIRES_AFTER_DAYS = 7;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => InvitationStatus::class,
            'expires_at' => 'datetime',
            'responded_at' => 'datetime',
        ];
    }

    /**
     * The clan the player is invited to.
     *
     * @return BelongsTo<Clan, $this>
     */
    public function clan(): BelongsTo
    {
        return $this->belongsTo(Clan::class);
    }

    /**
     * The leader who sent the invitation.
     *
     * @return BelongsTo<User, $this>
     */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inviter_id');
    }

    /**
     * The player who was invited.
     *
     * @return BelongsTo<User, $this>
     */
    public function invitee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invitee_id');
    }

    /**
     * Only invitations that are pending and not yet expired.
     *
     * @param  Builder<ClanInvitation>  $query
     */
    #[Scope]
    protected function open(Builder $query): void
    {
        $query->where('status', InvitationStatus::Pending)
            ->where('expires_at', '>', now());
    }

    /**
     * Whether the invitation can still be accepted, declined or cancelled.
     */
    public function isOpen(): bool
    {
        return $this->status->isOpen() && $this->expires_at->isFuture();
    }

    /**
     * Close the invitation with the given answer.
     */
    public function close(InvitationStatus $status): void
    {
        $this->update([
            'status' => $status,
            'responded_at' => now(),
        ]);
    }
}
