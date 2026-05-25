<?php

namespace App\Http\Controllers;

use App\Services\AccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(private AccessService $accessService) {}

    /* ── GET /api/subscription/entitlements ────────────────────────── */
    public function entitlements(Request $request): JsonResponse
    {
        $user = auth('api')->user();
        if (! $user) return response()->json(['error' => 'Unauthorized'], 401);

        // Auto-expire premium if needed (side-effect handled in AccessService::isPremium via check)
        $tier       = $user->subscription_tier;
        $isExpired  = $tier === 'premium'
            && $user->pass_expires_at
            && now()->isAfter($user->pass_expires_at);

        if ($isExpired) {
            $user->subscription_tier = 'free';
            $user->save();
            $tier = 'free';
        }

        return response()->json([
            'tier'            => $tier,
            'is_premium'      => $tier === 'premium',
            'trial_used'      => (bool) $user->trial_used,
            'daily_play_count'=> (int)  $user->daily_play_count,
            'daily_cap'       => 3,
            'pass_activated_at' => $user->pass_activated_at?->toIso8601String(),
            'pass_expires_at'   => $user->pass_expires_at?->toIso8601String(),
            'locked_modes'    => ['tournament', 'ranked', 'bot_plus'],
            'perks_unlocked'  => $tier === 'premium' ? [
                'Unlimited plays across all 6 games',
                'Tournament mode with real prizes',
                'Ranked & competitive modes',
                'Priority matchmaking',
                'Play Pass profile badge',
                'Early access to new games',
            ] : [],
        ]);
    }

    /* ── POST /api/subscription/check ──────────────────────────────── */
    public function checkAccess(Request $request): JsonResponse
    {
        $request->validate([
            'game' => 'required|string|max:32',
            'mode' => 'required|string|max:32',
        ]);

        $user = auth('api')->user();
        if (! $user) return response()->json(['error' => 'Unauthorized'], 401);

        $result = $this->accessService->check($user, $request->game, $request->mode);

        return response()->json([
            'allowed' => $result['allowed'],
            'reason'  => $result['reason'],
            'message' => $result['message'],
        ], $result['allowed'] ? 200 : 403);
    }

    /* ── POST /api/subscription/activate ───────────────────────────── */
    public function activatePass(Request $request): JsonResponse
    {
        $user = auth('api')->user();
        if (! $user) return response()->json(['error' => 'Unauthorized'], 401);

        if ($user->subscription_tier === 'premium' && $user->pass_expires_at && now()->isBefore($user->pass_expires_at)) {
            return response()->json([
                'error'      => 'Play Pass is already active',
                'expires_at' => $user->pass_expires_at->toIso8601String(),
            ], 409);
        }

        $result = $this->accessService->activatePass($user);

        return response()->json([
            'success'    => true,
            'message'    => $result['message'],
            'perks'      => $result['perks'],
            'expires_at' => $result['expires_at'],
        ]);
    }
}
