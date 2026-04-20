<?php

declare(strict_types=1);

namespace App\Helpers;

use App\Core\Response;

final class ResponseHelper
{
    public static function success(
        string $message = 'Thành công',
        mixed $data = null,
        array $meta = [],
        int $statusCode = 200
    ): void {
        $payload = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        if ($meta !== []) {
            $payload['meta'] = $meta;
        }

        Response::json($payload, $statusCode);
    }

    public static function error(
        string $message = 'Có lỗi xảy ra',
        array $errors = [],
        int $statusCode = 400
    ): void {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== []) {
            $payload['errors'] = $errors;
        }

        Response::json($payload, $statusCode);
    }
}
