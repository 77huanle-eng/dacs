<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

class Tour extends Model
{
    protected string $table = 'tours';

    public function paginatePublic(array $filters, int $page, int $limit): array
    {
        $sql = 'SELECT t.*, c.name AS category_name, p.company_name AS provider_name,
                       (SELECT COUNT(*) FROM tour_images ti WHERE ti.tour_id = t.id) AS images_count
                FROM tours t
                INNER JOIN categories c ON c.id = t.category_id
                INNER JOIN providers p ON p.id = t.provider_id
                WHERE t.status = "active"';

        $params = [];

        if (!empty($filters['q'])) {
            $sql .= ' AND (t.title LIKE :q OR t.destination LIKE :q OR t.short_description LIKE :q)';
            $params['q'] = '%' . $filters['q'] . '%';
        }

        if (!empty($filters['category'])) {
            if (is_numeric($filters['category'])) {
                $sql .= ' AND t.category_id = :category_id';
                $params['category_id'] = (int) $filters['category'];
            } else {
                $sql .= ' AND c.slug = :category_slug';
                $params['category_slug'] = $filters['category'];
            }
        }

        if (!empty($filters['destination'])) {
            $sql .= ' AND t.destination LIKE :destination';
            $params['destination'] = '%' . $filters['destination'] . '%';
        }

        if (!empty($filters['min_price']) && is_numeric($filters['min_price'])) {
            $sql .= ' AND COALESCE(t.discount_price, t.price_adult) >= :min_price';
            $params['min_price'] = (float) $filters['min_price'];
        }

        if (!empty($filters['max_price']) && is_numeric($filters['max_price'])) {
            $sql .= ' AND COALESCE(t.discount_price, t.price_adult) <= :max_price';
            $params['max_price'] = (float) $filters['max_price'];
        }

        if (!empty($filters['duration']) && is_numeric($filters['duration'])) {
            $duration = (int) $filters['duration'];
            if ($duration >= 6) {
                $sql .= ' AND t.duration_days >= :duration_days';
            } else {
                $sql .= ' AND t.duration_days = :duration_days';
            }
            $params['duration_days'] = $duration;
        }

        if (!empty($filters['rating']) && is_numeric($filters['rating'])) {
            $sql .= ' AND t.rating_avg >= :rating';
            $params['rating'] = (float) $filters['rating'];
        }

        $sort = strtolower((string) ($filters['sort'] ?? 'newest'));
        $orderBy = match ($sort) {
            'price-asc', 'price_asc' => 'COALESCE(t.discount_price, t.price_adult) ASC',
            'price-desc', 'price_desc' => 'COALESCE(t.discount_price, t.price_adult) DESC',
            'popular' => 't.bookings_count DESC',
            'rating' => 't.rating_avg DESC',
            default => 't.created_at DESC',
        };

        $sql .= " ORDER BY {$orderBy}";

        return $this->paginate($sql, $params, $page, $limit);
    }

    public function getFeatured(int $limit = 8): array
    {
        $stmt = $this->db->prepare('SELECT * FROM tours WHERE status = "active" AND is_featured = 1 ORDER BY rating_avg DESC, bookings_count DESC LIMIT :limit');
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function getPromotionTours(int $limit = 8): array
    {
        $sql = 'SELECT DISTINCT t.*
                FROM tours t
                INNER JOIN promotion_tours pt ON pt.tour_id = t.id
                INNER JOIN promotions p ON p.id = pt.promotion_id
                WHERE t.status = "active"
                  AND p.status = "active"
                  AND NOW() BETWEEN p.start_date AND p.end_date
                ORDER BY p.created_at DESC
                LIMIT :limit';

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function detail(int $id): ?array
    {
        $sql = 'SELECT t.*, c.name AS category_name, p.company_name AS provider_name, p.contact_email AS provider_email,
                       p.contact_phone AS provider_phone
                FROM tours t
                INNER JOIN categories c ON c.id = t.category_id
                INNER JOIN providers p ON p.id = t.provider_id
                WHERE t.id = :id
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function increaseViews(int $id): void
    {
        $stmt = $this->db->prepare('UPDATE tours SET views_count = views_count + 1, updated_at = NOW() WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    public function updateSlotsAndBookings(int $id, int $deltaSlots, int $deltaBookings = 0): void
    {
        $sql = 'UPDATE tours
                SET available_slots = GREATEST(0, available_slots + :delta_slots),
                    bookings_count = GREATEST(0, bookings_count + :delta_bookings),
                    updated_at = NOW()
                WHERE id = :id';

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'delta_slots' => $deltaSlots,
            'delta_bookings' => $deltaBookings,
            'id' => $id,
        ]);
    }

    public function providerTours(int $providerId, array $filters, int $page, int $limit): array
    {
        $sql = 'SELECT t.*, c.name AS category_name
                FROM tours t
                INNER JOIN categories c ON c.id = t.category_id
                WHERE t.provider_id = :provider_id';

        $params = ['provider_id' => $providerId];

        if (!empty($filters['q'])) {
            $sql .= ' AND (t.title LIKE :q OR t.destination LIKE :q)';
            $params['q'] = '%' . $filters['q'] . '%';
        }

        if (!empty($filters['status'])) {
            $sql .= ' AND t.status = :status';
            $params['status'] = $filters['status'];
        }

        $sql .= ' ORDER BY t.id DESC';

        return $this->paginate($sql, $params, $page, $limit);
    }
}
