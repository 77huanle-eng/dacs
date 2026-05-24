<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Request;
use App\Models\BookingHold;

class BookingHoldController extends Controller
{
    private BookingHold $holds;
    public function __construct() { $this->holds = new BookingHold(); }

    public function hold(Request $request, array $params): void
    {
        $userId = $this->authUserId($request);
        $data = $request->input();
        $this->validatePayload($data, ['tour_id' => 'required', 'departure_id' => 'required', 'guests' => 'required'], 'Dữ liệu giữ chỗ không hợp lệ.');
        $tourId = (int) $data['tour_id'];
        $departureId = (int) $data['departure_id'];
        $guests = (int) $data['guests'];
        $existing = $this->holds->activeHold($userId, $tourId, $departureId);
        if ($existing) {
            throw new ApiException('Bạn đang giữ chỗ cho tour này rồi.', 409);
        }
        $id = $this->holds->hold($userId, $tourId, $departureId, $guests);
        $this->created($this->holds->find($id), 'Giữ chỗ thành công (10 phút).');
    }

    public function release(Request $request, array $params): void
    {
        $userId = $this->authUserId($request);
        $id = $this->routeId($params);
        $hold = $this->holds->find($id);
        if (!$hold || (int) $hold['user_id'] !== $userId) {
            throw new ApiException('Không tìm thấy.', 404);
        }
        $this->holds->release($id);
        $this->ok(null, 'Đã hủy giữ chỗ.');
    }

    public function myHolds(Request $request, array $params): void
    {
        $userId = $this->authUserId($request);
        $this->ok($this->holds->myHolds($userId));
    }

    public function expireHolds(Request $request, array $params): void
    {
        $count = $this->holds->expireAll();
        $this->ok(['expired' => $count]);
    }
}
