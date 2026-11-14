<?php

namespace Tests\Unit;

use App\Enums\Army;
use PHPUnit\Framework\TestCase;

class ArmyTest extends TestCase
{
    public function test_every_army_has_a_name(): void
    {
        foreach (Army::cases() as $army) {
            $this->assertNotSame('', $army->label(), $army->value);
        }
    }
}
