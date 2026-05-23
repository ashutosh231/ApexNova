<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TournamentController extends Controller
{
    /**
     * Public catalog for the /tournaments page.
     * Enriches player counts from recent game_scores when available.
     */
    public function index(): JsonResponse
    {
        $catalog = collect(config('tournaments', []))
            ->sortBy('sort_order')
            ->values();

        $recentByGame = DB::table('game_scores')
            ->select('game', DB::raw('COUNT(DISTINCT user_id) as active_players'))
            ->where('played_at', '>=', now()->subDays(7))
            ->groupBy('game')
            ->pluck('active_players', 'game');

        $tournaments = $catalog->map(function (array $t) use ($recentByGame) {
            $backendGame = $t['backend_game'] ?? null;
            $liveBoost = $backendGame && isset($recentByGame[$backendGame])
                ? (int) $recentByGame[$backendGame]
                : 0;

            $current = (int) ($t['players_current'] ?? 0);
            $max = max(1, (int) ($t['players_max'] ?? 1));

            if ($liveBoost > 0) {
                $current = min($max, $current + min($liveBoost, (int) ceil($max * 0.08)));
            }

            $players = sprintf(
                '%s / %s',
                number_format($current),
                number_format($max)
            );

            return [
                'id' => $t['id'],
                'emoji' => $t['emoji'],
                'name' => $t['name'],
                'game' => $t['game'],
                'backend_game' => $backendGame,
                'category' => $t['category'],
                'difficulty' => $t['difficulty'],
                'players' => $players,
                'players_current' => $current,
                'players_max' => $max,
                'fill_percent' => (int) min(100, round(($current / $max) * 100)),
                'prize' => $t['prize'],
                'tag_label' => $t['tag_label'],
                'is_live' => (bool) ($t['is_live'] ?? false),
                'time_left' => $t['time_left'],
                'cover_image' => $t['cover_image'],
                'accent' => $t['accent'],
                'secondary' => $t['secondary'],
            ];
        })->values();

        $liveCount = $tournaments->where('is_live', true)->count();
        $totalPrize = $tournaments->sum(
            fn ($t) => (int) preg_replace('/[^0-9]/', '', $t['prize'] ?? '0')
        );

        return response()->json([
            'tournaments' => $tournaments,
            'meta' => [
                'count' => $tournaments->count(),
                'live_count' => $liveCount,
                'total_prize' => $totalPrize,
                'season' => 'Season 03',
            ],
        ]);
    }
}
