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
        Schema::table('moves', function (Blueprint $table) {
            // Piece types (p, n, b, r, q, k). Nullable for moves made before this column existed.
            $table->char('piece', 1)->nullable()->after('to');
            $table->char('captured', 1)->nullable()->after('piece');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('moves', function (Blueprint $table) {
            $table->dropColumn(['piece', 'captured']);
        });
    }
};
