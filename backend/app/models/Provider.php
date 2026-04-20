<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

class Provider extends Model
{
    protected string $table = 'providers';

    public function firstAvailableId(): ?int
    {
        $sql = 'SELECT id
                FROM providers
                ORDER BY (status = "active") DESC, id ASC
                LIMIT 1';

        $stmt = $this->db->query($sql);
        $row = $stmt->fetch();

        if (!$row || !isset($row['id'])) {
            return null;
        }

        return (int) $row['id'];
    }

    public function findByUserId(int $userId): ?array
    {
        return $this->firstBy(['user_id' => $userId]);
    }

    public function pendingRequests(int $limit = 10): array
    {
        $sql = 'SELECT p.*, u.full_name, u.email
                FROM providers p
                INNER JOIN users u ON u.id = p.user_id
                WHERE p.status = "pending"
                ORDER BY p.id DESC
                LIMIT :limit';

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function paginateProviders(array $filters, int $page, int $limit): array
    {
        $sql = 'SELECT p.*, u.full_name, u.email
                FROM providers p
                INNER JOIN users u ON u.id = p.user_id
                WHERE 1=1';
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= ' AND p.status = :status';
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['q'])) {
            $sql .= ' AND (p.company_name LIKE :q OR u.full_name LIKE :q OR u.email LIKE :q)';
            $params['q'] = '%' . $filters['q'] . '%';
        }

        $sql .= ' ORDER BY p.id DESC';

        return $this->paginate($sql, $params, $page, $limit);
    }
}
