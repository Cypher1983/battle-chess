<?php

namespace App\Models;

use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Enums\GameStatus;
use App\Enums\PieceColor;
use Database\Factories\GameFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $white_id
 * @property int $black_id
 * @property int|null $invitation_id
 * @property string $fen
 * @property GameStatus $status
 * @property GameResult|null $result
 * @property GameEndReason|null $end_reason
 * @property int|null $white_rating_before
 * @property int|null $black_rating_before
 * @property int|null $white_rating_change
 * @property int|null $black_rating_change
 * @property int|null $draw_offered_by_id
 * @property Carbon|null $last_move_at
 * @property Carbon|null $finished_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $white
 * @property-read User $black
 * @property-read Invitation|null $invitation
 * @property-read Collection<int, Move> $moves
 */
#[Fillable([
    'white_id', 'black_id', 'invitation_id', 'fen', 'status', 'result',
    'end_reason', 'draw_offered_by_id', 'last_move_at', 'finished_at',
    'white_rating_before', 'black_rating_before', 'white_rating_change', 'black_rating_change',
])]
class Game extends Model
{
    /** @use HasFactory<GameFactory> */
    use HasFactory;

    /**
     * The standard chess starting position.
     */
    public const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => GameStatus::class,
            'result' => GameResult::class,
            'end_reason' => GameEndReason::class,
            'last_move_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    /**
     * The player commanding the Clockwork Legion.
     *
     * @return BelongsTo<User, $this>
     */
    public function white(): BelongsTo
    {
        return $this->belongsTo(User::class, 'white_id');
    }

    /**
     * The player commanding the Wildwood Court.
     *
     * @return BelongsTo<User, $this>
     */
    public function black(): BelongsTo
    {
        return $this->belongsTo(User::class, 'black_id');
    }

    /**
     * The challenge this game was started from.
     *
     * @return BelongsTo<Invitation, $this>
     */
    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }

    /**
     * The moves played, in order.
     *
     * @return HasMany<Move, $this>
     */
    public function moves(): HasMany
    {
        return $this->hasMany(Move::class)->orderBy('ply');
    }

    /**
     * Games the given player takes part in.
     *
     * @param  Builder<Game>  $query
     */
    #[Scope]
    protected function involving(Builder $query, User $user): void
    {
        $query->where(fn (Builder $query) => $query
            ->where('white_id', $user->id)
            ->orWhere('black_id', $user->id));
    }

    /**
     * Games still being played.
     *
     * @param  Builder<Game>  $query
     */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('status', GameStatus::Active);
    }

    /**
     * Whether the game is still being played.
     */
    public function isActive(): bool
    {
        return $this->status === GameStatus::Active;
    }

    /**
     * Whether the given user is one of the two players.
     */
    public function hasPlayer(User $user): bool
    {
        return $this->colorOf($user) !== null;
    }

    /**
     * The colour the given user plays, or null for spectators.
     */
    public function colorOf(User $user): ?PieceColor
    {
        return match ($user->id) {
            $this->white_id => PieceColor::White,
            $this->black_id => PieceColor::Black,
            default => null,
        };
    }

    /**
     * The id of the player commanding the given colour.
     */
    public function playerIdFor(PieceColor $color): int
    {
        return $color === PieceColor::White ? $this->white_id : $this->black_id;
    }

    /**
     * The side to move, read from the current position.
     */
    public function turn(): PieceColor
    {
        return PieceColor::from(explode(' ', $this->fen)[1] ?? 'w');
    }

    /**
     * Whether it is the given user's turn to move.
     */
    public function isTurnOf(User $user): bool
    {
        return $this->isActive() && $this->colorOf($user) === $this->turn();
    }
}
