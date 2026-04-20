<?php

declare(strict_types=1);

namespace App\Helpers;

use App\Core\ApiException;
use App\Core\Config;

final class JwtHelper
{
    public static function createAccessToken(array $claims): string
    {
        $now = time();
        $ttl = (int) Config::get('app.jwt.access_ttl', 900);

        $payload = array_merge([
            'iss' => Config::get('app.jwt.issuer'),
            'aud' => Config::get('app.jwt.audience'),
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $ttl,
        ], $claims);

        return self::encode($payload);
    }

    public static function encode(array $payload): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];

        $headerEncoded = self::base64UrlEncode((string) json_encode($header));
        $payloadEncoded = self::base64UrlEncode((string) json_encode($payload));

        $signature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, self::secret(), true);
        $signatureEncoded = self::base64UrlEncode($signature);

        return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
    }

    public static function decode(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new ApiException('Access token không hợp lệ.', 401);
        }

        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;
        $signatureCheck = self::base64UrlEncode(hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, self::secret(), true));

        if (!hash_equals($signatureCheck, $signatureEncoded)) {
            throw new ApiException('Chữ ký token không hợp lệ.', 401);
        }

        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);

        if (!is_array($payload)) {
            throw new ApiException('Payload token không hợp lệ.', 401);
        }

        $now = time();
        if (($payload['nbf'] ?? $now) > $now) {
            throw new ApiException('Token chưa đến thời điểm sử dụng.', 401);
        }

        if (($payload['exp'] ?? 0) < $now) {
            throw new ApiException('Token đã hết hạn.', 401);
        }

        $issuer = Config::get('app.jwt.issuer');
        $audience = Config::get('app.jwt.audience');
        if (($payload['iss'] ?? '') !== $issuer || ($payload['aud'] ?? '') !== $audience) {
            throw new ApiException('Thông tin phát hành token không hợp lệ.', 401);
        }

        return $payload;
    }

    public static function refreshExpiresAt(): string
    {
        $ttl = (int) Config::get('app.jwt.refresh_ttl', 2592000);
        return date('Y-m-d H:i:s', time() + $ttl);
    }

    public static function createRefreshToken(): string
    {
        return StrHelper::randomString(96);
    }

    private static function secret(): string
    {
        return (string) Config::get('app.jwt.secret');
    }

    private static function base64UrlEncode(string $input): string
    {
        return rtrim(strtr(base64_encode($input), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $input): string
    {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $input .= str_repeat('=', 4 - $remainder);
        }

        return (string) base64_decode(strtr($input, '-_', '+/'));
    }
}
