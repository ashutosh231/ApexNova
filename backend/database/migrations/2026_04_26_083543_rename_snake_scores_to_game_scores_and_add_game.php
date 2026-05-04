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
        Schema::rename('snake_scores', 'game_scores');
        Schema::table('game_scores', function (Blueprint $table) {
            $table->string('game')->default('snake')->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('game_scores', function (Blueprint $table) {
            $table->dropColumn('game');
        });
        Schema::rename('game_scores', 'snake_scores');
    }
};
