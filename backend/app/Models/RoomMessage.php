<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomMessage extends Model
{
    protected $fillable = ['room_id', 'user_id', 'message'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
