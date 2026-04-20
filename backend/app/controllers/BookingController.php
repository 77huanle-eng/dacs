<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Services\BookingService;

class BookingController extends Controller
{
    private BookingService $bookingService;

    public function __construct()
    {
        $this->bookingService = new BookingService();
    }

    public function create(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'tour_id' => 'required|integer|min_num:1',
            'contact_name' => 'required|string|min:2|max:120',
            'contact_email' => 'required|email|max:180',
            'contact_phone' => 'required|phone|max:30',
            'adult_count' => 'integer|min_num:0|max_num:50',
            'child_count' => 'integer|min_num:0|max_num:50',
            'total_guests' => 'integer|min_num:1|max_num:50',
            'departure_date' => 'date',
            'promotion_code' => 'max:80',
            'note' => 'max:2000',
        ], 'Dữ liệu booking không hợp lệ.');

        $data = $this->bookingService->create($this->authUserId($request), $payload);
        $this->created($data, 'Tạo booking thành công.');
    }

    public function myBookings(Request $request, array $params): void
    {
        $result = $this->bookingService->myBookings($this->authUserId($request), $request->query());
        $this->ok($result['items'], 'Lấy lịch sử booking thành công.', $result['meta']);
    }

    public function detail(Request $request, array $params): void
    {
        $data = $this->bookingService->detail($this->routeId($params), $this->authUserId($request));
        $this->ok($data, 'Lấy chi tiết booking thành công.');
    }

    public function cancel(Request $request, array $params): void
    {
        $data = $this->bookingService->cancel($this->routeId($params), $this->authUserId($request));
        $this->ok($data, 'Hủy booking thành công.');
    }

    public function applyPromotion(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'code' => 'max:80',
            'promotion_code' => 'max:80',
        ], 'Mã khuyến mãi không hợp lệ.');

        $code = (string) ($payload['code'] ?? $payload['promotion_code'] ?? '');
        $data = $this->bookingService->applyPromotion($this->routeId($params), $this->authUserId($request), $code);
        $this->ok($data, 'Áp mã khuyến mãi thành công.');
    }

    public function payment(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'payment_method' => 'required|in:bank_card,e_wallet,bank_transfer',
            'transaction_code' => 'max:120',
        ], 'Dữ liệu thanh toán không hợp lệ.');

        $data = $this->bookingService->payment($this->routeId($params), $this->authUserId($request), $payload);
        $this->ok($data, 'Thanh toán booking thành công.');
    }
}
