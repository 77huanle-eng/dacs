<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\ApiException;
use App\Core\MiddlewareInterface;
use App\Core\Request;
use App\Helpers\AuthorizationHelper;
use App\Helpers\JwtHelper;
use App\Models\User;

class AuthMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next, array $params = []): mixed
    {
        $token = $request->bearerToken();
        if (!$token) {
            throw new ApiException('Bạn chưa đăng nhập.', 401);
        }

        $payload = JwtHelper::decode($token);
        $userId = (int) ($payload['sub'] ?? 0);

        if ($userId <= 0) {
            throw new ApiException('Token không hợp lệ.', 401);
        }

        $userModel = new User();
        $user = $userModel->findWithRole($userId);
        if (!$user || $user['status'] !== 'active') {
            throw new ApiException('Tài khoản không tồn tại hoặc đã bị khóa.', 401);
        }

        $issuedAt = (int) ($payload['iat'] ?? 0);
        $invalidBeforeRaw = (string) ($user['token_invalid_before'] ?? '');
        if ($issuedAt > 0 && $invalidBeforeRaw !== '') {
            $invalidBeforeTs = strtotime($invalidBeforeRaw) ?: 0;
            if ($invalidBeforeTs > 0 && $issuedAt <= $invalidBeforeTs) {
                throw new ApiException('Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.', 401);
            }
        }

        $user['role_name'] = AuthorizationHelper::normalizeRole((string) ($user['role_name'] ?? $user['role'] ?? ''));

        $request->setAttribute('auth_user', $user);
        $request->setAttribute('auth_payload', $payload);

        return $next($request);
    }
}
