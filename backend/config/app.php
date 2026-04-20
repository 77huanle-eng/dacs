<?php

declare(strict_types=1);

return [
    'name' => 'Viet Horizon Travel API',
    'env' => getenv('APP_ENV') ?: 'local',
    'debug' => filter_var(getenv('APP_DEBUG') ?: 'false', FILTER_VALIDATE_BOOL),
    'timezone' => getenv('APP_TIMEZONE') ?: 'Asia/Ho_Chi_Minh',
    'base_url' => getenv('APP_URL') ?: 'http://localhost:8080',
    'api_prefix' => '/api',
    'frontend_url' => getenv('FRONTEND_URL') ?: 'http://localhost',
    'mail' => [
        'transport' => getenv('MAIL_TRANSPORT') ?: 'mail',
        'from_address' => getenv('MAIL_FROM_ADDRESS') ?: 'no-reply@viethorizon.vn',
        'from_name' => getenv('MAIL_FROM_NAME') ?: 'Viet Horizon Travel',
        'smtp_host' => getenv('MAIL_SMTP_HOST') ?: '',
        'smtp_port' => (int) (getenv('MAIL_SMTP_PORT') ?: 25),
        'smtp_user' => getenv('MAIL_SMTP_USER') ?: '',
        'smtp_pass' => getenv('MAIL_SMTP_PASS') ?: '',
        'smtp_secure' => getenv('MAIL_SMTP_SECURE') ?: '',
        'log_preview' => filter_var(getenv('MAIL_LOG_PREVIEW') ?: 'true', FILTER_VALIDATE_BOOL),
    ],
    'jwt' => [
        'secret' => getenv('JWT_SECRET') ?: 'change-me-in-production-viet-horizon',
        'issuer' => getenv('JWT_ISSUER') ?: 'viet-horizon.travel',
        'audience' => getenv('JWT_AUDIENCE') ?: 'viet-horizon.clients',
        'access_ttl' => (int) (getenv('JWT_ACCESS_TTL') ?: 900),
        'refresh_ttl' => (int) (getenv('JWT_REFRESH_TTL') ?: 2592000),
    ],
    'pagination' => [
        'default_limit' => 12,
        'max_limit' => 100,
    ],
];
