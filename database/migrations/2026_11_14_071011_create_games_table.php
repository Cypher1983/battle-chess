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
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('white_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('black_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('invitation_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('fen', 100)->default('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
            $table->string('status', 20)->default('active');
            $table->string('result', 10)->nullable();
            $table->string('end_reason', 30)->nullable();
            $table->foreignId('draw_offered_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_move_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['white_id', 'status']);
            $table->index(['black_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
