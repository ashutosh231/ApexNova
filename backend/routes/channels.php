<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\GameRoom;
use App\Models\GameRoomPlayer;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// Private room channel — only players in the room can subscribe
Broadcast::channel('room.{code}', function ($user, $code) {
    $normalized = strtoupper(trim((string) $code));
    $room = GameRoom::whereRaw('UPPER(TRIM(code)) = ?', [$normalized])->first();
    if (!$room) return false;

    // Host or joined player
    if ($room->host_id === $user->id) return true;

    return GameRoomPlayer::where('room_id', $room->id)
        ->where('user_id', $user->id)
        ->exists();
});

// Private user channel for invites and direct notifications
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
