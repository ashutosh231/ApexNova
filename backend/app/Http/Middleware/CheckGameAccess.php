<?php

namespace App\Http\Middleware;

use App\Services\AccessService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckGameAccess
{
    public function __construct(private AccessService $accessService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = auth('api')->user();

        if (! $user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $game = $request->input('game', 'unknown');
        $mode = $request->input('mode', 'solo');

        $result = $this->accessService->check($user, $game, $mode);

        if (! $result['allowed']) {
            return response()->json([
                'allowed' => false,
                'reason'  => $result['reason'],
                'message' => $result['message'],
            ], 403);
        }

        return $next($request);
    }
}
