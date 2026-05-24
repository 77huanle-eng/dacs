<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\Controller;
use App\Core\Request;
use App\Models\AuditLog;

class AuditLogController extends Controller
{
    private AuditLog $logs;
    public function __construct() { $this->logs = new AuditLog(); }

    public function index(Request $request, array $params): void
    {
        $page = max(1, (int) ($request->query('page') ?? 1));
        $limit = min(50, max(1, (int) ($request->query('limit') ?? 20)));
        $userId = $request->query('user_id');
        $sql = 'SELECT * FROM audit_logs';
        $binds = [];
        if ($userId) { $sql .= ' WHERE user_id = :uid'; $binds['uid'] = (int) $userId; }
        $sql .= ' ORDER BY created_at DESC';
        $this->ok($this->logs->paginate($sql, $binds, $page, $limit));
    }
}
