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
}
