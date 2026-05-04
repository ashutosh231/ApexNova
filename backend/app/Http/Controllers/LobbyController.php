<?php

namespace App\Http\Controllers;

use App\Models\Friendship;
use App\Models\FriendRequest;
use App\Events\FriendRequestEvent;
use App\Models\GameScore;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LobbyController extends Controller
{
    /**
     * Friend IDs for listings: rows where I am user_id OR I am friend_id (covers one-way / legacy rows).
     *
     * @return \Illuminate\Support\Collection<int, int>
     */
    private function friendIdsForUser(int $userId)
    {
        $outgoing = Friendship::where('user_id', $userId)->pluck('friend_id');
        $incoming = Friendship::where('friend_id', $userId)->pluck('user_id');

        return $outgoing->merge($incoming)->unique()->values();
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    public function overview()
    {
        $user = auth('api')->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $leaderboard = $this->leaderboardData();
        $rank = collect($leaderboard)->search(fn ($entry) => (int) $entry['id'] === (int) $user->id);
        $friendIds = $this->friendIdsForUser((int) $user->id);

        $friends = User::whereIn('id', $friendIds)
            ->orderByDesc('presence_status')
            ->orderBy('name')
            ->get()
            ->map(fn ($friend) => [
                'id' => $friend->id,
                'name' => $friend->name,
                'gamer_tag' => $friend->gamer_tag,
                'avatar_url' => $friend->avatar_url,
                'status' => $friend->presence_status,
                'points' => (int) $friend->points,
            ])
            ->values();

        return response()->json([
            'game' => [
                'id' => 'snake_championship',
                'title' => 'Snake Championship',
                'cta' => 'Play Now',
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'gamer_tag' => $user->gamer_tag,
                'points' => (int) $user->points,
                'rank' => $rank === false ? null : $rank + 1,
            ],
            'leaderboard' => array_slice($leaderboard, 0, 10),
            'friends' => $friends,
        ]);
    }

    public function addFriend(Request $request)
    {
        $request->validate([
            'gamer_tag' => 'required|string',
        ]);

        $user = auth('api')->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $gamerTag = ltrim($request->gamer_tag, '@');
        $friend = User::where('gamer_tag', $gamerTag)->first();
        if (!$friend) {
            return response()->json(['error' => 'Gamer tag not found'], 404);
        }
        if ((int) $friend->id === (int) $user->id) {
            return response()->json(['error' => 'You cannot add yourself'], 422);
        }

        // Check if already friends (either direction)
        $alreadyFriends = Friendship::where('user_id', $user->id)->where('friend_id', $friend->id)->exists()
            || Friendship::where('user_id', $friend->id)->where('friend_id', $user->id)->exists();
        if ($alreadyFriends) {
            return response()->json(['error' => 'Already friends'], 422);
        }

        // Check if there's a pending request from the other user (auto-accept)
        $reversePending = FriendRequest::where('sender_id', $friend->id)
            ->where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($reversePending) {
            $reversePending->update(['status' => 'accepted']);
            Friendship::firstOrCreate(['user_id' => $user->id, 'friend_id' => $friend->id]);
            Friendship::firstOrCreate(['user_id' => $friend->id, 'friend_id' => $user->id]);
            return response()->json(['message' => 'Friend request accepted!']);
        }

        // Check 1-minute cooldown for rejected requests
        $recentRejected = FriendRequest::where('sender_id', $user->id)
            ->where('receiver_id', $friend->id)
            ->where('status', 'rejected')
            ->where('updated_at', '>=', now()->subMinutes(1))
            ->exists();

        if ($recentRejected) {
            return response()->json(['error' => 'Please wait 1 minute before sending another request.'], 422);
        }

        // Check if request already pending
        $existingRequest = FriendRequest::where('sender_id', $user->id)->where('receiver_id', $friend->id)->where('status', 'pending')->exists();
        if ($existingRequest) {
            return response()->json(['error' => 'Friend request already sent'], 422);
        }

        FriendRequest::updateOrCreate(
            ['sender_id' => $user->id, 'receiver_id' => $friend->id],
            ['status' => 'pending']
        );

        $requesterData = [
            'id' => $user->id,
            'name' => $user->name,
            'gamer_tag' => $user->gamer_tag,
            'avatar_url' => $user->avatar_url,
        ];

        try {
            broadcast(new FriendRequestEvent($requesterData, $friend->id));
        } catch (\Exception $e) {
            \Log::error('Broadcast failed in addFriend: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Friend request sent!']);
    }

    public function acceptFriendRequest(Request $request)
    {
        $request->validate([
            'sender_id' => 'required|integer',
        ]);

        $user = auth('api')->user();
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        $senderId = $request->sender_id;

        $friendRequest = FriendRequest::where('sender_id', $senderId)
            ->where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$friendRequest) {
            return response()->json(['error' => 'Friend request not found or already processed'], 404);
        }

        $friendRequest->update(['status' => 'accepted']);

        Friendship::firstOrCreate(['user_id' => $user->id, 'friend_id' => $senderId]);
        Friendship::firstOrCreate(['user_id' => $senderId, 'friend_id' => $user->id]);

        return response()->json(['message' => 'Friend request accepted']);
    }

    public function rejectFriendRequest(Request $request)
    {
        $request->validate([
            'sender_id' => 'required|integer',
        ]);

        $user = auth('api')->user();
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        $senderId = $request->sender_id;

        $friendRequest = FriendRequest::where('sender_id', $senderId)
            ->where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($friendRequest) {
            $friendRequest->update(['status' => 'rejected']);
        }

        return response()->json(['message' => 'Friend request rejected']);
    }

    public function removeFriend(int $friendId)
    {
        $user = auth('api')->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        Friendship::where('user_id', $user->id)->where('friend_id', $friendId)->delete();
        Friendship::where('user_id', $friendId)->where('friend_id', $user->id)->delete();

        return response()->json(['message' => 'Friend removed']);
    }

    public function profileData()
    {
        $user = auth('api')->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $leaderboard = $this->leaderboardData();
        $rank = collect($leaderboard)->search(fn ($entry) => (int) $entry['id'] === (int) $user->id);
        $friendIds = $this->friendIdsForUser((int) $user->id);

        $friends = User::whereIn('id', $friendIds)->orderBy('name')->get()->map(fn ($friend) => [
            'id' => $friend->id,
            'name' => $friend->name,
            'gamer_tag' => $friend->gamer_tag,
            'avatar_url' => $friend->avatar_url,
            'status' => $friend->presence_status,
            'points' => (int) $friend->points,
        ])->values();

        $recentMatches = GameScore::where('user_id', $user->id)
            ->latest('played_at')
            ->limit(8)
            ->get()
            ->map(fn ($match) => [
                'id' => $match->id,
                'game' => $match->game ?? 'snake',
                'score' => (int) $match->score,
                'won' => (bool) $match->won,
                'played_at' => $match->played_at,
            ])
            ->values();

        $gamesPlayed = GameScore::where('user_id', $user->id)->count();
        $wins = GameScore::where('user_id', $user->id)->where('won', true)->count();
        $bestScore = GameScore::where('user_id', $user->id)->max('score') ?? 0;

        $pendingRequests = FriendRequest::with('sender')
            ->where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->get()
            ->map(fn ($req) => [
                'id' => $req->sender->id,
                'name' => $req->sender->name,
                'gamer_tag' => $req->sender->gamer_tag,
                'avatar_url' => $req->sender->avatar_url,
            ])
            ->values();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'gamer_tag' => $user->gamer_tag,
                'avatar_url' => $user->avatar_url,
                'points' => (int) $user->points,
                'rank' => $rank === false ? null : $rank + 1,
                'presence_status' => $user->presence_status,
                'created_at' => $user->created_at,
            ],
            'stats' => [
                'games_played' => $gamesPlayed,
                'wins' => $wins,
                'win_rate' => $gamesPlayed > 0 ? round(($wins / $gamesPlayed) * 100, 1) : 0,
                'best_score' => (int) $bestScore,
            ],
            'friends' => $friends,
            'pending_requests' => $pendingRequests,
            'recent_matches' => $recentMatches,
        ]);
    }

    public function searchUsers(Request $request)
    {
        $user = auth('api')->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $query = $request->get('q', '');
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $cleanQuery = ltrim($query, '@');
        $forRoomInvite = $request->query('for') === 'room_invite';

        if ($forRoomInvite) {
            $excludeIds = [$user->id];
            $limit = 12;
        } else {
            $friendIds = $this->friendIdsForUser((int) $user->id)->all();
            $excludeIds = array_merge($friendIds, [$user->id]);
            $limit = 5;
        }

        $like = '%'.$this->escapeLike($cleanQuery).'%';

        $users = User::whereNotIn('id', $excludeIds)
            ->where(function ($q) use ($like) {
                $q->where('name', 'LIKE', $like)
                    ->orWhere('email', 'LIKE', $like)
                    ->orWhere('gamer_tag', 'LIKE', $like);
            })
            ->limit($limit)
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'gamer_tag' => $u->gamer_tag,
                'avatar_url' => $u->avatar_url,
            ]);

        return response()->json($users);
    }

    private function leaderboardData(): array
    {
        return DB::table('users')
            ->leftJoin('game_scores', function($join) {
                $join->on('users.id', '=', 'game_scores.user_id')
                     ->where('game_scores.game', '=', 'snake');
            })
            ->select(
                'users.id',
                'users.name',
                'users.gamer_tag',
                'users.avatar_url',
                DB::raw('COALESCE(MAX(game_scores.score), 0) as top_score'),
                DB::raw('users.points as points')
            )
            ->groupBy('users.id', 'users.name', 'users.gamer_tag', 'users.avatar_url', 'users.points')
            ->orderByDesc('top_score')
            ->orderByDesc('points')
            ->get()
            ->map(fn ($row, $index) => [
                'id' => (int) $row->id,
                'rank' => $index + 1,
                'name' => $row->name,
                'gamer_tag' => $row->gamer_tag,
                'avatar_url' => $row->avatar_url,
                'score' => (int) $row->top_score,
                'points' => (int) $row->points,
            ])
            ->values()
            ->all();
    }
}
