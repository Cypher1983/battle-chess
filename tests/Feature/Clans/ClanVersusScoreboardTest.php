<?php

namespace Tests\Feature\Clans;

use App\Enums\GameResult;
use App\Models\Clan;
use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClanVersusScoreboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_see_clan_matchups()
    {
        $this->get(route('scoreboard.clans.versus'))->assertRedirect(route('login'));
    }

    public function test_matchups_total_the_games_between_two_clans_whichever_side_they_played()
    {
        [$wolves, $owls] = Clan::factory()->count(2)->create();

        $this->game($wolves, $owls, GameResult::WhiteWins);
        $this->game($owls, $wolves, GameResult::BlackWins);
        $this->game($owls, $wolves, GameResult::WhiteWins);
        $this->game($wolves, $owls, GameResult::Draw);

        $this->actingAs(User::factory()->create())
            ->get(route('scoreboard.clans.versus'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ClanVersusScoreboard')
                ->has('matchups.data', 1)
                ->where('matchups.data.0.clan', $wolves->summary())
                ->where('matchups.data.0.opponent', $owls->summary())
                ->where('matchups.data.0.games', 4)
                ->where('matchups.data.0.wins', 2)
                ->where('matchups.data.0.losses', 1)
                ->where('matchups.data.0.draws', 1)
                ->where('matchups.data.0.is_mine', false)
            );
    }

    public function test_matchups_with_the_most_games_come_first()
    {
        [$a, $b, $c] = Clan::factory()->count(3)->create();

        $this->game($a, $b, GameResult::WhiteWins);
        $this->game($b, $c, GameResult::WhiteWins);
        $this->game($c, $b, GameResult::Draw);

        $this->actingAs(User::factory()->create())
            ->get(route('scoreboard.clans.versus'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('matchups.data', 2)
                ->where('matchups.data.0.clan.id', $b->id)
                ->where('matchups.data.0.opponent.id', $c->id)
                ->where('matchups.data.0.games', 2)
                ->where('matchups.data.1.clan.id', $a->id)
                ->where('matchups.data.1.opponent.id', $b->id)
            );
    }

    public function test_the_viewers_clan_is_told_first()
    {
        [$theirs, $mine] = Clan::factory()->count(2)->create();
        $me = User::factory()->for($mine)->create();

        $this->game($theirs, $mine, GameResult::WhiteWins);
        $this->game($theirs, $mine, GameResult::WhiteWins);
        $this->game($mine, $theirs, GameResult::WhiteWins);

        $this->actingAs($me)
            ->get(route('scoreboard.clans.versus'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('matchups.data.0.clan.id', $mine->id)
                ->where('matchups.data.0.opponent.id', $theirs->id)
                ->where('matchups.data.0.wins', 1)
                ->where('matchups.data.0.losses', 2)
                ->where('matchups.data.0.is_mine', true)
            );
    }

    public function test_games_within_a_clan_without_a_clan_or_still_being_played_are_left_out()
    {
        [$a, $b] = Clan::factory()->count(2)->create();

        $this->game($a, $a, GameResult::WhiteWins);
        $this->game($a, null, GameResult::WhiteWins);
        Game::factory()->create(['white_clan_id' => $a->id, 'black_clan_id' => $b->id]);

        $this->actingAs(User::factory()->create())
            ->get(route('scoreboard.clans.versus'))
            ->assertInertia(fn (Assert $page) => $page->has('matchups.data', 0));
    }

    /**
     * A finished game between members of the given clans.
     */
    private function game(?Clan $white, ?Clan $black, GameResult $result): Game
    {
        return Game::factory()->finished($result)->create([
            'white_clan_id' => $white?->id,
            'black_clan_id' => $black?->id,
        ]);
    }
}
