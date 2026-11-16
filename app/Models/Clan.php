<?php

namespace App\Models;

use App\Enums\EmblemIcon;
use App\Enums\EmblemShape;
use Database\Factories\ClanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A team of players under one leader, shown with a tag and an emblem.
 *
 * @property int $id
 * @property string $name
 * @property string $tag
 * @property string|null $description
 * @property EmblemShape $emblem_shape
 * @property EmblemIcon $emblem_icon
 * @property string $emblem_primary
 * @property string $emblem_secondary
 * @property int $leader_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $leader
 * @property-read Collection<int, User> $members
 * @property-read Collection<int, ClanInvitation> $invitations
 */
#[Fillable(['name', 'tag', 'description', 'emblem_shape', 'emblem_icon', 'emblem_primary', 'emblem_secondary', 'leader_id'])]
class Clan extends Model
{
    /** @use HasFactory<ClanFactory> */
    use HasFactory;

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'emblem_shape' => 'shield',
        'emblem_icon' => 'crown',
        'emblem_primary' => '#b8860b',
        'emblem_secondary' => '#1f2937',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'emblem_shape' => EmblemShape::class,
            'emblem_icon' => EmblemIcon::class,
        ];
    }

    /**
     * The player who runs the clan.
     *
     * @return BelongsTo<User, $this>
     */
    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    /**
     * Everyone in the clan, the leader included.
     *
     * @return HasMany<User, $this>
     */
    public function members(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Invitations the clan has sent.
     *
     * @return HasMany<ClanInvitation, $this>
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(ClanInvitation::class);
    }

    /**
     * The clan's emblem, as the front end draws it.
     *
     * @return array{shape: string, icon: string, primary: string, secondary: string}
     */
    public function emblem(): array
    {
        return [
            'shape' => $this->emblem_shape->value,
            'icon' => $this->emblem_icon->value,
            'primary' => $this->emblem_primary,
            'secondary' => $this->emblem_secondary,
        ];
    }
}
