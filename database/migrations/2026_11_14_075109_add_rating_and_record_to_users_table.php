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
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('rating')->default(1200)->after('username');
            $table->unsignedInteger('wins')->default(0)->after('rating');
            $table->unsignedInteger('losses')->default(0)->after('wins');
            $table->unsignedInteger('draws')->default(0)->after('losses');

            $table->index('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['rating']);
            $table->dropColumn(['rating', 'wins', 'losses', 'draws']);
        });
    }
};
