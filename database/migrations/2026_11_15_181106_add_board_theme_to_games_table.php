<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The board both players see. Older games keep the classic board.
     */
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->string('board_theme', 32)->default('classic')->after('black_army');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('board_theme');
        });
    }
};
