<?php
declare(strict_types=1);
namespace App\Services;
use App\Core\ApiException;
use App\Core\Database;
use App\Models\Refund;
use PDO;

class RefundService
{
    private PDO $db;
    private Refund $refunds;

    public function __construct()
    {
        $this->db = Database::connection();
        $this->refunds = new Refund();
    }

    public function request(int $bookingId, int $userId, string $reason): array
    {
        $now = date('Y-m-d H:i:s');
        $id = $this->refunds->create([
            'booking_id' => $bookingId, 'user_id' => $userId,
            'reason' => $reason, 'status' => 'pending',
            'created_at' => $now, 'updated_at' => $now,
        ]);
        return $this->refunds->find($id);
    }

    public function approve(int $id): array
    {
        $this->refunds->updateById($id, ['status' => 'approved', 'updated_at' => date('Y-m-d H:i:s')]);
        return $this->refunds->find($id);
    }

    public function process(int $id, float $amount): array
    {
        $this->refunds->updateById($id, [
            'status' => 'processed', 'refund_amount' => $amount,
            'processed_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->refunds->find($id);
    }

    public function reject(int $id, string $reason): array
    {
        $this->refunds->updateById($id, [
            'status' => 'rejected', 'admin_note' => $reason,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->refunds->find($id);
    }

    public function list(array $filters, int $page, int $limit): array
    {
        $sql = 'SELECT r.*, b.booking_code, u.full_name FROM refunds r LEFT JOIN bookings b ON r.booking_id=b.id LEFT JOIN users u ON r.user_id=u.id';
        $binds = [];
        if (!empty($filters['status'])) {
            $sql .= ' WHERE r.status = :s';
            $binds['s'] = $filters['status'];
        }
        $sql .= ' ORDER BY r.created_at DESC';
        return $this->refunds->paginate($sql, $binds, $page, $limit);
    }

    public function detail(int $id): ?array
    {
        return $this->refunds->find($id);
    }

    public function myRefundsByBooking(int $bookingId, int $userId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM refunds WHERE booking_id = :bid AND user_id = :uid ORDER BY created_at DESC');
        $stmt->execute(['bid' => $bookingId, 'uid' => $userId]);
        return $stmt->fetchAll() ?: [];
    }
}
