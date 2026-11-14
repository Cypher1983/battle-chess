<?php

namespace App\Models;

use Database\Factories\MoveFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $game_id
 * @property int $ply
 * @property int $user_id
 * @property string $from
 * @property string $to
 * @property string|null $promotion
 * @property string $san
 * @property string $fen
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Game $game
 * @property-read User $user
 */
#[Fillable(['game_id', 'ply', 'user_id', 'from', 'to', 'promotion', 'san', 'fen'])]
class Move extends Model
{
    /** @use HasFactory<MoveFactory> */
    use HasFactory;

    /**
     * The game this move belongs to.
     *
     * @return BelongsTo<Game, $this>
     */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * The player who made the move.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
