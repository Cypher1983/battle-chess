<?php

namespace Tests\Feature\Games;

use App\Enums\GameEndReason;
use App\Enums\GameResult;
use App\Models\Clan;
use App\Models\Game;
use App\Models\Invitation;
use App\Models\Move;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ShowGameTest extends TestCase
{
    use RefreshDatabase;

    public function test_players_can_view_their_game()
    {
        $white = User::factory()->create(['name' => 'Wendy', 'username' => 'wendy']);
        $game = Game::factory()->for($white, 'white')->create();

        $this->actingAs($white)
            ->get(route('games.show', $game))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('games/Show')
                ->where('myColor', 'w')
                ->where('game.id', $game->id)
                ->where('game.fen', Game::START_FEN)
                ->where('game.turn', 'w')
                ->where('game.armies', ['w' => 'clockwork', 'b' => 'wildwood'])
                ->where('game.board_theme', 'classic')
                ->where('game.status', 'active')
                ->where('game.move_deadline', $game->moveDeadline()->toIso8601String())
                ->where('game.white', ['name' => 'Wendy', 'username' => 'wendy', 'clan' => null, 'rating' => 1200, 'rating_change' => null])
                ->where('game.last_move', null)
                ->has('game.moves', 0)
            );

        $this->actingAs($game->black)
            ->get(route('games.show', $game))
            ->assertInertia(fn (Assert $page) => $page->where('myColor', 'b'));
    }

    public function test_players_are_shown_with_their_clan()
    {
        $clan = Clan::factory()->create();
        $game = Game::factory()->for($clan->leader, 'black')->create();

        $this->actingAs($game->white)
            ->get(route('games.show', $game))
            ->assertInertia(fn (Assert $page) => $page
                ->where('game.white.clan', null)
                ->where('game.black.clan', $clan->summary())
            );
    }

    public function test_moves_and_last_move_are_included()
    {
        $game = Game::factory()->create();
        Move::factory()->for($game)->create(['ply' => 1, 'from' => 'e2', 'to' => 'e4', 'san' => 'e4']);
        Move::factory()->for($game)->create(['ply' => 2, 'from' => 'e7', 'to' => 'e5', 'san' => 'e5']);

        $this->actingAs($game->white)
            ->get(route('games.show', $game))
            ->assertInertia(fn (Assert $page) => $page
                ->where('game.moves', [['ply' => 1, 'san' => 'e4'], ['ply' => 2, 'san' => 'e5']])
                ->where('game.last_move', ['ply' => 2, 'from' => 'e7', 'to' => 'e5', 'color' => 'b', 'piece' => 'p', 'captured' => null])
            );
    }

    public function test_last_move_includes_capture_details()
    {
        $game = Game::factory()->create();

        foreach ([['e2', 'e4'], ['d7', 'd5'], ['e4', 'd5']] as $index => [$from, $to]) {
            $this->actingAs($index % 2 === 0 ? $game->white : $game->black)
                ->post(route('games.moves.store', $game), ['from' => $from, 'to' => $to]);
        }

        $this->actingAs($game->black)
            ->get(route('games.show', $game))
            ->assertInertia(fn (Assert $page) => $page
                ->where('game.last_move', ['ply' => 3, 'from' => 'e4', 'to' => 'd5', 'color' => 'w', 'piece' => 'p', 'captured' => 'p'])
            );
    }

    public function test_finished_games_show_result_and_reason()
    {
        $game = Game::factory()->finished(GameResult::BlackWins, GameEndReason::Resignation)->create();

        $this->actingAs($game->white)
            ->get(route('games.show', $game))
            ->assertInertia(fn (Assert $page) => $page
                ->where('game.status', 'finished')
                ->where('game.move_deadline', null)
                ->where('game.result', '0-1')
                ->where('game.end_reason', 'Resignation')
            );
    }

    public function test_finished_games_show_the_rating_each_player_reached()
    {
        $game = Game::factory()->create();

        $this->actingAs($game->black)->post(route('games.resign', $game));

        // Later results must not change what this game shows.
        $game->white->forceFill(['rating' => 1500])->save();

        $this->actingAs($game->white)
            ->get(route('games.show', $game))
            ->assertInertia(fn (Assert $page) => $page
                ->where('game.white.rating', 1216)
                ->where('game.white.rating_change', 16)
                ->where('game.black.rating', 1184)
                ->where('game.black.rating_change', -16)
            );
    }

    public function test_other_players_cannot_view_a_game()
    {
        $game = Game::factory()->create();

        $this->actingAs(User::factory()->create())
            ->get(route('games.show', $game))
            ->assertForbidden();
    }

    public function test_guests_are_redirected_to_login()
    {
        $game = Game::factory()->create();

        $this->get(route('games.show', $game))->assertRedirect(route('login'));
    }

    public function test_accepting_a_challenge_redirects_to_the_new_game()
    {
        $invitation = Invitation::factory()->create();

        $response = $this->actingAs($invitation->invitee)->post(route('invitations.accept', $invitation));

        $response->assertRedirect(route('games.show', Game::sole()));
    }
}
