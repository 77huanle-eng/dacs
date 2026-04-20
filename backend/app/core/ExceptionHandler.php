<?php

declare(strict_types=1);

namespace App\Core;

use Throwable;

final class ExceptionHandler
{
    public static function handle(Throwable $exception): void
    {
        $debug = (bool) Config::get('app.debug', false);

        if ($exception instanceof ApiException) {
            Response::json([
                'success' => false,
                'message' => $exception->getMessage(),
                'errors' => $exception->errors(),
            ], $exception->statusCode());
            return;
        }

        if ($debug) {
            Response::json([
                'success' => false,
                'message' => $exception->getMessage(),
                'errors' => [
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                    'trace' => explode("\n", $exception->getTraceAsString()),
                ],
            ], 500);
            return;
        }

        Response::json([
            'success' => false,
            'message' => 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
        ], 500);
    }
}
