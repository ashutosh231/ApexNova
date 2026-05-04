<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'gamer_tag' => 'testuser0001',
                'password' => 'password123',
                'email_verified_at' => now(),
                'presence_status' => 'offline',
            ]
        );

        User::updateOrCreate(
            ['email' => 'akyadav113114@gmail.com'],
            [
                'name' => 'Ak Yadav',
                'gamer_tag' => 'akyadav1131',
                'password' => 'password123',
                'email_verified_at' => now(),
                'presence_status' => 'offline',
            ]
        );
    }
}
