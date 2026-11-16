<?php

namespace App\Models;

use App\Enums\Army;
use App\Enums\BoardTheme;
use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Enums\GameStatus;
use App\Enums\PieceColor;
use Carbon\CarbonInterface;
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
 * @property Army $white_army
 * @property Army $black_army
 * @property BoardTheme $board_theme
 * @property int|null $invitation_id
 * @property string $fen
 * @property GameStatus $status
 * @property GameResult|null $result
 * @property GameEndReason|null $end_reason
 * @property int|null $white_rating_before
 * @property int|null $black_rating_before
 * @property int|null $white_rating_change
 * @property int|null $black_rating_change
 * @property int|null $white_clan_id
 * @property int|null $black_clan_id
 * @property int|null $draw_offered_by_id
 * @property Carbon|null $last_move_at
 * @property Carbon|null $finished_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $white
 * @property-read User $black
 * @property-read Clan|null $whiteClan
 * @property-read Clan|null $blackClan
 * @property-read Invitation|null $invitation
 * @property-read Collection<int, Move> $moves
 */
#[Fillable([
    'white_id', 'black_id', 'white_army', 'black_army', 'board_theme', 'invitation_id', 'fen', 'status', 'result',
    'end_reason', 'draw_offered_by_id', 'last_move_at', 'finished_at',
    'white_rating_before', 'black_rating_before', 'white_rating_change', 'black_rating_change',
    'white_clan_id', 'black_clan_id',
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
     * How long the player to move has before the opponent may claim the win.
     */
    public const MOVE_DEADLINE_HOURS = 72;

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'white_army' => 'clockwork',
        'black_army' => 'wildwood',
        'board_theme' => 'classic',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'white_army' => Army::class,
            'black_army' => Army::class,
            'board_theme' => BoardTheme::class,
            'status' => GameStatus::class,
            'result' => GameResult::class,
            'end_reason' => GameEndReason::class,
            'last_move_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    /**
     * The player with the white pieces.
     *
     * @return BelongsTo<User, $this>
     */
    public function white(): BelongsTo
    {
        return $this->belongsTo(User::class, 'white_id');
    }

    /**
     * The player with the black pieces.
     *
     * @return BelongsTo<User, $this>
     */
    public function black(): BelongsTo
    {
        return $this->belongsTo(User::class, 'black_id');
    }

    /**
     * The clan the white player was in when the game finished.
     *
     * @return BelongsTo<Clan, $this>
     */
    public function whiteClan(): BelongsTo
    {
        return $this->belongsTo(Clan::class, 'white_clan_id');
    }

    /**
     * The clan the black player was in when the game finished.
     *
     * @return BelongsTo<Clan, $this>
     */
    public function blackClan(): BelongsTo
    {
        return $this->belongsTo(Clan::class, 'black_clan_id');
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
     * When the player to move must have moved by: three days after the last
     * move, or after the game started if nobody has moved yet.
     */
    public function moveDeadline(): CarbonInterface
    {
        // The app uses immutable dates (see AppServiceProvider), so no copy is needed.
        return ($this->last_move_at ?? $this->created_at ?? now())
            ->addHours(self::MOVE_DEADLINE_HOURS);
    }

    /**
     * Whether the given user may claim the win because their opponent,
     * who is to move, has missed the move deadline.
     */
    public function canClaimTimeout(User $user): bool
    {
        $color = $this->colorOf($user);

        return $this->isActive()
            && $color !== null
            && $this->turn() !== $color
            && $this->moveDeadline()->isPast();
    }

    /**
     * Whether it is the given user's turn to move.
     */
    public function isTurnOf(User $user): bool
    {
        return $this->isActive() && $this->colorOf($user) === $this->turn();
    }
}
