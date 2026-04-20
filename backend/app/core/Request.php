<?php

declare(strict_types=1);

namespace App\Core;

final class Request
{
    private string $method;
    private string $uri;
    private array $query;
    private array $body;
    private array $files;
    private array $headers;
    private array $attributes = [];

    public function __construct(
        string $method,
        string $uri,
        array $query,
        array $body,
        array $files,
        array $headers
    ) {
        $this->method = $method;
        $this->uri = $uri;
        $this->query = $query;
        $this->body = $body;
        $this->files = $files;
        $this->headers = $headers;
    }

    public static function capture(): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
        $uri = self::normalizeCapturedUri(
            $requestUri,
            (string) ($_SERVER['SCRIPT_NAME'] ?? ''),
            (string) ($_SERVER['PATH_INFO'] ?? '')
        );

        $query = $_GET ?? [];

        $raw = file_get_contents('php://input') ?: '';
        $json = json_decode($raw, true);

        $body = [];
        if (is_array($json)) {
            $body = $json;
        } elseif (!empty($_POST)) {
            $body = $_POST;
        }

        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (!str_starts_with($key, 'HTTP_')) {
                continue;
            }

            $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
            $headers[$headerName] = $value;
        }

        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['Content-Type'] = $_SERVER['CONTENT_TYPE'];
        }

        if (!isset($headers['Authorization'])) {
            if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
                $headers['Authorization'] = (string) $_SERVER['HTTP_AUTHORIZATION'];
            } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                $headers['Authorization'] = (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            }
        }

        if (!isset($headers['Authorization']) && function_exists('getallheaders')) {
            $nativeHeaders = getallheaders();
            if (is_array($nativeHeaders)) {
                foreach ($nativeHeaders as $name => $value) {
                    if (strtolower((string) $name) === 'authorization') {
                        $headers['Authorization'] = (string) $value;
                        break;
                    }
                }
            }
        }

        return new self($method, $uri, $query, $body, $_FILES ?? [], $headers);
    }

    private static function normalizeCapturedUri(string $requestUri, string $scriptName, string $pathInfo): string
    {
        $path = parse_url($requestUri, PHP_URL_PATH) ?: '/';

        if ($pathInfo !== '') {
            $path = $pathInfo;
        } else {
            $normalizedScript = str_replace('\\', '/', $scriptName);
            $scriptDir = rtrim(str_replace('\\', '/', dirname($normalizedScript)), '/');

            if ($normalizedScript !== '' && $normalizedScript !== '/' && str_starts_with($path, $normalizedScript)) {
                $path = substr($path, strlen($normalizedScript));
            } elseif ($scriptDir !== '' && $scriptDir !== '/' && str_starts_with($path, $scriptDir)) {
                $path = substr($path, strlen($scriptDir));
            }
        }

        $path = '/' . ltrim($path, '/');
        if ($path === '//') {
            $path = '/';
        }

        $query = parse_url($requestUri, PHP_URL_QUERY);
        return $query ? $path . '?' . $query : $path;
    }

    public function method(): string
    {
        return $this->method;
    }

    public function uri(): string
    {
        return $this->uri;
    }

    public function path(): string
    {
        return parse_url($this->uri, PHP_URL_PATH) ?: '/';
    }

    public function query(string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $this->query;
        }

        return $this->query[$key] ?? $default;
    }

    public function input(string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $this->body;
        }

        return $this->body[$key] ?? $default;
    }

    public function files(string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $this->files;
        }

        return $this->files[$key] ?? $default;
    }

    public function file(string $key): ?array
    {
        $file = $this->files($key);
        return is_array($file) ? $file : null;
    }

    public function header(string $key, mixed $default = null): mixed
    {
        $lookup = strtolower($key);
        foreach ($this->headers as $name => $value) {
            if (strtolower($name) === $lookup) {
                return $value;
            }
        }

        return $default;
    }

    public function bearerToken(): ?string
    {
        $header = $this->header('Authorization');

        if (!$header && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $header = (string) $_SERVER['HTTP_AUTHORIZATION'];
        }

        if (!$header && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $header = (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if (!$header && function_exists('getallheaders')) {
            $nativeHeaders = getallheaders();
            if (is_array($nativeHeaders)) {
                foreach ($nativeHeaders as $name => $value) {
                    if (strtolower((string) $name) === 'authorization') {
                        $header = (string) $value;
                        break;
                    }
                }
            }
        }

        if (!$header || !preg_match('/^Bearer\s+(.*)$/i', $header, $matches)) {
            return null;
        }

        return trim($matches[1]);
    }

    public function setAttribute(string $key, mixed $value): void
    {
        $this->attributes[$key] = $value;
    }

    public function attribute(string $key, mixed $default = null): mixed
    {
        return $this->attributes[$key] ?? $default;
    }
}
