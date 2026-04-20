<?php

declare(strict_types=1);

namespace App\Core;

use Exception;

class ApiException extends Exception
{
    private int $statusCode;
    private array $errors;

    public function __construct(
        string $message,
        int $statusCode = 400,
        array $errors = []
    ) {
        $this->statusCode = $statusCode;
        $this->errors = $errors;
        parent::__construct($message, $statusCode);
    }

    public function statusCode(): int
    {
        return $this->statusCode;
    }

    public function errors(): array
    {
        return $this->errors;
    }
}
