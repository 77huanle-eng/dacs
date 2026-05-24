<?php
declare(strict_types=1);
namespace App\Models;
use App\Core\Database;
use App\Core\Model;
use PDO;

class BookingHold extends Model
{
    protected string $table = 'booking_holds';
    private PDO $db;

    public function __construct()
    {
        parent::__construct();
        $this->db = Database::connection();
    }

    public function hold(int $userId, int $tourId, int $departureId, int $guests): int
    {
        return $this->create([
            'user_id' => $userId,
            'tour_id' => $tourId,
            'departure_id' => $departureId,
            'guests' => $guests,
            'status' => 'active',
            'expires_at' => date('Y-m-d H:i:s', strtotime('+10 minutes')),
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function release(int $id): bool
    {
        return $this->updateById($id, ['status' => 'released']);
    }

    public function expireAll(): int
    {
        $stmt = $this->db->prepare('UPDATE booking_holds SET status = "expired" WHERE status = "active" AND expires_at < NOW()');
        $stmt->execute();
        return $stmt->rowCount();
    }

    public function myHolds(int $userId): array
    {
        $stmt = $this->db->prepare('SELECT bh.*, t.title AS tour_title FROM booking_holds bh LEFT JOIN tours t ON bh.tour_id = t.id WHERE bh.user_id = :uid AND bh.status = "active" AND bh.expires_at > NOW() ORDER BY bh.created_at DESC');
        $stmt->execute(['uid' => $userId]);
        return $stmt->fetchAll() ?: [];
    }

    public function activeHold(int $userId, int $tourId, int $departureId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM booking_holds WHERE user_id = :u AND tour_id = :t AND departure_id = :d AND status = "active" AND expires_at > NOW() LIMIT 1');
        $stmt->execute(['u' => $userId, 't' => $tourId, 'd' => $departureId]);
        return $stmt->fetch() ?: null;
    }

    public function totalHeldGuests(int $tourId, int $departureId): int
    {
        $stmt = $this->db->prepare('SELECT COALESCE(SUM(guests), 0) AS total FROM booking_holds WHERE tour_id = :t AND departure_id = :d AND status = "active" AND expires_at > NOW()');
        $stmt->execute(['t' => $tourId, 'd' => $departureId]);
        return (int) ($stmt->fetch()['total'] ?? 0);
    }
}
