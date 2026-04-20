<?php

declare(strict_types=1);

namespace App\Core;

use RuntimeException;

final class Config
{
    private static array $items = [];
    private static bool $envLoaded = false;

    public static function load(string $configPath): void
    {
        self::loadEnv(dirname(rtrim($configPath, DIRECTORY_SEPARATOR)));
        self::$items = [];

        $files = glob(rtrim($configPath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '*.php') ?: [];
        foreach ($files as $file) {
            $key = pathinfo($file, PATHINFO_FILENAME);
            $value = require $file;
            if (!is_array($value)) {
                throw new RuntimeException("Config file {$file} must return array.");
            }
            self::$items[$key] = $value;
        }
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $segments = explode('.', $key);
        $value = self::$items;

        foreach ($segments as $segment) {
            if (is_array($value) && array_key_exists($segment, $value)) {
                $value = $value[$segment];
                continue;
            }

            return $default;
        }

        return $value;
    }

    private static function loadEnv(string $basePath): void
    {
        if (self::$envLoaded) {
            return;
        }

        $defaultEnv = $basePath . DIRECTORY_SEPARATOR . '.env';
        $fallbackEnv = $basePath . DIRECTORY_SEPARATOR . '.env.example';
        $localOverride = $basePath . DIRECTORY_SEPARATOR . '.env.local';

        if (is_file($defaultEnv)) {
            self::parseEnvFile($defaultEnv);
        } elseif (is_file($fallbackEnv)) {
            self::parseEnvFile($fallbackEnv);
        }

        if (is_file($localOverride)) {
            self::parseEnvFile($localOverride);
        }

        self::$envLoaded = true;
    }

    private static function parseEnvFile(string $path): void
    {
        $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!is_array($lines)) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            $position = strpos($line, '=');
            if ($position === false) {
                continue;
            }

            $key = trim(substr($line, 0, $position));
            $rawValue = trim(substr($line, $position + 1));
            if ($key === '') {
                continue;
            }

            $value = self::normalizeEnvValue($rawValue);
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }

    private static function normalizeEnvValue(string $value): string
    {
        if ($value === '') {
            return '';
        }

        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        return str_replace(['\\n', '\\r'], ["\n", "\r"], $value);
    }
}
