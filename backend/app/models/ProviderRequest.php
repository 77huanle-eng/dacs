<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

class ProviderRequest extends Model
{
    protected string $table = 'provider_requests';

    public function latestByUserId(int $userId): ?array
    {
        $sql = 'SELECT * FROM provider_requests WHERE user_id = :user_id ORDER BY id DESC LIMIT 1';
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['user_id' => $userId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function paginateRequests(array $filters, int $page, int $limit): array
    {
        $sql = 'SELECT pr.*, u.full_name, u.email
                FROM provider_requests pr
                INNER JOIN users u ON u.id = pr.user_id
                WHERE 1=1';
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= ' AND pr.status = :status';
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['q'])) {
            $sql .= ' AND (u.full_name LIKE :q OR u.email LIKE :q OR pr.company_name LIKE :q OR pr.contact_email LIKE :q)';
            $params['q'] = '%' . $filters['q'] . '%';
        }

        $sql .= ' ORDER BY pr.id DESC';

        return $this->paginate($sql, $params, $page, $limit);
    }
}
