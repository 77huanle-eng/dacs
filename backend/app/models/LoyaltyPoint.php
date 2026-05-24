<?php
declare(strict_types=1);
namespace App\Models;
use App\Core\Database;
use App\Core\Model;
use PDO;

class LoyaltyPoint extends Model
{
    protected string $table = 'loyalty_points';
    private PDO $db;

    public function __construct()
    {
        parent::__construct();
        $this->db = Database::connection();
    }

    public function earn(int $userId, int $points, string $type, ?int $refId, string $desc): int
    {
        return $this->create([
            'user_id' => $userId, 'points' => $points, 'type' => 'earn',
            'source_type' => $type, 'source_id' => $refId,
            'description' => $desc, 'created_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function redeem(int $userId, int $points, string $type, ?int $refId, string $desc): int
    {
        return $this->create([
            'user_id' => $userId, 'points' => -$points, 'type' => 'redeem',
            'source_type' => $type, 'source_id' => $refId,
            'description' => $desc, 'created_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function balance(int $userId): array
    {
        $stmt = $this->db->prepare('SELECT COALESCE(SUM(points), 0) AS total_points FROM loyalty_points WHERE user_id = :uid');
        $stmt->execute(['uid' => $userId]);
        $total = (int) ($stmt->fetch()['total_points'] ?? 0);
        $user = (new User())->find($userId);
        return [
            'total_points' => $total,
            'membership_tier' => $user['membership_tier'] ?? 'Silver',
        ];
    }

    public function syncUserPoints(int $userId): void
    {
        $bal = $this->balance($userId);
        $points = $bal['total_points'];
        $tier = 'Silver';
        if ($points >= 5000) $tier = 'Diamond';
        elseif ($points >= 2000) $tier = 'Platinum';
        elseif ($points >= 500) $tier = 'Gold';
        (new User())->updateById($userId, ['loyalty_points' => $points, 'membership_tier' => $tier]);
    }
}
