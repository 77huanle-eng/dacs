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

    /**
     * @param array<string, mixed>|null $file
     */
    protected function validateUploadedImage(?array $file, string $fieldLabel = 'Ảnh', int $maxSizeMb = 8): void
    {
        if (!$file) {
            throw new ApiException("Vui lòng chọn {$fieldLabel} để tải lên.", 422);
        }

        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error !== UPLOAD_ERR_OK) {
            throw new ApiException("Tải {$fieldLabel} lên thất bại. Vui lòng thử lại.", 422);
        }

        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > ($maxSizeMb * 1024 * 1024)) {
            throw new ApiException(sprintf('%s tối đa %dMB.', $fieldLabel, $maxSizeMb), 422);
        }

        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            throw new ApiException("File {$fieldLabel} không hợp lệ.", 422);
        }

        $mime = strtolower((string) (new \finfo(FILEINFO_MIME_TYPE))->file($tmp));
        $allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($mime, $allowed, true)) {
            throw new ApiException("{$fieldLabel} chỉ hỗ trợ JPG/PNG/WEBP.", 422);
        }
    }
}
