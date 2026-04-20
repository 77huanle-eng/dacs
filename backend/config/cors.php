<?php

declare(strict_types=1);

return [
    'allowed_origins' => array_filter(array_map('trim', explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost,http://127.0.0.1,http://localhost:5500,http://localhost:8080'))),
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    'exposed_headers' => ['Authorization'],
    'max_age' => 86400,
    'allow_credentials' => true,
];
