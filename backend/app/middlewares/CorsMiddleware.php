<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Config;

final class CorsMiddleware
{
    private static function isLocalDevOrigin(string $origin): bool
    {
        if ($origin === '') {
            return false;
        }

        return (bool) preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#i', $origin);
    }

    public static function handle(): void
    {
        $config = Config::get('cors', []);
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        $allowOrigins = $config['allowed_origins'] ?? ['*'];

        $allowOriginHeader = '*';
        if ($allowOrigins !== ['*']) {
            if (in_array($origin, $allowOrigins, true) || self::isLocalDevOrigin((string) $origin)) {
                $allowOriginHeader = $origin;
            } else {
                $allowOriginHeader = $allowOrigins[0] ?? '*';
            }
        }

        header('Access-Control-Allow-Origin: ' . $allowOriginHeader);
        header('Access-Control-Allow-Methods: ' . implode(', ', $config['allowed_methods'] ?? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']));
        header('Access-Control-Allow-Headers: ' . implode(', ', $config['allowed_headers'] ?? ['Content-Type', 'Authorization']));
        header('Access-Control-Expose-Headers: ' . implode(', ', $config['exposed_headers'] ?? []));
        header('Access-Control-Max-Age: ' . (string) ($config['max_age'] ?? 86400));

        if (!empty($config['allow_credentials'])) {
            header('Access-Control-Allow-Credentials: true');
        }

        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
