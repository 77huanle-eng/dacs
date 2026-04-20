<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

class Booking extends Model
{
    protected string $table = 'bookings';

    public function findByCode(string $code): ?array
    {
        return $this->firstBy(['booking_code' => $code]);
    }

    public function myBookings(int $userId, array $filters, int $page, int $limit): array
    {
        $sql = 'SELECT b.*, t.title AS tour_title, t.thumbnail, i.id AS invoice_id, i.invoice_code
                FROM bookings b
                INNER JOIN tours t ON t.id = b.tour_id
                LEFT JOIN invoices i ON i.booking_id = b.id
                WHERE b.user_id = :user_id';

        $params = ['user_id' => $userId];

        if (!empty($filters['status'])) {
            $sql .= ' AND b.booking_status = :status';
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['payment_status'])) {
            $sql .= ' AND b.payment_status = :payment_status';
            $params['payment_status'] = $filters['payment_status'];
        }

        $sql .= ' ORDER BY b.id DESC';

        return $this->paginate($sql, $params, $page, $limit);
    }

    public function detailForUser(int $id, int $userId): ?array
    {
        $sql = 'SELECT b.*, t.title AS tour_title, t.destination, t.thumbnail, p.company_name AS provider_name,
                       i.id AS invoice_id, i.invoice_code
                FROM bookings b
                INNER JOIN tours t ON t.id = b.tour_id
                INNER JOIN providers p ON p.id = t.provider_id
                LEFT JOIN invoices i ON i.booking_id = b.id
                WHERE b.id = :id AND b.user_id = :user_id
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'id' => $id,
            'user_id' => $userId,
        ]);

        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function providerBookings(int $providerId, array $filters, int $page, int $limit): array
    {
        $sql = 'SELECT b.*, t.title AS tour_title, u.full_name AS customer_name, u.email AS customer_email
                FROM bookings b
                INNER JOIN tours t ON t.id = b.tour_id
                INNER JOIN users u ON u.id = b.user_id
                WHERE t.provider_id = :provider_id';

        $params = ['provider_id' => $providerId];

        if (!empty($filters['status'])) {
            $sql .= ' AND b.booking_status = :status';
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['q'])) {
            $sql .= ' AND (b.booking_code LIKE :q OR u.full_name LIKE :q OR t.title LIKE :q)';
            $params['q'] = '%' . $filters['q'] . '%';
        }

        $sql .= ' ORDER BY b.id DESC';

        return $this->paginate($sql, $params, $page, $limit);
    }

    public function providerDetail(int $bookingId, int $providerId): ?array
    {
        $sql = 'SELECT b.*, t.title AS tour_title, t.provider_id, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
                FROM bookings b
                INNER JOIN tours t ON t.id = b.tour_id
                INNER JOIN users u ON u.id = b.user_id
                WHERE b.id = :id AND t.provider_id = :provider_id
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'id' => $bookingId,
            'provider_id' => $providerId,
        ]);

        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function adminList(array $filters, int $page, int $limit): array
    {
        $sql = 'SELECT b.*, t.title AS tour_title, u.full_name AS user_name
                FROM bookings b
                INNER JOIN tours t ON t.id = b.tour_id
                INNER JOIN users u ON u.id = b.user_id
                WHERE 1=1';

        $params = [];

        if (!empty($filters['status'])) {
            $sql .= ' AND b.booking_status = :status';
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['payment_status'])) {
            $sql .= ' AND b.payment_status = :payment_status';
            $params['payment_status'] = $filters['payment_status'];
        }

        if (!empty($filters['q'])) {
            $sql .= ' AND (b.booking_code LIKE :q OR t.title LIKE :q OR u.full_name LIKE :q)';
            $params['q'] = '%' . $filters['q'] . '%';
        }

        $sql .= ' ORDER BY b.id DESC';

        return $this->paginate($sql, $params, $page, $limit);
    }

    public function adminDetail(int $id): ?array
    {
        $sql = 'SELECT b.*, t.title AS tour_title, u.full_name AS user_name, u.email AS user_email
                FROM bookings b
                INNER JOIN tours t ON t.id = b.tour_id
                INNER JOIN users u ON u.id = b.user_id
                WHERE b.id = :id
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $row = $stmt->fetch();
        return $row ?: null;
    }
}
