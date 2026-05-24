<?php

namespace App\Services;

/**
 * LiveKit access-token generator.
 *
 * Produces a short-lived HS256 JWT that the Web SDK exchanges for
 * a connection to the LiveKit Cloud (or self-hosted) server.
 *
 * Token shape (per LiveKit spec):
 *   header  = { alg: "HS256", typ: "JWT" }
 *   payload = {
 *       iss,            // API key
 *       sub,            // identity (= user id)
 *       name,           // display name
 *       nbf, iat, exp,  // standard time claims
 *       video: {
 *           room,                 // room name
 *           roomJoin: true,
 *           canPublish: true,
 *           canSubscribe: true,
 *           canPublishData: true,
 *       }
 *   }
 *   signature = HMAC-SHA256(headerB64 + "." + payloadB64, apiSecret)
 *
 * No external library required — pure HMAC + base64url.
 */
class LiveKitTokenService
{
    public function generateAccessToken(
        string $apiKey,
        string $apiSecret,
        string $roomName,
        string $identity,
        ?string $displayName = null,
        int $ttlSeconds = 3600
    ): string {
        $now = time();
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $payload = [
            'iss'   => $apiKey,
            'sub'   => $identity,
            'iat'   => $now,
            'nbf'   => $now,
            'exp'   => $now + $ttlSeconds,
            'name'  => $displayName ?: $identity,
            'video' => [
                'room'           => $roomName,
                'roomJoin'       => true,
                'canPublish'     => true,
                'canSubscribe'   => true,
                'canPublishData' => true,
            ],
        ];

        $headerB64  = $this->base64urlEncode(json_encode($header,  JSON_UNESCAPED_SLASHES));
        $payloadB64 = $this->base64urlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES));

        $signingInput = $headerB64 . '.' . $payloadB64;
        $signature    = hash_hmac('sha256', $signingInput, $apiSecret, true);
        $signatureB64 = $this->base64urlEncode($signature);

        return $signingInput . '.' . $signatureB64;
    }

    private function base64urlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
