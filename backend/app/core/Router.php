<?php

declare(strict_types=1);

namespace App\Core;

use App\Helpers\ResponseHelper;

final class Router
{
    private array $routes = [];
    private string $prefix = '';

    /** @var array<string, class-string<MiddlewareInterface>> */
    private array $middlewareAliases = [];

    public function setPrefix(string $prefix): void
    {
        $this->prefix = rtrim($prefix, '/');
    }

    public function setMiddlewareAliases(array $aliases): void
    {
        $this->middlewareAliases = $aliases;
    }

    public function get(string $pattern, callable|array $handler, array $middlewares = []): void
    {
        $this->add('GET', $pattern, $handler, $middlewares);
    }

    public function post(string $pattern, callable|array $handler, array $middlewares = []): void
    {
        $this->add('POST', $pattern, $handler, $middlewares);
    }

    public function put(string $pattern, callable|array $handler, array $middlewares = []): void
    {
        $this->add('PUT', $pattern, $handler, $middlewares);
    }

    public function patch(string $pattern, callable|array $handler, array $middlewares = []): void
    {
        $this->add('PATCH', $pattern, $handler, $middlewares);
    }

    public function delete(string $pattern, callable|array $handler, array $middlewares = []): void
    {
        $this->add('DELETE', $pattern, $handler, $middlewares);
    }

    public function add(string $method, string $pattern, callable|array $handler, array $middlewares = []): void
    {
        $normalized = '/' . ltrim($pattern, '/');
        $fullPattern = $this->prefix . $normalized;

        $regex = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $fullPattern);
        $regex = '#^' . rtrim($regex, '/') . '/?$#';

        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $fullPattern,
            'regex' => $regex,
            'handler' => $handler,
            'middlewares' => $middlewares,
        ];
    }

    public function dispatch(Request $request): void
    {
        $path = rtrim($request->path(), '/') ?: '/';
        $method = $request->method();

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (!preg_match($route['regex'], $path, $matches)) {
                continue;
            }

            $params = [];
            foreach ($matches as $key => $value) {
                if (is_string($key)) {
                    $params[$key] = $value;
                }
            }

            $handler = $this->resolveHandler($route['handler']);
            $pipeline = $this->buildMiddlewarePipeline($route['middlewares'], $handler, $params);
            $pipeline($request);
            return;
        }

        ResponseHelper::error('Không tìm thấy endpoint.', [], 404);
    }

    private function resolveHandler(callable|array $handler): callable
    {
        if (is_callable($handler)) {
            return $handler;
        }

        [$class, $method] = $handler;
        $controller = new $class();

        return [$controller, $method];
    }

    private function buildMiddlewarePipeline(array $middlewares, callable $handler, array $params): callable
    {
        $next = function (Request $request) use ($handler, $params) {
            $result = $handler($request, $params);
            if (is_array($result)) {
                Response::json($result);
            }
        };

        foreach (array_reverse($middlewares) as $middlewareRaw) {
            [$middlewareClass, $middlewareParams] = $this->resolveMiddleware($middlewareRaw);
            $instance = new $middlewareClass();

            $currentNext = $next;
            $next = function (Request $request) use ($instance, $currentNext, $middlewareParams) {
                return $instance->handle($request, $currentNext, $middlewareParams);
            };
        }

        return $next;
    }

    private function resolveMiddleware(string $raw): array
    {
        $name = $raw;
        $params = [];

        if (str_contains($raw, ':')) {
            [$name, $paramString] = explode(':', $raw, 2);
            $params = array_filter(array_map('trim', explode(',', $paramString)));
        }

        if (!isset($this->middlewareAliases[$name])) {
            throw new ApiException("Middleware {$name} chưa được đăng ký.", 500);
        }

        return [$this->middlewareAliases[$name], $params];
    }
}
