<?php

declare(strict_types=1);

namespace App\Helpers;

final class StrHelper
{
    public static function slug(string $text): string
    {
        $text = mb_strtolower(trim($text));
        $text = preg_replace('/[^a-z0-9\s-]/u', '', iconv('UTF-8', 'ASCII//TRANSLIT', $text) ?: $text);
        $text = preg_replace('/\s+/', '-', $text ?? '');
        $text = preg_replace('/-+/', '-', $text ?? '');

        return trim((string) $text, '-');
    }

    public static function randomString(int $length = 64): string
    {
        return bin2hex(random_bytes((int) ceil($length / 2)));
    }

    public static function bookingCode(): string
    {
        return 'BK' . date('YmdHis') . random_int(100, 999);
    }

    public static function invoiceCode(): string
    {
        return 'INV' . date('YmdHis') . random_int(100, 999);
    }
}
