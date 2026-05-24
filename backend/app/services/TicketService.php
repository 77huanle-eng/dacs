<?php
declare(strict_types=1);
namespace App\Services;
use App\Core\ApiException;
use App\Core\Config;
use App\Models\Ticket;

class TicketService
{
    private Ticket $tickets;

    public function __construct()
    {
        $this->tickets = new Ticket();
    }

    public function getTicketWithQr(string $token): array
    {
        $ticket = $this->tickets->firstBy(['ticket_token' => $token]);
        if (!$ticket) {
            throw new ApiException('Vé không hợp lệ hoặc không tồn tại.', 404);
        }
        $ticket['qr_url'] = $this->buildQrUrl($token);
        return $this->enrichTicket($ticket);
    }

    public function buildQrUrl(string $token): string
    {
        $baseUrl = Config::get('app.frontend_url', getenv('FRONTEND_URL') ?: 'http://localhost/DACS2');
        $verifyUrl = urlencode("{$baseUrl}/pages/staff-checkin.html?token={$token}");
        return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={$verifyUrl}";
    }

    public function enrichTicket(array $ticket): array
    {
        $ticket['is_valid'] = ($ticket['status'] ?? '') === 'active';
        $ticket['is_checked_in'] = ($ticket['status'] ?? '') === 'checked_in';
        return $ticket;
    }
}
