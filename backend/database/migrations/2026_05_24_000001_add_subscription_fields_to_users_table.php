<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('subscription_tier', ['free', 'premium'])->default('free')->after('points');
            $table->boolean('trial_used')->default(false)->after('subscription_tier');
            $table->unsignedSmallInteger('daily_play_count')->default(0)->after('trial_used');
            $table->timestamp('daily_play_reset_at')->nullable()->after('daily_play_count');
            $table->timestamp('pass_activated_at')->nullable()->after('daily_play_reset_at');
            $table->timestamp('pass_expires_at')->nullable()->after('pass_activated_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'subscription_tier',
                'trial_used',
                'daily_play_count',
                'daily_play_reset_at',
                'pass_activated_at',
                'pass_expires_at',
            ]);
        });
    }
};
