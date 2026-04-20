<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

class User extends Model
{
    protected string $table = 'users';

    public function findByEmail(string $email): ?array
    {
        return $this->firstBy(['email' => $email]);
    }

    public function findWithRole(int $id): ?array
    {
        $sql = 'SELECT u.*, r.name AS role_name
                FROM users u
                INNER JOIN roles r ON r.id = u.role_id
                WHERE u.id = :id
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function paginateList(array $filters, int $page, int $limit): array
    {
        $sql = 'SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at, r.name AS role_name
                FROM users u
                INNER JOIN roles r ON r.id = u.role_id
                WHERE 1=1';

        $params = [];

        if (!empty($filters['q'])) {
            $sql .= ' AND (u.full_name LIKE :q OR u.email LIKE :q OR u.phone LIKE :q)';
            $params['q'] = '%' . $filters['q'] . '%';
        }

        if (!empty($filters['role'])) {
            $sql .= ' AND r.name = :role';
            $params['role'] = $filters['role'];
        }

        if (!empty($filters['status'])) {
            $sql .= ' AND u.status = :status';
            $params['status'] = $filters['status'];
        }

        $sql .= ' ORDER BY u.id DESC';

        return $this->paginate($sql, $params, $page, $limit);
    }
}
