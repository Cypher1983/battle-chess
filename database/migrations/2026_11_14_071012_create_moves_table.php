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
        Schema::create('moves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('ply');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('from', 2);
            $table->char('to', 2);
            $table->char('promotion', 1)->nullable();
            $table->string('san', 10);
            $table->string('fen', 100);
            $table->timestamps();

            $table->unique(['game_id', 'ply']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('moves');
    }
};
