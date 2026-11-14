<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Games started before players could pick an army were always the
     * Clockwork Legion against the Wildwood Court, which the defaults keep.
     */
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->string('white_army', 32)->default('clockwork')->after('black_id');
            $table->string('black_army', 32)->default('wildwood')->after('white_army');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn(['white_army', 'black_army']);
        });
    }
};
