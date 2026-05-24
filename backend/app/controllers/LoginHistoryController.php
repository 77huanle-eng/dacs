<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\Controller;
use App\Core\Request;
use App\Models\LoginHistory;

class LoginHistoryController extends Controller
{
    private LoginHistory $history;
    public function __construct() { $this->history = new LoginHistory(); }

    public function myHistory(Request $request, array $params): void
    {
        $userId = $this->authUserId($request);
        $page = max(1, (int) ($request->query('page') ?? 1));
        $limit = min(50, max(1, (int) ($request->query('limit') ?? 20)));
        $this->ok($this->history->paginate(
            'SELECT * FROM login_histories WHERE user_id = :uid ORDER BY created_at DESC',
            ['uid' => $userId], $page, $limit
        ));
    }

    public function adminList(Request $request, array $params): void
    {
        $page = max(1, (int) ($request->query('page') ?? 1));
        $limit = min(50, max(1, (int) ($request->query('limit') ?? 20)));
        $userId = $request->query('user_id');
        $sql = 'SELECT h.*, u.full_name, u.email FROM login_histories h LEFT JOIN users u ON h.user_id=u.id';
        $binds = [];
        if ($userId) { $sql .= ' WHERE h.user_id = :uid'; $binds['uid'] = (int) $userId; }
        $sql .= ' ORDER BY h.created_at DESC';
        $this->ok($this->history->paginate($sql, $binds, $page, $limit));
    }
}
