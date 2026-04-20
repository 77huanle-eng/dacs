<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

class Comment extends Model
{
    protected string $table = 'comments';

    public function publicFeed(array $filters, int $page, int $limit): array
    {
        $sql = 'SELECT c.id, c.user_id, c.tour_id, c.content, c.status, c.created_at, c.updated_at,
                       u.full_name AS user_name, u.avatar AS user_avatar,
                       t.title AS tour_title,
                       COALESCE(r.score, t.rating_avg, 5) AS score
                FROM comments c
                INNER JOIN users u ON u.id = c.user_id
                INNER JOIN tours t ON t.id = c.tour_id
                LEFT JOIN ratings r ON r.tour_id = c.tour_id AND r.user_id = c.user_id
                WHERE c.status = "visible" AND t.status = "active"';

        $params = [];

        if (!empty($filters['q'])) {
            $sql .= ' AND (c.content LIKE :q OR u.full_name LIKE :q OR t.title LIKE :q)';
            $params['q'] = '%' . $filters['q'] . '%';
        }

        if (!empty($filters['tour_id']) && is_numeric($filters['tour_id'])) {
            $sql .= ' AND c.tour_id = :tour_id';
            $params['tour_id'] = (int) $filters['tour_id'];
        }

        $sql .= ' ORDER BY c.created_at DESC, c.id DESC';

        return $this->paginate($sql, $params, $page, $limit);
    }
}

