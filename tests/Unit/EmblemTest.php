<?php

namespace Tests\Unit;

use App\Enums\EmblemIcon;
use App\Enums\EmblemShape;
use PHPUnit\Framework\TestCase;

class EmblemTest extends TestCase
{
    public function test_every_emblem_shape_has_a_name(): void
    {
        foreach (EmblemShape::cases() as $shape) {
            $this->assertNotSame('', $shape->label(), $shape->value);
        }
    }

    public function test_every_emblem_icon_has_a_name(): void
    {
        foreach (EmblemIcon::cases() as $icon) {
            $this->assertNotSame('', $icon->label(), $icon->value);
        }
    }
}
