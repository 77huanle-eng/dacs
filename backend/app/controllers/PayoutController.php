<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Database;
use App\Core\Request;
use App\Models\Payout;
use PDO;

class PayoutController extends Controller
{
    private PDO $db;
    private Payout $payouts;

    public function __construct()
    {
        $this->db = Database::connection();
        $this->payouts = new Payout();
    }

    public function myPayouts(Request $request, array $params): void
    {
        $user = $this->authUser($request);
        $provider = (new \App\Models\Provider())->firstBy(['user_id' => (int) $user['id']]);
        if (!$provider) throw new ApiException('Bạn chưa là provider.', 403);
        $page = max(1, (int) ($request->query('page') ?? 1));
        $limit = min(50, max(1, (int) ($request->query('limit') ?? 15)));
        $result = $this->payouts->paginate(
            'SELECT * FROM payouts WHERE provider_id = :pid ORDER BY created_at DESC',
            ['pid' => (int) $provider['id']], $page, $limit
        );
        $this->ok($result);
    }

    public function pendingRevenue(Request $request, array $params): void
    {
        $user = $this->authUser($request);
        $provider = (new \App\Models\Provider())->firstBy(['user_id' => (int) $user['id']]);
        if (!$provider) throw new ApiException('Bạn chưa là provider.', 403);
        $stmt = $this->db->prepare('SELECT COALESCE(SUM(b.total_amount),0) AS pending FROM bookings b JOIN tours t ON b.tour_id=t.id WHERE t.provider_id=:pid AND b.payment_status="paid"');
        $stmt->execute(['pid' => (int) $provider['id']]);
        $this->ok($stmt->fetch());
    }

    public function adminList(Request $request, array $params): void
    {
        $page = max(1, (int) ($request->query('page') ?? 1));
        $limit = min(50, max(1, (int) ($request->query('limit') ?? 15)));
        $status = $request->query('status');
        $sql = 'SELECT p.*, pr.company_name AS provider_name FROM payouts p LEFT JOIN providers pr ON p.provider_id=pr.id';
        $binds = [];
        if ($status) { $sql .= ' WHERE p.status = :status'; $binds['status'] = $status; }
        $sql .= ' ORDER BY p.created_at DESC';
        $this->ok($this->payouts->paginate($sql, $binds, $page, $limit));
    }

    public function adminCreate(Request $request, array $params): void
    {
        $data = $request->input();
        $this->validatePayload($data, ['provider_id' => 'required', 'amount' => 'required'], 'Dữ liệu payout không hợp lệ.');
        $now = date('Y-m-d H:i:s');
        $id = $this->payouts->create([
            'provider_id' => (int) $data['provider_id'], 'amount' => (float) $data['amount'],
            'status' => 'pending', 'notes' => $data['notes'] ?? null,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $this->created($this->payouts->find($id));
    }

    public function adminComplete(Request $request, array $params): void
    {
        $id = $this->routeId($params);
        $this->payouts->updateById($id, ['status' => 'completed', 'paid_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')]);
        $this->ok($this->payouts->find($id), 'Đã hoàn tất payout.');
    }

    public function adminReject(Request $request, array $params): void
    {
        $id = $this->routeId($params);
        $reason = trim((string) ($request->input('reason') ?? ''));
        $this->payouts->updateById($id, ['status' => 'rejected', 'notes' => $reason, 'updated_at' => date('Y-m-d H:i:s')]);
        $this->ok($this->payouts->find($id), 'Đã từ chối payout.');
    }
}
