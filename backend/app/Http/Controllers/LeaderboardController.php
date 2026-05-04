<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeaderboardController extends Controller
{
    /**
     * Return the global Snake Championship leaderboard.
     * Sorted by best (max) score per user, then total points.
     */
    public function index(Request $request)
    {
        $authUser = auth('api')->user();
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $limit = min((int) $request->query('limit', 20), 100);
        $game = $request->query('game', 'All');
        $time = $request->query('time', 'All-time');

        $joinClosure = function($join) use ($game, $time) {
            $join->on('users.id', '=', 'game_scores.user_id');
            
            if ($game !== 'All') {
                $gameMap = [
                    'Snake' => 'snake',
                    'Tic Tac Toe' => 'tic_tac_toe',
                    'Reaction Test' => 'reaction',
                    'Memory Match' => 'memory',
                    'Number Guessing' => 'number',
                    'Word Blitz' => 'word_blitz',
                    'Chess Blitz' => 'chess',
                    'Color Surge' => 'color_surge',
                    'Math Rush' => 'math_rush',
                    'Math Maze' => 'math_maze',
                    'Ability Duels' => 'ability_duels',
                ];
                $dbGame = $gameMap[$game] ?? 'snake';
                $join->where('game_scores.game', '=', $dbGame);
            }

            if ($time === 'Today') {
                $join->whereDate('game_scores.played_at', today());
            } elseif ($time === 'Weekly') {
                $join->where('game_scores.played_at', '>=', now()->subDays(7));
            }
        };

        $query = DB::table('users')
            ->leftJoin('game_scores', $joinClosure)
            ->select(
                'users.id',
                'users.name',
                'users.gamer_tag',
                'users.avatar_url',
                'users.points',
                DB::raw('COALESCE(MAX(game_scores.score), 0) as best_score'),
                DB::raw('COUNT(game_scores.id) as games_played'),
                DB::raw('SUM(CASE WHEN game_scores.won = 1 THEN 1 ELSE 0 END) as wins')
            )
            ->groupBy('users.id', 'users.name', 'users.gamer_tag', 'users.avatar_url', 'users.points');

        if ($game !== 'All' || $time !== 'All-time') {
            $query->havingRaw('COUNT(game_scores.id) > 0');
        }

        $rows = $query->orderByDesc('best_score')
            ->orderByDesc('users.points')
            ->limit($limit)
            ->get();

        $leaderboard = $rows->map(function ($row, $index) use ($authUser) {
            return [
                'rank'         => $index + 1,
                'id'           => (int) $row->id,
                'name'         => $row->name,
                'gamer_tag'    => $row->gamer_tag,
                'avatar_url'   => $row->avatar_url,
                'best_score'   => (int) $row->best_score,
                'games_played' => (int) $row->games_played,
                'wins'         => (int) $row->wins,
                'points'       => (int) $row->points,
                'is_self'      => (int) $row->id === (int) $authUser->id,
            ];
        })->values();

        // Find the authenticated user's rank even if outside top-N
        $selfRank = $leaderboard->search(fn($e) => $e['is_self']);

        return response()->json([
            'leaderboard' => $leaderboard,
            'self_rank'   => $selfRank === false ? null : $selfRank + 1,
        ]);
    }
}
