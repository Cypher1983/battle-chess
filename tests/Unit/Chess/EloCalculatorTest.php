<?php

namespace Tests\Unit\Chess;

use App\Chess\EloCalculator;
use App\Enums\GameResult;
use PHPUnit\Framework\TestCase;

class EloCalculatorTest extends TestCase
{
    private EloCalculator $elo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->elo = new EloCalculator;
    }

    public function test_equal_players_have_an_even_expected_score()
    {
        $this->assertEqualsWithDelta(0.5, $this->elo->expectedScore(1200, 1200), 0.0001);
    }

    public function test_a_400_point_gap_gives_ten_to_one_odds()
    {
        $this->assertEqualsWithDelta(10 / 11, $this->elo->expectedScore(1600, 1200), 0.0001);
    }

    public function test_equal_players_move_16_points_on_a_decisive_result()
    {
        $this->assertSame(16, $this->elo->whiteChange(1200, 1200, GameResult::WhiteWins));
        $this->assertSame(-16, $this->elo->whiteChange(1200, 1200, GameResult::BlackWins));
    }

    public function test_a_draw_between_equals_changes_nothing()
    {
        $this->assertSame(0, $this->elo->whiteChange(1200, 1200, GameResult::Draw));
    }

    public function test_beating_a_stronger_player_earns_more()
    {
        $upset = $this->elo->whiteChange(1200, 1600, GameResult::WhiteWins);
        $expected = $this->elo->whiteChange(1600, 1200, GameResult::WhiteWins);

        $this->assertSame(29, $upset);
        $this->assertSame(3, $expected);
    }

    public function test_a_draw_against_a_stronger_player_gains_points()
    {
        // Expected score 1 / (1 + 10^0.75) ≈ 0.151, so 32 × (0.5 − 0.151) ≈ 11.
        $this->assertSame(11, $this->elo->whiteChange(1200, 1500, GameResult::Draw));
    }

    public function test_ratings_never_drop_below_the_floor()
    {
        $this->assertSame(-5, $this->elo->whiteChange(105, 105, GameResult::BlackWins));
        $this->assertSame(5, $this->elo->whiteChange(105, 105, GameResult::WhiteWins));
    }
}
