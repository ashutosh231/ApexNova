<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast on every score submission so the global leaderboard
 * page can refresh in real time.
 *
 * Goes to a PUBLIC channel `leaderboard` so unauthenticated viewers
 * (and any logged-in user) can listen without needing per-user auth.
 *
 * The payload is intentionally small — clients re-fetch the leaderboard
 * with their own filters when they receive this event.
 */
class LeaderboardUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly array $payload,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('leaderboard')];
    }

    public function broadcastAs(): string
    {
        return 'leaderboard.updated';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
