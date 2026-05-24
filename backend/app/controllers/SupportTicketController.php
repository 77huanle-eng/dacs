<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Request;
use App\Models\SupportTicket;
use App\Models\TicketMessage;

class SupportTicketController extends Controller
{
    private SupportTicket $tickets;
    private TicketMessage $messages;

    public function __construct()
    {
        $this->tickets = new SupportTicket();
        $this->messages = new TicketMessage();
    }

    public function myTickets(Request $request, array $params): void
    {
        $userId = $this->authUserId($request);
        $page = max(1, (int) ($request->query('page') ?? 1));
        $limit = min(50, max(1, (int) ($request->query('limit') ?? 15)));
        $this->ok($this->tickets->paginate(
            'SELECT * FROM support_tickets WHERE user_id = :uid ORDER BY created_at DESC',
            ['uid' => $userId], $page, $limit
        ));
    }

    public function create(Request $request, array $params): void
    {
        $userId = $this->authUserId($request);
        $data = $request->input();
        $this->validatePayload($data, ['subject' => 'required', 'message' => 'required'], 'Vui lòng nhập đầy đủ tiêu đề và nội dung.');
        $now = date('Y-m-d H:i:s');
        $ticketId = $this->tickets->create([
            'user_id' => $userId, 'subject' => $data['subject'],
            'status' => 'open', 'created_at' => $now, 'updated_at' => $now,
        ]);
        $this->messages->create([
            'ticket_id' => $ticketId, 'sender_id' => $userId,
            'sender_type' => 'user', 'message' => $data['message'], 'created_at' => $now,
        ]);
        $this->created($this->tickets->find($ticketId));
    }

    public function detail(Request $request, array $params): void
    {
        $userId = $this->authUserId($request);
        $id = $this->routeId($params);
        $ticket = $this->tickets->find($id);
        if (!$ticket || (int) $ticket['user_id'] !== $userId) {
            throw new ApiException('Không tìm thấy ticket.', 404);
        }
        $ticket['messages'] = $this->messages->all(['ticket_id' => $id], 'created_at ASC');
        $this->ok($ticket);
    }

    public function reply(Request $request, array $params): void
    {
        $userId = $this->authUserId($request);
        $id = $this->routeId($params);
        $ticket = $this->tickets->find($id);
        if (!$ticket || (int) $ticket['user_id'] !== $userId) {
            throw new ApiException('Không tìm thấy ticket.', 404);
        }
        $data = $request->input();
        $this->validatePayload($data, ['message' => 'required'], 'Vui lòng nhập nội dung phản hồi.');
        $this->messages->create([
            'ticket_id' => $id, 'sender_id' => $userId,
            'sender_type' => 'user', 'message' => $data['message'],
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        $this->tickets->updateById($id, ['status' => 'open', 'updated_at' => date('Y-m-d H:i:s')]);
        $this->ok(null, 'Đã gửi phản hồi.');
    }

    public function adminList(Request $request, array $params): void
    {
        $page = max(1, (int) ($request->query('page') ?? 1));
        $limit = min(50, max(1, (int) ($request->query('limit') ?? 20)));
        $status = $request->query('status');
        $sql = 'SELECT t.*, u.full_name AS user_name FROM support_tickets t LEFT JOIN users u ON t.user_id=u.id';
        $binds = [];
        if ($status) { $sql .= ' WHERE t.status = :s'; $binds['s'] = $status; }
        $sql .= ' ORDER BY t.created_at DESC';
        $this->ok($this->tickets->paginate($sql, $binds, $page, $limit));
    }

    public function updateStatus(Request $request, array $params): void
    {
        $id = $this->routeId($params);
        $status = (string) ($request->input('status') ?? '');
        if (!in_array($status, ['open', 'in_progress', 'resolved', 'closed'], true)) {
            throw new ApiException('Status không hợp lệ.', 422);
        }
        $this->tickets->updateById($id, ['status' => $status, 'updated_at' => date('Y-m-d H:i:s')]);
        $this->ok($this->tickets->find($id));
    }
}
