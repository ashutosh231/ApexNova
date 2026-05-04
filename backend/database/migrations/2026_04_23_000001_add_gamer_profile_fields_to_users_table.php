<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('gamer_tag')->unique()->nullable()->after('name');
            $table->unsignedBigInteger('points')->default(0)->after('avatar_url');
            $table->enum('presence_status', ['online', 'offline'])->default('offline')->after('points');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['gamer_tag', 'points', 'presence_status']);
        });
    }
};
