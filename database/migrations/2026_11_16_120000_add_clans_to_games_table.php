<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->foreignId('white_clan_id')->nullable()->after('black_rating_change')->constrained('clans')->nullOnDelete();
            $table->foreignId('black_clan_id')->nullable()->after('white_clan_id')->constrained('clans')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropConstrainedForeignId('white_clan_id');
            $table->dropConstrainedForeignId('black_clan_id');
        });
    }
};
