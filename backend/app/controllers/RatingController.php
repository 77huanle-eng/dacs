<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Database;
use App\Core\Request;
use App\Models\Rating;
use App\Models\Tour;

class RatingController extends Controller
{
    private Rating $ratings;
    private Tour $tours;

    public function __construct()
    {
        $this->ratings = new Rating();
        $this->tours = new Tour();
    }

    public function create(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $payload = $request->input();
        $this->validatePayload($payload, [
            'tour_id' => 'required|integer|min_num:1',
            'score' => 'required|integer|min_num:1|max_num:5',
            'review' => 'max:2000',
        ], 'Dữ liệu đánh giá không hợp lệ.');

        $tourId = (int) ($payload['tour_id'] ?? 0);
        $score = (int) ($payload['score'] ?? 0);

        if ($tourId <= 0 || !$this->tours->find($tourId)) {
            throw new ApiException('tour_id không hợp lệ.', 422);
        }

        if ($score < 1 || $score > 5) {
            throw new ApiException('score phải từ 1 đến 5.', 422);
        }

        $existing = $this->ratings->firstBy([
            'user_id' => (int) $user['id'],
            'tour_id' => $tourId,
        ]);

        if ($existing) {
            throw new ApiException('Bạn đã đánh giá tour này.', 409);
        }

        $id = $this->ratings->create([
            'user_id' => (int) $user['id'],
            'tour_id' => $tourId,
            'score' => $score,
            'review' => $request->input('review') ?? null,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $this->syncTourRating($tourId);

        $this->created($this->ratings->find($id), 'Đánh giá tour thành công.');
    }

    public function update(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $id = (int) ($params['id'] ?? 0);
        $rating = $this->ratings->find($id);

        if (!$rating) {
            throw new ApiException('Không tìm thấy đánh giá.', 404);
        }

        $role = strtolower((string) ($user['role_name'] ?? 'user'));
        if ((int) $rating['user_id'] !== (int) $user['id'] && $role !== 'admin') {
            throw new ApiException('Bạn không có quyền sửa đánh giá này.', 403);
        }

        $payload = $request->input();
        $this->validatePayload($payload, [
            'score' => 'integer|min_num:1|max_num:5',
            'review' => 'max:2000',
        ], 'Dữ liệu cập nhật đánh giá không hợp lệ.');

        $score = (int) ($payload['score'] ?? $rating['score']);
        if ($score < 1 || $score > 5) {
            throw new ApiException('score phải từ 1 đến 5.', 422);
        }

        $this->ratings->updateById($id, [
            'score' => $score,
            'review' => $payload['review'] ?? $rating['review'],
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $this->syncTourRating((int) $rating['tour_id']);

        $this->ok($this->ratings->find($id), 'Cập nhật đánh giá thành công.');
    }

    public function delete(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $id = (int) ($params['id'] ?? 0);
        $rating = $this->ratings->find($id);

        if (!$rating) {
            throw new ApiException('Không tìm thấy đánh giá.', 404);
        }

        $role = strtolower((string) ($user['role_name'] ?? 'user'));
        if ((int) $rating['user_id'] !== (int) $user['id'] && $role !== 'admin') {
            throw new ApiException('Bạn không có quyền xóa đánh giá này.', 403);
        }

        $tourId = (int) $rating['tour_id'];
        $this->ratings->deleteById($id);
        $this->syncTourRating($tourId);

        $this->ok(null, 'Xóa đánh giá thành công.');
    }

    private function syncTourRating(int $tourId): void
    {
        $db = Database::connection();
        $stmt = $db->prepare('SELECT AVG(score) AS avg_score FROM ratings WHERE tour_id = :tour_id');
        $stmt->execute(['tour_id' => $tourId]);
        $avg = (float) ($stmt->fetch()['avg_score'] ?? 0);

        $tour = new Tour();
        $tour->updateById($tourId, [
            'rating_avg' => round($avg, 2),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }
}
