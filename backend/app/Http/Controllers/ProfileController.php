<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Cloudinary\Cloudinary;

class ProfileController extends Controller
{
    public function uploadAvatar(Request $request)
    {
        $request->validate(['avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120']);
        $user = auth('api')->user();
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        try {
            $cloudinary = new Cloudinary([
                'cloud' => ['cloud_name' => env('CLOUDINARY_CLOUD_NAME'), 'api_key' => env('CLOUDINARY_API_KEY'), 'api_secret' => env('CLOUDINARY_API_SECRET')],
                'url'   => ['secure' => true],
            ]);

            $result = $cloudinary->uploadApi()->upload($request->file('avatar')->getRealPath(), [
                'folder' => 'apexnova/avatars', 'public_id' => 'user_' . $user->id, 'overwrite' => true,
                'transformation' => ['width' => 400, 'height' => 400, 'crop' => 'fill', 'gravity' => 'face', 'quality' => 'auto', 'fetch_format' => 'auto'],
            ]);

            $user->avatar_url = $result['secure_url'];
            $user->save();

            return response()->json(['message' => 'Avatar uploaded', 'avatar_url' => $result['secure_url'], 'user' => $user]);
        } catch (\Exception $e) {
            Log::error('Cloudinary upload failed: ' . $e->getMessage());
            return response()->json(['error' => 'Upload failed: ' . $e->getMessage()], 500);
        }
    }

    public function me()
    {
        $user = auth('api')->user();
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);
        return response()->json(['user' => $user]);
    }

    /** PATCH /api/profile/update — update name and gamer_tag */
    public function updateProfile(Request $request)
    {
        $user = auth('api')->user();
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        $data = $request->validate([
            'name'      => 'sometimes|string|max:80',
            'gamer_tag' => 'sometimes|string|max:40|unique:users,gamer_tag,' . $user->id,
        ]);

        $user->fill($data)->save();
        return response()->json(['message' => 'Profile updated', 'user' => $user]);
    }

    /** POST /api/profile/change-password */
    public function changePassword(Request $request)
    {
        $user = auth('api')->user();
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['error' => 'Current password is incorrect'], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Password changed successfully']);
    }

    /** POST /api/profile/score — submit solo snake score */
    public function submitSoloScore(Request $request)
    {
        $user = auth('api')->user();
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        $request->validate([
            'score' => 'required|integer|min:0',
            'game' => 'sometimes|string|max:32',
        ]);

        $allowedGames = ['snake', 'tic_tac_toe', 'reaction', 'memory', 'number', 'word_blitz', 'chess', 'color_surge', 'math_rush', 'math_maze', 'ability_duels'];
        $game = in_array((string) $request->input('game', 'snake'), $allowedGames, true)
            ? $request->input('game')
            : 'snake';

        \App\Models\GameScore::create([
            'user_id'   => $user->id,
            'game'      => $game,
            'score'     => $request->score,
            'won'       => false,
            'played_at' => now(),
        ]);

        // 1 pt per 10 score earned
        $pts = intdiv($request->score, 10);
        if ($pts > 0) $user->increment('points', $pts);

        return response()->json([
            'message'       => 'Score saved',
            'points_earned' => $pts,
            'total_points'  => $user->fresh()->points,
        ]);
    }
}
