<?php

declare(strict_types=1);

use App\Core\App;
use App\Core\ExceptionHandler;
use App\Core\Request;
use App\Core\Router;
use App\Middlewares\CorsMiddleware;

$basePath = dirname(__DIR__);

spl_autoload_register(function (string $class) use ($basePath): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relativeClass = substr($class, strlen($prefix));
    $relativePath = str_replace('\\', DIRECTORY_SEPARATOR, $relativeClass) . '.php';

    $searchRoots = [
        $basePath . '/app',
    ];

    foreach ($searchRoots as $root) {
        $file = $root . DIRECTORY_SEPARATOR . $relativePath;
        if (is_file($file)) {
            require_once $file;
            return;
        }
    }
});

try {
    // Load config first (required for CORS)
    \App\Core\Config::load($basePath . '/config');
    date_default_timezone_set((string) \App\Core\Config::get('app.timezone', 'Asia/Ho_Chi_Minh'));

    CorsMiddleware::handle();

    $router = new Router();
    $app = new App($router);
    $app->bootstrap($basePath);
    $app->run(Request::capture());
} catch (Throwable $exception) {
    ExceptionHandler::handle($exception);
}
