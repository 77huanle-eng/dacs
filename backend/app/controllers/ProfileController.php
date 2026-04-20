<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Request;
use App\Models\Tour;
use App\Models\Wishlist;
use App\Services\AuthService;

class ProfileController extends Controller
{
    private AuthService $authService;
    private Wishlist $wishlists;
    private Tour $tours;

    public function __construct()
    {
        $this->authService = new AuthService();
        $this->wishlists = new Wishlist();
        $this->tours = new Tour();
    }

    public function getProfile(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $data = $this->authService->me((int) $user['id']);
        $this->ok($data, 'Lấy hồ sơ thành công.');
    }

    public function updateProfile(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $payload = $request->input();
        $this->validatePayload($payload, [
            'full_name' => 'string|min:2|max:120',
            'email' => 'email|max:180',
            'phone' => 'phone|max:30',
            'address' => 'max:255',
            'city' => 'max:120',
            'date_of_birth' => 'date',
            'gender' => 'in:male,female,other',
            'bio' => 'max:2000',
        ], 'Dữ liệu hồ sơ không hợp lệ.');

        $data = $this->authService->updateProfile((int) $user['id'], $payload);
        $this->ok($data, 'Cập nhật hồ sơ thành công.');
    }

    public function uploadAvatar(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $file = $request->file('avatar');

        if (!$file) {
            throw new ApiException('Vui lòng chọn ảnh hồ sơ để tải lên.', 422);
        }

        $data = $this->authService->uploadAvatar((int) $user['id'], $file);
        $this->ok($data, 'Tải ảnh hồ sơ thành công.');
    }

    public function wishlist(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');

        $sql = 'SELECT w.id, w.tour_id, w.created_at, t.title, t.thumbnail, t.destination, COALESCE(t.discount_price, t.price_adult) AS price
                FROM wishlists w
                INNER JOIN tours t ON t.id = w.tour_id
                WHERE w.user_id = :user_id
                ORDER BY w.id DESC';

        $result = $this->wishlists->paginate($sql, ['user_id' => (int) $user['id']], 1, 200);
        $this->ok($result['items'], 'Lấy danh sách wishlist thành công.', $result['meta']);
    }

    public function addWishlist(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $payload = $request->input();
        $this->validatePayload($payload, [
            'tour_id' => 'required|integer|min_num:1',
        ], 'Dữ liệu wishlist không hợp lệ.');

        $tourId = (int) ($payload['tour_id'] ?? 0);

        if ($tourId <= 0) {
            throw new ApiException('tour_id không hợp lệ.', 422);
        }

        if (!$this->tours->find($tourId)) {
            throw new ApiException('Tour không tồn tại.', 404);
        }

        $exists = $this->wishlists->firstBy([
            'user_id' => (int) $user['id'],
            'tour_id' => $tourId,
        ]);

        if ($exists) {
            $this->ok($exists, 'Tour đã có trong wishlist.');
            return;
        }

        $id = $this->wishlists->create([
            'user_id' => (int) $user['id'],
            'tour_id' => $tourId,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        $this->created($this->wishlists->find($id), 'Đã thêm tour vào wishlist.');
    }

    public function removeWishlist(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $tourId = (int) ($params['tourId'] ?? 0);

        $item = $this->wishlists->firstBy([
            'user_id' => (int) $user['id'],
            'tour_id' => $tourId,
        ]);

        if (!$item) {
            throw new ApiException('Không tìm thấy tour trong wishlist.', 404);
        }

        $this->wishlists->deleteById((int) $item['id']);
        $this->ok(null, 'Đã xóa tour khỏi wishlist.');
    }
}
