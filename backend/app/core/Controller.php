<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\ApiException;
use App\Helpers\ResponseHelper;

class Controller
{
    protected function ok(mixed $data = null, string $message = 'Thành công', array $meta = []): void
    {
        ResponseHelper::success($message, $data, $meta);
    }

    protected function created(mixed $data = null, string $message = 'Tạo dữ liệu thành công'): void
    {
        ResponseHelper::success($message, $data, [], 201);
    }

    protected function validatePayload(array $payload, array $rules, string $message): void
    {
        if ($payload === []) {
            return;
        }

        $errors = Validator::validate($payload, $rules);
        if ($errors !== []) {
            throw new ApiException($message, 422, $errors);
        }
    }

    protected function routeId(array $params, string $key = 'id'): int
    {
        $id = (int) ($params[$key] ?? 0);
        if ($id <= 0) {
            throw new ApiException('ID tuyến không hợp lệ.', 422, [
                $key => ['Vui lòng cung cấp ID hợp lệ.'],
            ]);
        }

        return $id;
    }

    protected function authUser(Request $request): array
    {
        return (array) ($request->attribute('auth_user') ?? []);
    }

    protected function authUserId(Request $request): int
    {
        return (int) ($this->authUser($request)['id'] ?? 0);
    }
}
