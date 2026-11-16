<?php

namespace App\Models;

use App\Enums\Army;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $username
 * @property int $rating
 * @property int $wins
 * @property int $losses
 * @property int $draws
 * @property Army $army
 * @property int|null $clan_id
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Clan|null $clan
 */
#[Fillable(['name', 'username', 'email', 'password', 'army'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'army' => 'clockwork',
    ];

    /**
     * The clan this player belongs to, if any.
     *
     * @return BelongsTo<Clan, $this>
     */
    public function clan(): BelongsTo
    {
        return $this->belongsTo(Clan::class);
    }

    /**
     * Whether this player runs the given clan.
     */
    public function leads(Clan $clan): bool
    {
        return $clan->leader_id === $this->id;
    }

    /**
     * Invitations this player has had to join a clan.
     *
     * @return HasMany<ClanInvitation, $this>
     */
    public function receivedClanInvitations(): HasMany
    {
        return $this->hasMany(ClanInvitation::class, 'invitee_id');
    }

    /**
     * Invitations this player has sent.
     *
     * @return HasMany<Invitation, $this>
     */
    public function sentInvitations(): HasMany
    {
        return $this->hasMany(Invitation::class, 'inviter_id');
    }

    /**
     * Invitations this player has received.
     *
     * @return HasMany<Invitation, $this>
     */
    public function receivedInvitations(): HasMany
    {
        return $this->hasMany(Invitation::class, 'invitee_id');
    }

    /**
     * Players with at least one finished game, best first.
     *
     * @param  Builder<User>  $query
     */
    #[Scope]
    protected function ranked(Builder $query): void
    {
        $query->whereRaw('wins + losses + draws > 0')
            ->orderByDesc('rating')
            ->orderByDesc('wins')
            ->orderBy('id');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'army' => Army::class,
        ];
    }
}
