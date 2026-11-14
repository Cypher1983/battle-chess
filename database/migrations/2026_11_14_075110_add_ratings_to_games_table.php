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
            $table->unsignedSmallInteger('white_rating_before')->nullable()->after('end_reason');
            $table->unsignedSmallInteger('black_rating_before')->nullable()->after('white_rating_before');
            $table->smallInteger('white_rating_change')->nullable()->after('black_rating_before');
            $table->smallInteger('black_rating_change')->nullable()->after('white_rating_change');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn([
                'white_rating_before',
                'black_rating_before',
                'white_rating_change',
                'black_rating_change',
            ]);
        });
    }
};
