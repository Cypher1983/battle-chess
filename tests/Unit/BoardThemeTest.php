<?php

namespace Tests\Unit;

use App\Enums\BoardTheme;
use PHPUnit\Framework\TestCase;

class BoardThemeTest extends TestCase
{
    public function test_every_board_theme_has_a_name(): void
    {
        foreach (BoardTheme::cases() as $theme) {
            $this->assertNotSame('', $theme->label(), $theme->value);
        }
    }
}
