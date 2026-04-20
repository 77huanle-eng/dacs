<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

class Promotion extends Model
{
    protected string $table = 'promotions';

    public function findValidByCode(string $code): ?array
    {
        $sql = 'SELECT * FROM promotions
                WHERE code = :code
                  AND status = "active"
                  AND NOW() BETWEEN start_date AND end_date
                  AND (usage_limit IS NULL OR used_count < usage_limit)
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['code' => $code]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function increaseUsedCount(int $id): void
    {
        $stmt = $this->db->prepare('UPDATE promotions SET used_count = used_count + 1, updated_at = NOW() WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    public function decreaseUsedCount(int $id): void
    {
        $stmt = $this->db->prepare('UPDATE promotions SET used_count = GREATEST(0, used_count - 1), updated_at = NOW() WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    public function providerPromotions(int $providerId, int $page, int $limit, array $filters = []): array
    {
        $sql = 'SELECT * FROM promotions WHERE (provider_id = :provider_id OR provider_id IS NULL)';
        $params = ['provider_id' => $providerId];

        if (!empty($filters['status'])) {
            $sql .= ' AND status = :status';
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['q'])) {
            $sql .= ' AND (code LIKE :q OR title LIKE :q)';
            $params['q'] = '%' . $filters['q'] . '%';
        }

        $sql .= ' ORDER BY id DESC';

        return $this->paginate($sql, $params, $page, $limit);
    }

    public function publicActive(array $filters, int $page, int $limit): array
    {
        $sql = 'SELECT p.*, pr.company_name AS provider_name, COUNT(DISTINCT pt.tour_id) AS tour_count
                FROM promotions p
                LEFT JOIN providers pr ON pr.id = p.provider_id
                LEFT JOIN promotion_tours pt ON pt.promotion_id = p.id
                WHERE p.status = "active"
                  AND NOW() BETWEEN p.start_date AND p.end_date
                  AND (p.usage_limit IS NULL OR p.used_count < p.usage_limit)';

        $params = [];

        if (!empty($filters['q'])) {
            $sql .= ' AND (p.code LIKE :q OR p.title LIKE :q OR p.description LIKE :q)';
            $params['q'] = '%' . $filters['q'] . '%';
        }

        $sql .= ' GROUP BY p.id, pr.company_name';
        $sql .= ' ORDER BY p.end_date ASC, p.id DESC';

        return $this->paginate($sql, $params, $page, $limit);
    }
}
