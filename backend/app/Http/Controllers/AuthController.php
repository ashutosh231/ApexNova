<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Send OTP to the given email
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        // Check if user already exists
        if (User::where('email', $request->email)->exists()) {
            return response()->json(['error' => 'Email already in use'], 422);
        }

        $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Cache to Redis with explicit 10 minute (600 seconds) expiration TTL
        Redis::setex("otp:{$request->email}", 600, $code);

        // Dispatch beautiful OTP via Resend API
        try {
            $resend = \Resend::client(env('Resend_API'));
            $resend->emails()->send([
                'from' => 'onboarding@resend.dev',
                'to' => ['adiashuto30@gmail.com'],
                'subject' => 'ApexNova - Your Authentication Code',
                'html' => view('emails.auth.otp', ['otp' => $code])->render(),
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Resend API Error: ' . $e->getMessage());
            // Intentionally not failing the request so we can test the UI flow even if API quota hits
        }

        return response()->json(['message' => 'OTP sent successfully']);
    }

    /**
     * Verify the sent OTP
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6'
        ]);

        $storedOtp = Redis::get("otp:{$request->email}");

        if (!$storedOtp || $storedOtp !== $request->otp) {
            return response()->json(['error' => 'Invalid or expired OTP'], 400);
        }

        return response()->json(['message' => 'OTP verified successfully']);
    }

    /**
     * Finalize Registration and Return JWT
     */
    public function register(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'name' => 'required|string|min:2',
            'password' => 'required|string|min:8',
            'otp' => 'required|string|size:6'
        ]);

        // Double check OTP validity to prevent bypass directly checking Redis cache
        $storedOtp = Redis::get("otp:{$request->email}");
        
        if (!$storedOtp || $storedOtp !== $request->otp) {
            return response()->json(['error' => 'Invalid or expired OTP'], 400);
        }

        $user = User::create([
            'name' => $request->name,
            'gamer_tag' => $this->generateGamerTag($request->name),
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'email_verified_at' => now(),
            'presence_status' => 'online',
        ]);

        // Clean up Redis token immediately after authorization
        Redis::del("otp:{$request->email}");

        // Generate JWT
        $token = auth('api')->login($user);

        return $this->respondWithToken($token);
    }

    /**
     * Standard Login
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (! $token = auth('api')->attempt($credentials)) {
            return response()->json(['error' => 'Unauthorized. Invalid credentials.'], 401);
        }

        $user = auth('api')->user();
        $user->presence_status = 'online';
        $user->save();

        return $this->respondWithToken($token);
    }

    /**
     * Google Login
     */
    public function googleLogin(Request $request)
    {
        $request->validate([
            'idToken' => 'required|string'
        ]);

        $response = \Illuminate\Support\Facades\Http::post('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' . env('FIREBASE_API_KEY'), [
            'idToken' => $request->idToken
        ]);

        if ($response->failed() || !isset($response->json()['users'][0])) {
            return response()->json(['error' => 'Invalid Google token'], 401);
        }

        $firebaseUser = $response->json()['users'][0];
        $email = $firebaseUser['email'];
        $name = $firebaseUser['displayName'] ?? 'Gamer';

        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name' => $name,
                'gamer_tag' => $this->generateGamerTag($name),
                'email' => $email,
                'password' => Hash::make(Str::random(16)),
                'email_verified_at' => now(),
                'presence_status' => 'online',
            ]);
        } else {
            $user->presence_status = 'online';
            $user->save();
        }

        $token = auth('api')->login($user);

        return $this->respondWithToken($token);
    }

    /**
     * Format the JWT response
     */
    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user' => auth('api')->user()
        ]);
    }

    private function generateGamerTag(string $name): string
    {
        $base = Str::of($name)->lower()->replaceMatches('/[^a-z0-9]/', '')->value();
        $base = $base !== '' ? $base : 'player';

        do {
            $candidate = $base . rand(1000, 9999);
        } while (User::where('gamer_tag', $candidate)->exists());

        return $candidate;
    }
}
