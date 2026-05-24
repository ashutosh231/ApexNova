<?php

namespace App\Http\Controllers;

use App\Services\LiveKitTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Issues short-lived LiveKit access tokens so the Web SDK can join
 * the same voice room without ever holding the API secret on the
 * client.
 *
 * GET /api/livekit/token?room=ABC123
 */
class LiveKitController extends Controller
{
    public function token(Request $request, LiveKitTokenService $svc): JsonResponse
    {
        $user = auth('api')->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $url    = (string) config('services.livekit.url');
        $key    = (string) config('services.livekit.api_key');
        $secret = (string) config('services.livekit.api_secret');

        if ($url === '' || $key === '' || $secret === '') {
            return response()->json([
                'error' => 'LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in the backend .env.',
            ], 503);
        }

        $request->validate([
            'room' => 'required|string|max:64',
        ]);

        $roomName = (string) $request->query('room');
        // Sanitise room — LiveKit allows alphanumerics, dashes, underscores
        $roomName = preg_replace('/[^A-Za-z0-9_\-]/', '', $roomName);
        if ($roomName === '') {
            return response()->json(['error' => 'Invalid room name'], 422);
        }

        $ttl = (int) $request->query('ttl', 3600);
        $ttl = max(60, min(86400, $ttl));

        $identity = (string) $user->id;
        $name     = $user->name ?: ('Player_' . $user->id);

        $jwt = $svc->generateAccessToken($key, $secret, $roomName, $identity, $name, $ttl);

        return response()->json([
            'url'        => $url,
            'token'      => $jwt,
            'identity'   => $identity,
            'name'       => $name,
            'room'       => $roomName,
            'expires_in' => $ttl,
        ]);
    }
}
