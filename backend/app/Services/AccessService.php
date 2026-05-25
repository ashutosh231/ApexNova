<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;

class AccessService
{
    /** Modes that are always locked behind Play Pass */
    private const LOCKED_MODES = ['tournament', 'ranked', 'bot_plus'];

    /** How many plays a free user gets per calendar day (after trial) */
    private const FREE_DAILY_CAP = 3;

    /**
     * Check whether a user can start a game session.
     *
     * @return array{ allowed: bool, reason: string|null, message: string|null }
     */
    public function check(User $user, string $game, string $mode): array
    {
        // ── 1. Premium users bypass all restrictions ───────────────────
        if ($this->isPremium($user)) {
            return ['allowed' => true, 'reason' => null, 'message' => null];
        }

        // ── 2. Tournament mode is always locked for free users ─────────
        if ($mode === 'tournament') {
            $msg = $this->generateDenialMessage($user, $game, 'premium_required');
            return ['allowed' => false, 'reason' => 'premium_required', 'message' => $msg];
        }

        // ── 3. Other locked modes ──────────────────────────────────────
        if (in_array($mode, self::LOCKED_MODES, true)) {
            $msg = $this->generateDenialMessage($user, $game, 'locked_mode');
            return ['allowed' => false, 'reason' => 'locked_mode', 'message' => $msg];
        }

        // ── 4. One-time trial play (free users, first ever) ────────────
        if (! $user->trial_used) {
            $user->trial_used         = true;
            $user->daily_play_count   = 1;
            $user->daily_play_reset_at = Carbon::today();
            $user->save();
            return ['allowed' => true, 'reason' => null, 'message' => null];
        }

        // ── 5. Reset daily counter if a new calendar day has started ───
        $this->maybeResetDailyCount($user);

        // ── 6. Daily cap check ─────────────────────────────────────────
        if ($user->daily_play_count >= self::FREE_DAILY_CAP) {
            $msg = $this->generateDenialMessage($user, $game, 'daily_cap_hit');
            return ['allowed' => false, 'reason' => 'daily_cap_hit', 'message' => $msg];
        }

        // ── 7. Allow — increment daily count ──────────────────────────
        $user->increment('daily_play_count');
        return ['allowed' => true, 'reason' => null, 'message' => null];
    }

    /**
     * Activate a monthly Play Pass for the given user.
     *
     * @return array{ message: string, perks: string[], expires_at: string }
     */
    public function activatePass(User $user): array
    {
        $now = Carbon::now();

        $user->subscription_tier  = 'premium';
        $user->pass_activated_at  = $now;
        $user->pass_expires_at    = $now->copy()->addDays(30);
        $user->save();

        $gameName = $this->randomGameName();

        $perks = [
            'Unlimited plays across all 6 games — every single day',
            'Full tournament mode access with real prize pools',
            'Ranked & competitive modes unlocked',
            'Priority matchmaking — shorter queue times',
            'Exclusive Play Pass badge on your profile',
            'Early access to new games and features',
        ];

        $message = "🏆 Play Pass activated! You now have 30 days of unlimited access, {$user->name}. "
            . "Head back to {$gameName} — no caps, no locks, pure competition.";

        return [
            'message'    => $message,
            'perks'      => $perks,
            'expires_at' => $user->pass_expires_at->toIso8601String(),
        ];
    }

    /**
     * Generate a short personalised denial message.
     */
    public function generateDenialMessage(User $user, string $game, string $reason): string
    {
        $gameLabel = $this->gameLabel($game);
        $name      = $user->name;

        return match ($reason) {
            'trial_used' =>
                "Hey {$name}, your free trial for {$gameLabel} has been used. "
                . "Upgrade to Play Pass for unlimited games, tournament mode, and ranked access.",

            'daily_cap_hit' =>
                "You've hit today's 3-game limit on {$gameLabel}, {$name}. "
                . "Play Pass removes all daily caps and unlocks tournaments, ranked mode, and every game — "
                . "for just one monthly subscription.",

            'premium_required' =>
                "Tournament mode on {$gameLabel} is a Play Pass exclusive, {$name}. "
                . "Upgrade to compete for real prizes, unlock ranked play, and get unlimited daily sessions.",

            'locked_mode' =>
                "This mode on {$gameLabel} is locked to Play Pass members, {$name}. "
                . "Upgrade to unlock it along with tournaments, ranked, and unlimited daily plays.",

            default =>
                "Upgrade to Play Pass to unlock full access to {$gameLabel} and all other games, {$name}.",
        };
    }

    // ── Private helpers ────────────────────────────────────────────────

    private function isPremium(User $user): bool
    {
        if ($user->subscription_tier !== 'premium') {
            return false;
        }

        // Auto-expire if pass has lapsed
        if ($user->pass_expires_at && Carbon::now()->isAfter($user->pass_expires_at)) {
            $user->subscription_tier = 'free';
            $user->save();
            return false;
        }

        return true;
    }

    private function maybeResetDailyCount(User $user): void
    {
        $resetAt = $user->daily_play_reset_at
            ? Carbon::parse($user->daily_play_reset_at)
            : null;

        if (! $resetAt || $resetAt->startOfDay()->lt(Carbon::today())) {
            $user->daily_play_count    = 0;
            $user->daily_play_reset_at = Carbon::today();
            $user->save();
        }
    }

    private function gameLabel(string $game): string
    {
        return match (strtolower($game)) {
            'snake'   => 'Snake Championship',
            'tictactoe', 'tic' => 'Tic Tac Toe',
            'memory'  => 'Memory Match',
            'number'  => 'Number Guessing',
            'pixel'   => 'Pixel Art',
            'chess'   => 'Chess Arena',
            default   => ucfirst($game),
        };
    }

    private function randomGameName(): string
    {
        $games = ['Snake Championship', 'Memory Match', 'Chess Arena', 'Number Guessing', 'Pixel Art', 'Tic Tac Toe'];
        return $games[array_rand($games)];
    }
}
