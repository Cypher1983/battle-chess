<?php

namespace App\Models;

use App\Enums\InvitationStatus;
use Database\Factories\InvitationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $inviter_id
 * @property int|null $invitee_id
 * @property string|null $email
 * @property InvitationStatus $status
 * @property Carbon $expires_at
 * @property Carbon|null $responded_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $inviter
 * @property-read User|null $invitee
 */
#[Fillable(['inviter_id', 'invitee_id', 'email', 'status', 'expires_at', 'responded_at'])]
class Invitation extends Model
{
    /** @use HasFactory<InvitationFactory> */
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
     * The player who sent the invitation.
     *
     * @return BelongsTo<User, $this>
     */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inviter_id');
    }

    /**
     * The player who received the invitation, once known.
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
     * @param  Builder<Invitation>  $query
     */
    #[Scope]
    protected function open(Builder $query): void
    {
        $query->where('status', InvitationStatus::Pending)
            ->where('expires_at', '>', now());
    }

    /**
     * Whether the invitation has passed its expiry date.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Whether the invitation can still be accepted, declined or cancelled.
     */
    public function isOpen(): bool
    {
        return $this->status->isOpen() && ! $this->isExpired();
    }
}
