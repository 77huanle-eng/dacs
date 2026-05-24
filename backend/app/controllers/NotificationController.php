<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Database;
use App\Core\Request;
use App\Models\Notification;

class NotificationController extends Controller
{
    private Notification $notifications;

    public function __construct()
    {
        $this->notifications = new Notification();
    }

    public function index(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $page = max(1, (int) ($request->query('page') ?? 1));
        $limit = max(1, min(100, (int) ($request->query('limit') ?? 20)));

        $sql = 'SELECT id, user_id, title, content, type, is_read, created_at, updated_at
                FROM notifications
                WHERE user_id = :user_id
                ORDER BY is_read ASC, id DESC';

        $result = $this->notifications->paginate($sql, ['user_id' => (int) $user['id']], $page, $limit);
        $this->ok($result['items'], 'Lấy danh sách thông báo thành công.', $result['meta']);
    }

    public function read(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $id = $this->routeId($params);

        $notification = $this->notifications->find($id);
        if (!$notification || (int) ($notification['user_id'] ?? 0) !== (int) $user['id']) {
            throw new ApiException('Không tìm thấy thông báo.', 404);
        }

        $this->notifications->updateById($id, [
            'is_read' => 1,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $this->ok($this->notifications->find($id), 'Đã đánh dấu thông báo là đã đọc.');
    }

    public function readAll(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $sql = 'UPDATE notifications
                SET is_read = 1, updated_at = NOW()
                WHERE user_id = :user_id AND is_read = 0';

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute(['user_id' => (int) $user['id']]);

        $this->ok([
            'updated' => $stmt->rowCount(),
        ], 'Đã đánh dấu tất cả thông báo là đã đọc.');
    }

    public function unreadCount(Request $request, array $params): void
    {
        $user = $this->authUser($request);
        $stmt = Database::connection()->prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = :uid AND is_read = 0');
        $stmt->execute(['uid' => (int) $user['id']]);
        $this->ok($stmt->fetch());
    }

    public function broadcast(Request $request, array $params): void
    {
        $payload = $request->input();
        $title   = trim((string) ($payload['title'] ?? ''));
        $content = trim((string) ($payload['content'] ?? ''));
        $type    = (string) ($payload['type'] ?? 'admin_broadcast');
        $userIds = $payload['user_ids'] ?? null;

        if ($title === '' || $content === '') {
            throw new ApiException('title và content là bắt buộc.', 422);
        }

        $db  = Database::connection();
        $now = date('Y-m-d H:i:s');

        if ($userIds === null) {
            $stmt = $db->prepare('SELECT id FROM users WHERE status = "active"');
            $stmt->execute();
            $userIds = array_column($stmt->fetchAll(), 'id');
        }

        $insert = $db->prepare('INSERT INTO notifications (user_id, type, title, content, is_read, created_at) VALUES (:uid, :type, :title, :content, 0, :now)');
        $count = 0;
        foreach ($userIds as $uid) {
            $insert->execute(['uid' => (int) $uid, 'type' => $type, 'title' => $title, 'content' => $content, 'now' => $now]);
            $count++;
        }

        $this->ok(['sent_count' => $count], "Đã gửi thông báo cho {$count} người dùng.");
    }
}
