<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;

class HealthController extends Controller
{
    public function index(Request $request, array $params): void
    {
        $this->ok([
            'status' => 'ok',
            'service' => 'Viet Horizon Travel API',
            'time' => date('c'),
            'php' => PHP_VERSION,
        ], 'API hoạt động bình thường.');
    }
}
