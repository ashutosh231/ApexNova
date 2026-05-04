<?php

namespace App\Http\Controllers;

use App\Events\ChatMessageSent;
use App\Events\RoomUpdated;
use App\Events\GameInviteEvent;
use App\Models\GameInvite;
use App\Models\GameRoom;
use App\Models\GameRoomPlayer;
use App\Models\RoomMessage;
use App\Models\GameScore;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GameRoomController extends Controller
{
    /* ── Helpers ───────────────────────────────────────────── */
    private function authUser()
    {
        $user = auth('api')->user();
        if (!$user) abort(401, 'Unauthorized');
        return $user;
    }

    private function findRoom(string $code): GameRoom
    {
        $normalized = strtoupper(trim($code));
        if ($normalized === '') {
            abort(404, 'Room not found');
        }

        $room = GameRoom::whereRaw('UPPER(TRIM(code)) = ?', [$normalized])->first();
        if (! $room) {
            abort(404, 'Room not found');
        }

        return $room;
    }

    private function broadcast(GameRoom $room, string $event = 'room.updated'): void
    {
        $room->load('players.user');
        try {
            broadcast(new RoomUpdated($room->code, $room->toState(), $event))->toOthers();
        } catch (\Throwable $e) {
            \Log::error("Broadcast failed in GameRoom {$event}: " . $e->getMessage());
        }
    }

    /* ── POST /api/rooms — Create room ─────────────────────── */
    public function create(Request $request)
    {
        $user = $this->authUser();

        // Generate unique 6-char code
        do { $code = strtoupper(Str::random(6)); }
        while (GameRoom::where('code', $code)->exists());

        $room = GameRoom::create([
            'code'    => $code,
            'game'    => $request->input('game', 'snake'),
            'host_id' => $user->id,
            'mode'    => 'friend',
            'status'  => 'waiting',
        ]);

        GameRoomPlayer::create([
            'room_id' => $room->id,
            'user_id' => $user->id,
            'ready'   => false,
        ]);

        $room->load('players.user');

        return response()->json([
            'room' => $room->toState(),
        ], 201);
    }

    /* ── POST /api/rooms/invite ────────────────────────────── */
    public function invite(Request $request)
    {
        $request->validate([
            'friend_id' => 'required|integer',
            'room_code' => 'nullable|string'
        ]);
        
        $user = $this->authUser();
        $friendId = $request->friend_id;
        $room = null;

        if ($request->has('room_code') && $request->room_code) {
            $codeNorm = strtoupper(trim((string) $request->room_code));
            $room = GameRoom::whereRaw('UPPER(TRIM(code)) = ?', [$codeNorm])->where('status', 'waiting')->first();
            if (! $room) {
                return response()->json(['error' => 'Room not found or no longer waiting'], 404);
            }
            
            $inRoom = GameRoomPlayer::where('room_id', $room->id)->where('user_id', $user->id)->exists();
            if (!$inRoom) return response()->json(['error' => 'You are not in this room'], 403);
        } else {
            // Check if a waiting room already exists where user is host for this specific game
            $query = GameRoom::where('host_id', $user->id)->where('status', 'waiting');
            if ($request->has('game')) {
                $query->where('game', $request->game);
            }
            $room = $query->first();

            if (!$room) {
                // Generate unique 6-char code
                do { $code = strtoupper(Str::random(6)); }
                while (GameRoom::where('code', $code)->exists());

                $room = GameRoom::create([
                    'code'    => $code,
                    'game'    => $request->input('game', 'snake'),
                    'host_id' => $user->id,
                    'mode'    => 'friend',
                    'status'  => 'waiting',
                ]);

                GameRoomPlayer::create([
                    'room_id' => $room->id,
                    'user_id' => $user->id,
                    'ready'   => false,
                ]);
            }
        }

        $invite = GameInvite::updateOrCreate(
            [
                'game_room_id' => $room->id,
                'invitee_id' => $friendId,
            ],
            [
                'room_code' => $room->code,
                'inviter_id' => $user->id,
                'game' => $room->game ?? 'snake',
                'status' => 'pending',
                'expires_at' => now()->addSeconds(30),
            ]
        );

        $inviterData = [
            'invite_id' => $invite->id,
            'id' => $user->id,
            'name' => $user->name,
            'avatar_url' => $user->avatar_url,
            'room_code' => $room->code,
            'game' => $room->game,
            'expires_at' => $invite->expires_at?->toIso8601String(),
        ];

        try {
            broadcast(new GameInviteEvent($inviterData, $friendId));
        } catch (\Exception $e) {
            \Log::error('Broadcast failed in GameRoom invite: ' . $e->getMessage());
        }

        $room->load('players.user');

        return response()->json([
            'room' => $room->toState(),
            'message' => 'Invite sent successfully',
        ]);
    }

    /* ── POST /api/rooms/{code}/join ───────────────────────── */
    public function join(string $code)
    {
        $user = $this->authUser();
        $room = $this->findRoom($code);

        if ($room->status !== 'waiting') {
            return response()->json(['error' => 'Match already started or finished'], 409);
        }

        if ($room->players()->count() >= 4) {
            return response()->json(['error' => 'Room is full (max 4 players)'], 409);
        }

        GameRoomPlayer::firstOrCreate(
            ['room_id' => $room->id, 'user_id' => $user->id],
            ['ready' => false]
        );

        GameInvite::where('game_room_id', $room->id)
            ->where('invitee_id', $user->id)
            ->where('status', 'pending')
            ->update(['status' => 'accepted']);

        $room->load('players.user');
        $state = $room->toState();

        try {
            broadcast(new RoomUpdated($room->code, $state, 'room.updated'))->toOthers();
        } catch (\Throwable $e) {
            \Log::error('Broadcast failed in GameRoom join: '.$e->getMessage());
        }

        return response()->json(['room' => $state]);
    }

    /* ── GET /api/rooms/{code} ─────────────────────────────── */
    public function show(string $code)
    {
        $this->authUser();
        $room = $this->findRoom($code);
        $room->load('players.user');
        return response()->json(['room' => $room->toState()]);
    }

    /* ── POST /api/rooms/{code}/leave ──────────────────────── */
    public function leave(string $code)
    {
        $user = $this->authUser();
        $room = $this->findRoom($code);

        GameRoomPlayer::where('room_id', $room->id)->where('user_id', $user->id)->delete();

        if ($room->players()->count() > 0) {
            if ($room->host_id === $user->id) {
                $newHost = GameRoomPlayer::where('room_id', $room->id)->first();
                if ($newHost) {
                    $room->update(['host_id' => $newHost->user_id]);
                }
            }
            $room->load('players.user');
            $state = $room->toState();
            $this->broadcast($room);
        } else {
            // If empty, we could delete it, but let's just let it sit or delete it.
            $room->delete();
        }

        return response()->json(['success' => true]);
    }

    /* ── POST /api/rooms/{code}/ready ──────────────────────── */
    public function ready(string $code)
    {
        $user = $this->authUser();
        $room = $this->findRoom($code);

        $player = GameRoomPlayer::where('room_id', $room->id)->where('user_id', $user->id)->first();
        if (!$player) return response()->json(['error' => 'Not in this room'], 403);

        $player->ready = !$player->ready;
        $player->save();

        $room->load('players.user');
        $state = $room->toState();
        $this->broadcast($room);

        return response()->json(['room' => $state]);
    }

    /* ── POST /api/rooms/{code}/start ──────────────────────── */
    public function start(string $code)
    {
        $user = $this->authUser();
        $room = $this->findRoom($code);

        if ($room->host_id !== $user->id) {
            return response()->json(['error' => 'Only the host can start the match'], 403);
        }

        if ($room->status !== 'waiting') {
            return response()->json(['error' => 'Room is not in waiting state'], 409);
        }

        $allReady = $room->players()->where('ready', false)->doesntExist();
        if (!$allReady) {
            return response()->json(['error' => 'Not all players are ready'], 409);
        }

        $room->update(['status' => 'active', 'started_at' => now()]);
        $room->load('players.user');
        $state = $room->toState();

        $this->broadcast($room, 'match.started');

        return response()->json(['room' => $state]);
    }

    /* ── POST /api/rooms/{code}/chat ───────────────────────── */
    public function chat(Request $request, string $code)
    {
        $request->validate(['message' => 'required|string|max:500']);
        $user = $this->authUser();
        $room = $this->findRoom($code);

        $msg = RoomMessage::create([
            'room_id' => $room->id,
            'user_id' => $user->id,
            'message' => $request->message,
        ]);

        $payload = [
            'id'         => $msg->id,
            'user_id'    => $user->id,
            'name'       => $user->name,
            'gamer_tag'  => $user->gamer_tag,
            'avatar_url' => $user->avatar_url,
            'message'    => $msg->message,
            'created_at' => $msg->created_at->toIso8601String(),
        ];

        try {
            broadcast(new ChatMessageSent($room->code, $payload))->toOthers();
        } catch (\Throwable $e) {
            \Log::error('Broadcast failed in GameRoom chat: '.$e->getMessage());
        }

        return response()->json(['message' => $payload]);
    }

    /* ── POST /api/rooms/{code}/score ──────────────────────── */
    public function submitScore(Request $request, string $code)
    {
        $request->validate(['score' => 'required|integer|min:0']);
        $user = $this->authUser();
        $room = $this->findRoom($code);

        if ($room->status !== 'active') {
            return response()->json(['error' => 'Match is not active'], 409);
        }

        $player = GameRoomPlayer::where('room_id', $room->id)->where('user_id', $user->id)->first();
        if (!$player) return response()->json(['error' => 'Not in this room'], 403);

        $player->score = $request->score;
        $player->save();

        // Persist to game_scores (leaderboard)
        GameScore::create([
            'user_id'   => $user->id,
            'game'      => $room->game ?? 'snake',
            'score'     => $request->score,
            'won'       => false, // determined after all scores in
            'played_at' => now(),
        ]);

        // Check if all players have submitted scores
        $room->load('players.user');
        $allDone = $room->players()->whereNull('score')->doesntExist();

        if ($allDone) {
            $room->update(['status' => 'finished', 'finished_at' => now()]);

            // Mark winner in game_scores
            $winner = $room->players()->orderByDesc('score')->first();
            if ($winner) {
                GameScore::where('user_id', $winner->user_id)
                    ->where('game', $room->game ?? 'snake')
                    ->whereDate('played_at', today())
                    ->orderByDesc('id')
                    ->first()
                    ?->update(['won' => true]);

                // Award points
                $winner->user()->increment('points', 100);
            }

            $state = $room->toState();
            $this->broadcast($room, 'match.finished');
            return response()->json(['room' => $state, 'finished' => true]);
        }

        $state = $room->toState();
        $this->broadcast($room, 'score.submitted');

        return response()->json(['room' => $state, 'finished' => false]);
    }

    /* ── POST /api/rooms/{code}/play-again ─────────────────── */
    public function playAgain(string $code)
    {
        $user = $this->authUser();
        $room = $this->findRoom($code);

        // Only allow if room is finished
        if ($room->status !== 'finished') {
            return response()->json(['error' => 'Match is not finished yet'], 409);
        }

        $room->update(['status' => 'waiting', 'started_at' => null, 'finished_at' => null]);
        
        GameRoomPlayer::where('room_id', $room->id)->update([
            'ready' => false,
            'score' => null
        ]);

        $room->load('players.user');
        $state = $room->toState();

        $this->broadcast($room);

        return response()->json(['room' => $state]);
    }

    /* ── GET /api/rooms/{code}/messages ────────────────────── */
    public function messages(string $code)
    {
        $this->authUser();
        $room = $this->findRoom($code);

        $messages = RoomMessage::where('room_id', $room->id)
            ->with('user')
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => [
                'id'         => $m->id,
                'user_id'    => $m->user_id,
                'name'       => $m->user->name,
                'gamer_tag'  => $m->user->gamer_tag,
                'avatar_url' => $m->user->avatar_url,
                'message'    => $m->message,
                'created_at' => $m->created_at->toIso8601String(),
            ])->values();

        return response()->json(['messages' => $messages]);
    }

    /** GET /api/lobby/game-invites/pending — poll when WebSockets are unavailable */
    public function pendingGameInvites()
    {
        $user = $this->authUser();

        $rows = GameInvite::query()
            ->where('invitee_id', $user->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->with('inviter:id,name,gamer_tag,avatar_url')
            ->orderByDesc('updated_at')
            ->get();

        $payload = $rows->map(fn (GameInvite $inv) => [
            'invite_id' => $inv->id,
            'id' => $inv->inviter->id,
            'name' => $inv->inviter->name,
            'gamer_tag' => $inv->inviter->gamer_tag,
            'avatar_url' => $inv->inviter->avatar_url,
            'room_code' => strtoupper(trim((string) $inv->room_code)),
            'game' => $inv->game,
            'expires_at' => $inv->expires_at?->toIso8601String(),
        ])->values();

        return response()->json(['invites' => $payload]);
    }

    /** POST /api/lobby/game-invites/decline */
    public function declineGameInvite(Request $request)
    {
        $request->validate([
            'invite_id' => 'sometimes|integer',
            'room_code' => 'sometimes|string|max:16',
        ]);

        if (! $request->filled('invite_id') && ! $request->filled('room_code')) {
            return response()->json(['error' => 'invite_id or room_code required'], 422);
        }

        $user = $this->authUser();

        $invite = null;
        if ($request->filled('invite_id')) {
            $invite = GameInvite::where('id', $request->invite_id)
                ->where('invitee_id', $user->id)
                ->where('status', 'pending')
                ->first();
        } else {
            $code = strtoupper($request->room_code);
            $invite = GameInvite::where('room_code', $code)
                ->where('invitee_id', $user->id)
                ->where('status', 'pending')
                ->first();
        }

        if (! $invite) {
            return response()->json(['error' => 'Invite not found'], 404);
        }

        $invite->update(['status' => 'declined']);

        return response()->json(['success' => true]);
    }
}
