<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

class Post extends Model
{
    protected string $table = 'posts';

    public function paginatePublic(array $filters, int $page, int $limit): array
    {
        $sql = 'SELECT p.id, p.title, p.slug, p.excerpt, p.thumbnail, p.published_at, u.full_name AS author_name
                FROM posts p
                INNER JOIN users u ON u.id = p.author_id
                WHERE p.status = "published"';

        $params = [];

        if (!empty($filters['q'])) {
            $sql .= ' AND (p.title LIKE :q OR p.excerpt LIKE :q)';
            $params['q'] = '%' . $filters['q'] . '%';
        }

        $sql .= ' ORDER BY p.published_at DESC, p.id DESC';

        return $this->paginate($sql, $params, $page, $limit);
    }

    public function findBySlug(string $slug): ?array
    {
        $sql = 'SELECT p.*, u.full_name AS author_name
                FROM posts p
                INNER JOIN users u ON u.id = p.author_id
                WHERE p.slug = :slug
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['slug' => $slug]);
        $row = $stmt->fetch();

        return $row ?: null;
    }
}
