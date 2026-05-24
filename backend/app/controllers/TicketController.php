<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Request;

class TicketController extends Controller
{
    private \App\Services\TicketService $service;
    public function __construct() { $this->service = new \App\Services\TicketService(); }

    public function verify(Request $request, array $params): void
    {
        $token = (string) ($request->query('token') ?? '');
        if ($token === '') {
            throw new ApiException('Thiếu token.', 422);
        }
        $ticket = $this->service->getTicketWithQr($token);
        $this->ok($ticket);
    }
}
