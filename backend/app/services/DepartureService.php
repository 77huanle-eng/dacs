<?php
declare(strict_types=1);
namespace App\Services;
use App\Core\ApiException;
use App\Core\Database;
use App\Models\Departure;
use PDO;

class DepartureService
{
    private PDO $db;
    private Departure $departures;

    public function __construct()
    {
        $this->db = Database::connection();
        $this->departures = new Departure();
    }

    public function openByTour(int $tourId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM departures WHERE tour_id = :tid AND status = "open" AND departure_date >= CURDATE() ORDER BY departure_date ASC');
        $stmt->execute(['tid' => $tourId]);
        return $stmt->fetchAll() ?: [];
    }

    public function byTour(int $tourId): array
    {
        return $this->departures->all(['tour_id' => $tourId], 'departure_date DESC');
    }

    public function create(array $data): array
    {
        $now = date('Y-m-d H:i:s');
        $id = $this->departures->create([
            'tour_id' => (int) $data['tour_id'],
            'departure_date' => $data['departure_date'],
            'return_date' => $data['return_date'] ?? null,
            'max_guests' => (int) $data['max_guests'],
            'current_guests' => 0,
            'price_override' => isset($data['price_override']) ? (float) $data['price_override'] : null,
            'status' => $data['status'] ?? 'open',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        return $this->departures->find($id);
    }

    public function update(int $id, int $tourId, array $data): array
    {
        $dep = $this->departures->find($id);
        if (!$dep || (int) $dep['tour_id'] !== $tourId) {
            throw new ApiException('Không tìm thấy lịch khởi hành.', 404);
        }
        $data['updated_at'] = date('Y-m-d H:i:s');
        unset($data['id'], $data['tour_id']);
        $this->departures->updateById($id, $data);
        return $this->departures->find($id);
    }

    public function delete(int $id, int $tourId): void
    {
        $dep = $this->departures->find($id);
        if (!$dep || (int) $dep['tour_id'] !== $tourId) {
            throw new ApiException('Không tìm thấy lịch khởi hành.', 404);
        }
        $this->departures->deleteById($id);
    }
}
