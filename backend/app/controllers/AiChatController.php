<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Request;
use App\Services\AiChatService;

class AiChatController extends Controller
{
    private AiChatService $service;
    public function __construct() { $this->service = new AiChatService(); }

    public function chat(Request $request, array $params): void
    {
        $message = trim((string) ($request->input('message') ?? ''));
        if ($message === '') {
            throw new ApiException('Vui lòng nhập tin nhắn.', 422);
        }
        $result = $this->service->chat($message);
        $this->ok($result);
    }
}
