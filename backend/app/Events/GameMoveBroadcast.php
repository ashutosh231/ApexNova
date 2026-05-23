<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * In-match move relay (chess, tic-tac-toe, etc.).
 * The payload is opaque to the server — frontends agree on the schema.
 */
class GameMoveBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $roomCode,
        public readonly array  $payload,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("room.{$this->roomCode}")];
    }

    public function broadcastAs(): string
    {
        return 'game.move';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
