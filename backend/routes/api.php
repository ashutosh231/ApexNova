<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\LobbyController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\GameRoomController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('auth')->group(function () {
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/google', [AuthController::class, 'googleLogin']);
});

Route::middleware('auth:api')->group(function () {
    // Profile
    Route::prefix('profile')->group(function () {
        Route::get('/me',              [ProfileController::class, 'me']);
        Route::post('/avatar',         [ProfileController::class, 'uploadAvatar']);
        Route::get('/data',            [LobbyController::class, 'profileData']);
        Route::patch('/update',        [ProfileController::class, 'updateProfile']);
        Route::post('/change-password',[ProfileController::class, 'changePassword']);
        Route::post('/score',          [ProfileController::class, 'submitSoloScore']);
    });

    // Lobby
    Route::prefix('lobby')->group(function () {
        Route::get('/overview', [LobbyController::class, 'overview']);
        Route::post('/friends', [LobbyController::class, 'addFriend']);
        Route::get('/friends/search', [LobbyController::class, 'searchUsers']);
        Route::post('/friends/accept', [LobbyController::class, 'acceptFriendRequest']);
        Route::post('/friends/reject', [LobbyController::class, 'rejectFriendRequest']);
        Route::delete('/friends/{friendId}', [LobbyController::class, 'removeFriend']);
        Route::get('/game-invites/pending', [GameRoomController::class, 'pendingGameInvites']);
        Route::post('/game-invites/decline', [GameRoomController::class, 'declineGameInvite']);
    });

    // Leaderboard
    Route::get('/leaderboard', [LeaderboardController::class, 'index']);

    // Game Rooms
    Route::prefix('rooms')->group(function () {
        Route::post('/invite',                [GameRoomController::class, 'invite']);
        Route::post('/',                      [GameRoomController::class, 'create']);
        Route::get('/{code}',                 [GameRoomController::class, 'show']);
        Route::post('/{code}/join',           [GameRoomController::class, 'join']);
        Route::post('/{code}/leave',          [GameRoomController::class, 'leave']);
        Route::post('/{code}/ready',          [GameRoomController::class, 'ready']);
        Route::post('/{code}/start',          [GameRoomController::class, 'start']);
        Route::post('/{code}/play-again',     [GameRoomController::class, 'playAgain']);
        Route::post('/{code}/chat',           [GameRoomController::class, 'chat']);
        Route::post('/{code}/score',          [GameRoomController::class, 'submitScore']);
        Route::get('/{code}/messages',        [GameRoomController::class, 'messages']);
    });
});
