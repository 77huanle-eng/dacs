<?php

declare(strict_types=1);

namespace App\Core;

use App\Middlewares\AuthMiddleware;
use App\Middlewares\RoleMiddleware;

final class App
{
    private Router $router;

    public function __construct(Router $router)
    {
        $this->router = $router;
    }

    public function bootstrap(string $basePath): void
    {
        Config::load($basePath . '/config');

        date_default_timezone_set((string) Config::get('app.timezone', 'Asia/Ho_Chi_Minh'));

        $this->router->setPrefix((string) Config::get('app.api_prefix', '/api'));
        $this->router->setMiddlewareAliases([
            'auth' => AuthMiddleware::class,
            'role' => RoleMiddleware::class,
        ]);

        $router = $this->router;
        require $basePath . '/routes/api.php';
    }

    public function run(Request $request): void
    {
        $this->router->dispatch($request);
    }
}
