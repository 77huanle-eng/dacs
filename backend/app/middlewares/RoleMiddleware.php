<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\MiddlewareInterface;
use App\Core\Request;
use App\Helpers\AuthorizationHelper;

class RoleMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next, array $params = []): mixed
    {
        $user = AuthorizationHelper::requireAuth($request->attribute('auth_user'));

        if ($params !== []) {
            AuthorizationHelper::requireAnyRole($user, $params);
        }

        return $next($request);
    }
}
