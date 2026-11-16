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
        Schema::create('clans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 40)->unique();
            $table->string('tag', 4)->unique();
            $table->string('description', 280)->nullable();
            $table->string('emblem_shape', 16)->default('shield');
            $table->string('emblem_icon', 16)->default('crown');
            $table->char('emblem_primary', 7)->default('#b8860b');
            $table->char('emblem_secondary', 7)->default('#1f2937');
            $table->foreignId('leader_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clans');
    }
};
