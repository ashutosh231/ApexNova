<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameRoom extends Model
{
    protected $fillable = ['code', 'game', 'host_id', 'mode', 'status', 'started_at', 'finished_at'];

    protected $casts = [
        'started_at'  => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    public function players(): HasMany
    {
        return $this->hasMany(GameRoomPlayer::class, 'room_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(RoomMessage::class, 'room_id');
    }

    public function invites(): HasMany
    {
        return $this->hasMany(GameInvite::class, 'game_room_id');
    }

    /** Serialize room state for broadcasting */
    public function toState(): array
    {
        return [
            'id'     => $this->id,
            'code'   => $this->code,
            'game'   => $this->game,
            'mode'   => $this->mode,
            'status' => $this->status,
            'players' => $this->players()->with('user')->get()->map(fn($p) => [
                'id'         => $p->user->id,
                'name'       => $p->user->name,
                'gamer_tag'  => $p->user->gamer_tag,
                'avatar_url' => $p->user->avatar_url,
                'ready'      => (bool) $p->ready,
                'score'      => $p->score,
                'is_host'    => $p->user_id === $this->host_id,
            ])->values()->all(),
        ];
    }
}
