<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\ApiException;
use App\Core\Database;
use App\Helpers\StrHelper;
use App\Models\Booking;
use App\Models\BookingTraveler;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Promotion;
use App\Models\Tour;
use PDO;

class BookingService
{
    private PDO $db;
    private Booking $bookings;
    private BookingTraveler $travelers;
    private Tour $tours;
    private Promotion $promotions;
    private Payment $payments;
    private Invoice $invoices;

    public function __construct()
    {
        $this->db = Database::connection();
        $this->bookings = new Booking();
        $this->travelers = new BookingTraveler();
        $this->tours = new Tour();
        $this->promotions = new Promotion();
        $this->payments = new Payment();
        $this->invoices = new Invoice();
    }

    public function create(int $userId, array $payload): array
    {
        $tourId = (int) ($payload['tour_id'] ?? 0);
        $adultCount = max(0, (int) ($payload['adult_count'] ?? 0));
        $childCount = max(0, (int) ($payload['child_count'] ?? 0));
        $totalGuests = max(1, (int) ($payload['total_guests'] ?? ($adultCount + $childCount)));

        if ($tourId <= 0) {
            throw new ApiException('tour_id không hợp lệ.', 422, ['tour_id' => ['tour_id là bắt buộc.']]);
        }

        $tour = $this->tours->find($tourId);
        if (!$tour || $tour['status'] !== 'active') {
            throw new ApiException('Tour không tồn tại hoặc không còn mở bán.', 404);
        }

        if ((int) $tour['available_slots'] < $totalGuests) {
            throw new ApiException('Tour không đủ chỗ trống cho số khách đã chọn.', 422);
        }

        $departureDate = $payload['departure_date'] ?? $tour['departure_date'];
        if (!$departureDate || strtotime((string) $departureDate) === false) {
            throw new ApiException('departure_date không hợp lệ.', 422);
        }

        if ($adultCount <= 0 && $childCount <= 0) {
            $adultCount = $totalGuests;
        }

        $subtotal = ($adultCount * (float) $tour['price_adult']) + ($childCount * (float) $tour['price_child']);
        $discountAmount = 0.0;
        $promotionId = null;

        if (!empty($payload['promotion_code'])) {
            [$promotionId, $discountAmount] = $this->computePromotion(
                (string) $payload['promotion_code'],
                $tourId,
                $subtotal
            );
        }

        $totalAmount = max(0, $subtotal - $discountAmount);

        $bookingCode = StrHelper::bookingCode();
        $now = date('Y-m-d H:i:s');

        $this->db->beginTransaction();
        try {
            $bookingId = $this->bookings->create([
                'booking_code' => $bookingCode,
                'user_id' => $userId,
                'tour_id' => $tourId,
                'promotion_id' => $promotionId,
                'contact_name' => $payload['contact_name'] ?? '',
                'contact_email' => $payload['contact_email'] ?? '',
                'contact_phone' => $payload['contact_phone'] ?? '',
                'total_guests' => $totalGuests,
                'adult_count' => $adultCount,
                'child_count' => $childCount,
                'departure_date' => date('Y-m-d', strtotime((string) $departureDate)),
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalAmount,
                'note' => $payload['note'] ?? null,
                'booking_status' => 'pending',
                'payment_status' => 'unpaid',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach (($payload['travelers'] ?? []) as $traveler) {
                $this->travelers->create([
                    'booking_id' => $bookingId,
                    'full_name' => $traveler['full_name'] ?? 'Khách lẻ',
                    'date_of_birth' => $traveler['date_of_birth'] ?? null,
                    'gender' => $traveler['gender'] ?? null,
                    'traveler_type' => $traveler['traveler_type'] ?? 'adult',
                    'passport_number' => $traveler['passport_number'] ?? null,
                    'note' => $traveler['note'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $this->tours->updateSlotsAndBookings($tourId, -$totalGuests, 1);

            $invoiceId = $this->invoices->create([
                'booking_id' => $bookingId,
                'invoice_code' => StrHelper::invoiceCode(),
                'issued_at' => $now,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalAmount,
                'payment_status' => 'unpaid',
                'notes' => 'Hóa đơn tạm tạo khi phát sinh booking.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if ($promotionId !== null) {
                $this->promotions->increaseUsedCount($promotionId);
            }

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return [
            'booking' => $this->bookings->find($bookingId),
            'invoice' => $this->invoices->find($invoiceId),
        ];
    }

    public function myBookings(int $userId, array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));
        return $this->bookings->myBookings($userId, $query, $page, $limit);
    }

    public function detail(int $bookingId, int $userId): array
    {
        $booking = $this->bookings->detailForUser($bookingId, $userId);
        if (!$booking) {
            throw new ApiException('Không tìm thấy booking.', 404);
        }

        $travelers = $this->travelers->all(['booking_id' => $bookingId], 'id ASC');

        return [
            'booking' => $booking,
            'travelers' => $travelers,
        ];
    }

    public function applyPromotion(int $bookingId, int $userId, string $promotionCode): array
    {
        $booking = $this->bookings->find($bookingId);
        if (!$booking || (int) $booking['user_id'] !== $userId) {
            throw new ApiException('Không tìm thấy booking để áp mã.', 404);
        }

        if ($booking['payment_status'] === 'paid') {
            throw new ApiException('Booking đã thanh toán, không thể áp mã giảm.', 422);
        }

        [$promotionId, $discountAmount] = $this->computePromotion(
            $promotionCode,
            (int) $booking['tour_id'],
            (float) $booking['subtotal']
        );

        $currentPromotionId = (int) ($booking['promotion_id'] ?? 0);
        $total = max(0, (float) $booking['subtotal'] - $discountAmount);
        $now = date('Y-m-d H:i:s');

        $this->db->beginTransaction();
        try {
            $this->bookings->updateById($bookingId, [
                'promotion_id' => $promotionId,
                'discount_amount' => $discountAmount,
                'total_amount' => $total,
                'updated_at' => $now,
            ]);

            $invoice = $this->invoices->firstBy(['booking_id' => $bookingId]);
            if ($invoice) {
                $this->invoices->updateById((int) $invoice['id'], [
                    'discount_amount' => $discountAmount,
                    'total_amount' => $total,
                    'updated_at' => $now,
                ]);
            }

            if ($currentPromotionId > 0 && $currentPromotionId !== $promotionId) {
                $this->promotions->decreaseUsedCount($currentPromotionId);
            }

            if ($currentPromotionId !== $promotionId) {
                $this->promotions->increaseUsedCount($promotionId);
            }

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return [
            'booking' => $this->bookings->find($bookingId),
        ];
    }

    public function payment(int $bookingId, int $userId, array $payload): array
    {
        $booking = $this->bookings->find($bookingId);
        if (!$booking || (int) $booking['user_id'] !== $userId) {
            throw new ApiException('Không tìm thấy booking cần thanh toán.', 404);
        }

        if ($booking['payment_status'] === 'paid') {
            throw new ApiException('Booking này đã thanh toán trước đó.', 422);
        }

        $method = strtolower((string) ($payload['payment_method'] ?? 'bank_card'));
        if (!in_array($method, ['bank_card', 'e_wallet', 'bank_transfer'], true)) {
            throw new ApiException('Phương thức thanh toán không hợp lệ.', 422);
        }

        $isTransfer = $method === 'bank_transfer';
        $paymentStatus = $isTransfer ? 'pending' : 'paid';
        $bookingStatus = $isTransfer ? 'pending' : 'confirmed';
        $now = date('Y-m-d H:i:s');

        $this->db->beginTransaction();
        try {
            $paymentId = $this->payments->create([
                'booking_id' => $bookingId,
                'payment_method' => $method,
                'transaction_code' => $payload['transaction_code'] ?? ('TXN' . date('YmdHis') . random_int(100, 999)),
                'amount' => $booking['total_amount'],
                'payment_status' => $paymentStatus,
                'paid_at' => $isTransfer ? null : $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->bookings->updateById($bookingId, [
                'payment_status' => $paymentStatus,
                'booking_status' => $bookingStatus,
                'updated_at' => $now,
            ]);

            $invoice = $this->invoices->firstBy(['booking_id' => $bookingId]);
            if ($invoice) {
                $this->invoices->updateById((int) $invoice['id'], [
                    'payment_status' => $paymentStatus,
                    'issued_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return [
            'payment' => $this->payments->find($paymentId),
            'booking' => $this->bookings->find($bookingId),
            'invoice' => $this->invoices->firstBy(['booking_id' => $bookingId]),
        ];
    }

    public function cancel(int $bookingId, int $userId): array
    {
        $booking = $this->bookings->find($bookingId);
        if (!$booking || (int) $booking['user_id'] !== $userId) {
            throw new ApiException('Không tìm thấy booking.', 404);
        }

        if (in_array($booking['booking_status'], ['cancelled', 'completed'], true)) {
            throw new ApiException('Booking không thể hủy ở trạng thái hiện tại.', 422);
        }

        $departureTimestamp = strtotime((string) $booking['departure_date']);
        if ($departureTimestamp === false || $departureTimestamp < strtotime('+2 days')) {
            throw new ApiException('Chỉ được hủy booking trước ít nhất 2 ngày khởi hành.', 422);
        }

        $now = date('Y-m-d H:i:s');

        $this->db->beginTransaction();
        try {
            $this->bookings->updateById($bookingId, [
                'booking_status' => 'cancelled',
                'updated_at' => $now,
            ]);

            $this->tours->updateSlotsAndBookings((int) $booking['tour_id'], (int) $booking['total_guests'], -1);

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return [
            'booking' => $this->bookings->find($bookingId),
        ];
    }

    private function computePromotion(string $code, int $tourId, float $subtotal): array
    {
        $normalizedCode = strtoupper(trim($code));
        if ($normalizedCode === '') {
            throw new ApiException('Mã khuyến mãi không được để trống.', 422);
        }

        $promotion = $this->promotions->findValidByCode($normalizedCode);
        if (!$promotion) {
            throw new ApiException('Mã khuyến mãi không hợp lệ hoặc đã hết hạn.', 422);
        }

        if ($promotion['min_order_value'] !== null && $subtotal < (float) $promotion['min_order_value']) {
            throw new ApiException('Đơn hàng chưa đạt giá trị tối thiểu để dùng mã.', 422);
        }

        if (!$this->promotionAppliesTour((int) $promotion['id'], $tourId)) {
            throw new ApiException('Mã khuyến mãi không áp dụng cho tour này.', 422);
        }

        $discount = 0.0;
        if ($promotion['discount_type'] === 'percent') {
            $discount = $subtotal * ((float) $promotion['discount_value'] / 100);
        } else {
            $discount = (float) $promotion['discount_value'];
        }

        if ($promotion['max_discount_value'] !== null) {
            $discount = min($discount, (float) $promotion['max_discount_value']);
        }

        return [(int) $promotion['id'], max(0, $discount)];
    }

    private function promotionAppliesTour(int $promotionId, int $tourId): bool
    {
        $sql = 'SELECT COUNT(*) AS total FROM promotion_tours WHERE promotion_id = :promotion_id';
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['promotion_id' => $promotionId]);
        $total = (int) ($stmt->fetch()['total'] ?? 0);

        if ($total === 0) {
            return true;
        }

        $sql = 'SELECT COUNT(*) AS total
                FROM promotion_tours
                WHERE promotion_id = :promotion_id AND tour_id = :tour_id';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'promotion_id' => $promotionId,
            'tour_id' => $tourId,
        ]);

        return (int) ($stmt->fetch()['total'] ?? 0) > 0;
    }
}

