<?php

declare(strict_types=1);

namespace App\Helpers;

use App\Core\ApiException;

final class AuthorizationHelper
{
    public static function requireAuth(?array $user): array
    {
        if (!$user) {
            throw new ApiException('Bạn chưa đăng nhập.', 401);
        }

        return $user;
    }

    public static function requireRole(array $user, string $role): void
    {
        self::requireAnyRole($user, [$role]);
    }

    public static function requireAnyRole(array $user, array $roles): void
    {
        $allowedRoles = array_values(array_filter(array_map([self::class, 'normalizeRole'], $roles)));
        if ($allowedRoles === []) {
            return;
        }

        $currentRole = self::normalizeRole((string) ($user['role_name'] ?? $user['role'] ?? ''));
        if ($currentRole === '' || !in_array($currentRole, $allowedRoles, true)) {
            throw new ApiException('Bạn không có quyền truy cập tài nguyên này.', 403);
        }
    }

    public static function normalizeRole(string $role): string
    {
        $value = strtolower(trim($role));

        if (str_contains($value, 'admin')) {
            return 'admin';
        }

        if (str_contains($value, 'provider') || str_contains($value, 'supplier') || str_contains($value, 'ncc')) {
            return 'provider';
        }

        if (str_contains($value, 'user') || str_contains($value, 'customer') || str_contains($value, 'khach')) {
            return 'user';
        }

        return $value;
    }
}
