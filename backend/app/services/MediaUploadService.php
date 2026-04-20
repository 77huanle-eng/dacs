<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\ApiException;

class MediaUploadService
{
    /**
     * @param array<string, mixed> $file
     */
    public function uploadImage(array $file, string $folder = 'common', int $maxSizeMb = 8): string
    {
        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error !== UPLOAD_ERR_OK) {
            throw new ApiException('Upload ảnh thất bại. Vui lòng thử lại.', 422);
        }

        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            throw new ApiException('File tải lên không hợp lệ.', 422);
        }

        $maxBytes = max(1, $maxSizeMb) * 1024 * 1024;
        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > $maxBytes) {
            throw new ApiException(sprintf('Kích thước ảnh tối đa %dMB.', $maxSizeMb), 422);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = strtolower((string) $finfo->file($tmp));
        $allowed = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (!isset($allowed[$mime])) {
            throw new ApiException('Định dạng ảnh chưa hỗ trợ. Chỉ chấp nhận JPG/PNG/WEBP.', 422);
        }

        $folder = trim($folder, " \t\n\r\0\x0B\\/");
        $safeFolder = preg_replace('/[^a-z0-9_-]/i', '', $folder) ?: 'common';
        $root = dirname(__DIR__, 2);
        $targetDir = $root . '/public/uploads/' . $safeFolder;
        if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
            throw new ApiException('Không thể tạo thư mục lưu ảnh.', 500);
        }

        $ext = $allowed[$mime];
        $filename = $safeFolder . '-' . date('YmdHis') . '-' . bin2hex(random_bytes(5)) . '.' . $ext;
        $targetFile = $targetDir . '/' . $filename;
        if (!move_uploaded_file($tmp, $targetFile)) {
            throw new ApiException('Không thể lưu file ảnh lên máy chủ.', 500);
        }

        $scriptName = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? ''));
        $publicBase = rtrim(str_replace('/index.php', '', $scriptName), '/');
        if ($publicBase === '') {
            $publicBase = '/backend/public';
        }

        return $publicBase . '/uploads/' . $safeFolder . '/' . $filename;
    }
}
