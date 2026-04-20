<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\ApiException;
use App\Core\Database;
use App\Helpers\StrHelper;
use App\Models\Booking;
use App\Models\Comment;
use App\Models\Notification;
use App\Models\Promotion;
use App\Models\Provider;
use App\Models\ProviderRequest;
use App\Models\Rating;
use App\Models\Tour;
use App\Models\TourImage;
use App\Models\TourService as TourServiceModel;
use PDO;

class ProviderService
{
    private PDO $db;
    private ProviderRequest $providerRequests;
    private Provider $providers;
    private Tour $tours;
    private TourImage $tourImages;
    private Booking $bookings;
    private TourServiceModel $tourServices;
    private Promotion $promotions;
    private Comment $comments;
    private Notification $notifications;
    private Rating $ratings;

    public function __construct()
    {
        $this->db = Database::connection();
        $this->providerRequests = new ProviderRequest();
        $this->providers = new Provider();
        $this->tours = new Tour();
        $this->tourImages = new TourImage();
        $this->bookings = new Booking();
        $this->tourServices = new TourServiceModel();
        $this->promotions = new Promotion();
        $this->comments = new Comment();
        $this->notifications = new Notification();
        $this->ratings = new Rating();
    }

    public function submitRequest(int $userId, array $payload): array
    {
        $companyName = trim((string) ($payload['company_name'] ?? ''));
        if ($companyName === '') {
            throw new ApiException('Tên công ty là bắt buộc khi gửi yêu cầu provider.', 422, [
                'company_name' => ['Tên công ty là bắt buộc.'],
            ]);
        }

        if (!empty($payload['contact_email']) && !filter_var((string) $payload['contact_email'], FILTER_VALIDATE_EMAIL)) {
            throw new ApiException('Email liên hệ không đúng định dạng.', 422, [
                'contact_email' => ['Email liên hệ không hợp lệ.'],
            ]);
        }

        $existing = $this->providerRequests->latestByUserId($userId);
        if ($existing && in_array($existing['status'], ['pending', 'approved'], true)) {
            throw new ApiException('Bạn đã có yêu cầu provider đang xử lý hoặc đã duyệt.', 409);
        }

        $id = $this->providerRequests->create([
            'user_id' => $userId,
            'company_name' => $companyName,
            'tax_code' => $payload['tax_code'] ?? null,
            'business_license' => $payload['business_license'] ?? null,
            'description' => $payload['description'] ?? null,
            'contact_email' => $payload['contact_email'] ?? null,
            'contact_phone' => $payload['contact_phone'] ?? null,
            'address' => $payload['address'] ?? null,
            'status' => 'pending',
            'admin_note' => null,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->providerRequests->find($id) ?? [];
    }

    public function latestRequest(int $userId): ?array
    {
        return $this->providerRequests->latestByUserId($userId);
    }

    public function profile(int $userId): array
    {
        $provider = $this->providers->findByUserId($userId);
        if (!$provider) {
            throw new ApiException('Bạn chưa có hồ sơ provider.', 404);
        }

        return $provider;
    }

    public function updateProfile(int $userId, array $payload): array
    {
        $provider = $this->providers->findByUserId($userId);
        if (!$provider) {
            throw new ApiException('Không tìm thấy hồ sơ provider.', 404);
        }

        $allowed = [
            'company_name',
            'tax_code',
            'business_license',
            'description',
            'logo',
            'address',
            'contact_email',
            'contact_phone',
            'status',
        ];

        if (array_key_exists('support_policy', $provider)) {
            $allowed[] = 'support_policy';
        }

        $data = [];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $payload)) {
                $data[$field] = $payload[$field];
            }
        }

        if ($data === []) {
            return $provider;
        }

        $data['updated_at'] = date('Y-m-d H:i:s');

        $this->providers->updateById((int) $provider['id'], $data);

        return $this->providers->find((int) $provider['id']) ?? [];
    }

    public function dashboard(int $providerId): array
    {
        $summarySql = 'SELECT
                        COUNT(DISTINCT t.id) AS total_tours,
                        SUM(CASE WHEN t.status = "active" THEN 1 ELSE 0 END) AS active_tours,
                        COUNT(DISTINCT b.id) AS total_bookings,
                        SUM(CASE WHEN b.booking_status = "pending" THEN 1 ELSE 0 END) AS new_bookings,
                        COALESCE(SUM(CASE WHEN b.payment_status = "paid" THEN b.total_amount ELSE 0 END), 0) AS total_revenue
                    FROM tours t
                    LEFT JOIN bookings b ON b.tour_id = t.id
                    WHERE t.provider_id = :provider_id';

        $stmt = $this->db->prepare($summarySql);
        $stmt->execute(['provider_id' => $providerId]);
        $summary = $stmt->fetch() ?: [];

        $chartSql = 'SELECT DATE_FORMAT(b.created_at, "%Y-%m") AS month_key, COUNT(*) AS total
                     FROM bookings b
                     INNER JOIN tours t ON t.id = b.tour_id
                     WHERE t.provider_id = :provider_id
                     GROUP BY DATE_FORMAT(b.created_at, "%Y-%m")
                     ORDER BY month_key ASC';

        $chartStmt = $this->db->prepare($chartSql);
        $chartStmt->execute(['provider_id' => $providerId]);
        $chart = $chartStmt->fetchAll();

        $topToursSql = 'SELECT t.id, t.title, COUNT(b.id) AS booking_count, COALESCE(SUM(b.total_amount),0) AS revenue
                        FROM tours t
                        LEFT JOIN bookings b ON b.tour_id = t.id
                        WHERE t.provider_id = :provider_id
                        GROUP BY t.id, t.title
                        ORDER BY booking_count DESC, revenue DESC
                        LIMIT 5';

        $topToursStmt = $this->db->prepare($topToursSql);
        $topToursStmt->execute(['provider_id' => $providerId]);

        return [
            'summary' => [
                'total_tours' => (int) ($summary['total_tours'] ?? 0),
                'active_tours' => (int) ($summary['active_tours'] ?? 0),
                'total_bookings' => (int) ($summary['total_bookings'] ?? 0),
                'new_bookings' => (int) ($summary['new_bookings'] ?? 0),
                'total_revenue' => (float) ($summary['total_revenue'] ?? 0),
            ],
            'booking_chart' => $chart,
            'top_tours' => $topToursStmt->fetchAll(),
        ];
    }

    public function tours(int $providerId, array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));

        return $this->tours->providerTours($providerId, $query, $page, $limit);
    }

    public function createTour(int $providerId, array $payload): array
    {
        $title = trim((string) ($payload['title'] ?? ''));
        $destination = trim((string) ($payload['destination'] ?? ''));
        $departure = trim((string) ($payload['departure_location'] ?? ''));
        $priceAdult = (float) ($payload['price_adult'] ?? 0);
        $status = (string) ($payload['status'] ?? 'draft');

        if ($title === '' || $destination === '' || $departure === '') {
            throw new ApiException('Thiếu thông tin tour bắt buộc.', 422, [
                'title' => ['Tên tour là bắt buộc.'],
                'destination' => ['Điểm đến là bắt buộc.'],
                'departure_location' => ['Điểm khởi hành là bắt buộc.'],
            ]);
        }

        if ($priceAdult <= 0) {
            throw new ApiException('Giá người lớn phải lớn hơn 0.', 422, [
                'price_adult' => ['Giá người lớn không hợp lệ.'],
            ]);
        }

        if (!in_array($status, ['draft', 'active', 'inactive', 'archived'], true)) {
            throw new ApiException('Trạng thái tour không hợp lệ.', 422, [
                'status' => ['Trạng thái tour không hợp lệ.'],
            ]);
        }

        $now = date('Y-m-d H:i:s');

        $id = $this->tours->create([
            'provider_id' => $providerId,
            'category_id' => (int) ($payload['category_id'] ?? 1),
            'title' => $title,
            'slug' => StrHelper::slug((string) ($title ?: 'tour-' . uniqid())),
            'destination' => $destination,
            'departure_location' => $departure,
            'duration_days' => (int) ($payload['duration_days'] ?? 1),
            'duration_nights' => (int) ($payload['duration_nights'] ?? 0),
            'price_adult' => $priceAdult,
            'price_child' => (float) ($payload['price_child'] ?? 0),
            'discount_price' => $payload['discount_price'] ?? null,
            'thumbnail' => $payload['thumbnail'] ?? null,
            'short_description' => $payload['short_description'] ?? null,
            'description' => $payload['description'] ?? null,
            'itinerary' => $payload['itinerary'] ?? null,
            'included_services' => $payload['included_services'] ?? null,
            'excluded_services' => $payload['excluded_services'] ?? null,
            'policy' => $payload['policy'] ?? null,
            'max_guests' => (int) ($payload['max_guests'] ?? 50),
            'available_slots' => (int) ($payload['available_slots'] ?? 50),
            'departure_date' => $payload['departure_date'] ?? null,
            'return_date' => $payload['return_date'] ?? null,
            'status' => $status,
            'is_featured' => !empty($payload['is_featured']) ? 1 : 0,
            'views_count' => 0,
            'bookings_count' => 0,
            'rating_avg' => 0,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return $this->tours->find($id) ?? [];
    }

    public function getTour(int $providerId, int $tourId): array
    {
        $tour = $this->tours->find($tourId);
        if (!$tour || (int) $tour['provider_id'] !== $providerId) {
            throw new ApiException('Không tìm thấy tour thuộc provider hiện tại.', 404);
        }

        return $tour;
    }

    public function updateTour(int $providerId, int $tourId, array $payload): array
    {
        $tour = $this->getTour($providerId, $tourId);

        $allowed = [
            'category_id', 'title', 'destination', 'departure_location', 'duration_days', 'duration_nights',
            'price_adult', 'price_child', 'discount_price', 'thumbnail', 'short_description', 'description',
            'itinerary', 'included_services', 'excluded_services', 'policy', 'max_guests', 'available_slots',
            'departure_date', 'return_date', 'status', 'is_featured'
        ];

        $data = [];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $payload)) {
                $data[$field] = $payload[$field];
            }
        }

        if (isset($data['title'])) {
            $data['slug'] = StrHelper::slug((string) $data['title']);
        }

        if ($data === []) {
            return $tour;
        }

        if (array_key_exists('price_adult', $data) && (float) $data['price_adult'] <= 0) {
            throw new ApiException('Giá người lớn phải lớn hơn 0.', 422, [
                'price_adult' => ['Giá người lớn không hợp lệ.'],
            ]);
        }

        if (array_key_exists('status', $data) && !in_array((string) $data['status'], ['draft', 'active', 'inactive', 'archived'], true)) {
            throw new ApiException('Trạng thái tour không hợp lệ.', 422, [
                'status' => ['Trạng thái tour không hợp lệ.'],
            ]);
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->tours->updateById($tourId, $data);

        return $this->tours->find($tourId) ?? [];
    }

    public function deleteTour(int $providerId, int $tourId): void
    {
        $this->getTour($providerId, $tourId);
        $this->tours->deleteById($tourId);
    }


    public function uploadTourImage(int $providerId, int $tourId, array $file, bool $setThumbnail = true): array
    {
        $tour = $this->getTour($providerId, $tourId);

        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error !== UPLOAD_ERR_OK) {
            throw new ApiException('Upload ảnh thất bại. Vui lòng thử lại.', 422);
        }

        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            throw new ApiException('File tải lên không hợp lệ.', 422);
        }

        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > 8 * 1024 * 1024) {
            throw new ApiException('Kích thước ảnh tối đa 8MB.', 422);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = strtolower((string) $finfo->file($tmp));
        $allowed = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (!isset($allowed[$mime])) {
            throw new ApiException('Định dạng ảnh chưa được hỗ trợ. Chỉ chấp nhận JPG/PNG/WEBP.', 422);
        }

        $ext = $allowed[$mime];
        $root = dirname(__DIR__, 2);
        $targetDir = $root . '/public/uploads/tours';
        if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
            throw new ApiException('Không thể tạo thư mục lưu ảnh.', 500);
        }

        $filename = 'tour-' . $tourId . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
        $targetFile = $targetDir . '/' . $filename;

        if (!move_uploaded_file($tmp, $targetFile)) {
            throw new ApiException('Không thể lưu file ảnh.', 500);
        }

        $scriptName = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? ''));
        $publicBase = rtrim(str_replace('/index.php', '', $scriptName), '/');
        if ($publicBase === '') {
            $publicBase = '/backend/public';
        }
        $imageUrl = $publicBase . '/uploads/tours/' . $filename;

        $sortStmt = $this->db->prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM tour_images WHERE tour_id = :tour_id');
        $sortStmt->execute(['tour_id' => $tourId]);
        $nextSort = (int) (($sortStmt->fetch()['max_sort'] ?? 0) + 1);

        $imageId = $this->tourImages->create([
            'tour_id' => $tourId,
            'image_url' => $imageUrl,
            'sort_order' => $nextSort,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        if ($setThumbnail || empty($tour['thumbnail'])) {
            $this->tours->updateById($tourId, [
                'thumbnail' => $imageUrl,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
        }

        return [
            'image' => $this->tourImages->find($imageId),
            'tour' => $this->tours->find($tourId),
        ];
    }
    public function bookings(int $providerId, array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));

        return $this->bookings->providerBookings($providerId, $query, $page, $limit);
    }

    public function bookingDetail(int $providerId, int $bookingId): array
    {
        $booking = $this->bookings->providerDetail($bookingId, $providerId);
        if (!$booking) {
            throw new ApiException('Không tìm thấy booking.', 404);
        }

        return $booking;
    }

    public function confirmBooking(int $providerId, int $bookingId): array
    {
        $booking = $this->bookingDetail($providerId, $bookingId);
        $currentStatus = (string) ($booking['booking_status'] ?? "");

        if ($currentStatus === 'cancelled') {
            throw new ApiException('Booking đã bị hủy, không thể xác nhận.', 422);
        }

        if ($currentStatus === 'completed') {
            throw new ApiException('Booking đã hoàn tất, không thể xác nhận lại.', 422);
        }

        if ($currentStatus === 'confirmed') {
            return $this->bookings->find((int) $booking['id']) ?? [];
        }

        $this->bookings->updateById((int) $booking['id'], [
            'booking_status' => 'confirmed',
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->bookings->find((int) $booking['id']) ?? [];
    }

    public function cancelBooking(int $providerId, int $bookingId): array
    {
        $booking = $this->bookingDetail($providerId, $bookingId);
        $currentStatus = (string) ($booking['booking_status'] ?? "");

        if ($currentStatus === 'cancelled') {
            return $this->bookings->find((int) $booking['id']) ?? [];
        }

        if ($currentStatus === 'completed') {
            throw new ApiException('Booking đã hoàn tất, không thể hủy.', 422);
        }

        $this->db->beginTransaction();
        try {
            $this->bookings->updateById((int) $booking['id'], [
                'booking_status' => 'cancelled',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            $this->tours->updateSlotsAndBookings((int) $booking['tour_id'], (int) $booking['total_guests'], -1);

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return $this->bookings->find((int) $booking['id']) ?? [];
    }


    public function listServices(int $providerId): array
    {
        $sql = 'SELECT ts.*, t.title AS tour_title
                FROM tour_services ts
                INNER JOIN tours t ON t.id = ts.tour_id
                WHERE t.provider_id = :provider_id
                ORDER BY ts.id DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['provider_id' => $providerId]);

        return $stmt->fetchAll();
    }

    public function createService(int $providerId, array $payload): array
    {
        $tour = $this->getTour($providerId, (int) ($payload['tour_id'] ?? 0));

        $id = $this->tourServices->create([
            'tour_id' => (int) $tour['id'],
            'service_name' => $payload['service_name'] ?? '',
            'service_type' => $payload['service_type'] ?? null,
            'description' => $payload['description'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->tourServices->find($id) ?? [];
    }

    public function updateService(int $providerId, int $serviceId, array $payload): array
    {
        $service = $this->tourServices->find($serviceId);
        if (!$service) {
            throw new ApiException('Không tìm thấy dịch vụ.', 404);
        }

        $this->getTour($providerId, (int) $service['tour_id']);

        $data = [];
        foreach (['service_name', 'service_type', 'description'] as $field) {
            if (array_key_exists($field, $payload)) {
                $data[$field] = $payload[$field];
            }
        }

        if ($data === []) {
            return $service;
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->tourServices->updateById($serviceId, $data);

        return $this->tourServices->find($serviceId) ?? [];
    }

    public function deleteService(int $providerId, int $serviceId): void
    {
        $service = $this->tourServices->find($serviceId);
        if (!$service) {
            throw new ApiException('Không tìm thấy dịch vụ.', 404);
        }

        $this->getTour($providerId, (int) $service['tour_id']);
        $this->tourServices->deleteById($serviceId);
    }

    public function promotions(int $providerId, array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));

        return $this->promotions->providerPromotions($providerId, $page, $limit, $query);
    }

    public function createPromotion(int $providerId, array $payload): array
    {
        $title = trim((string) ($payload['title'] ?? ''));
        $discountType = (string) ($payload['discount_type'] ?? 'percent');
        $discountValue = (float) ($payload['discount_value'] ?? 0);

        if ($title === '' || $discountValue <= 0) {
            throw new ApiException('Dữ liệu khuyến mãi không hợp lệ.', 422, [
                'title' => ['Tên chương trình là bắt buộc.'],
                'discount_value' => ['Giá trị giảm phải lớn hơn 0.'],
            ]);
        }

        if (!in_array($discountType, ['percent', 'fixed'], true)) {
            throw new ApiException('Loại giảm giá không hợp lệ.', 422, [
                'discount_type' => ['Loại giảm giá chỉ nhận percent hoặc fixed.'],
            ]);
        }

        $id = $this->promotions->create([
            'provider_id' => $providerId,
            'code' => strtoupper(trim((string) ($payload['code'] ?? 'PROMO' . random_int(1000, 9999)))),
            'title' => $title,
            'description' => $payload['description'] ?? null,
            'image_url' => $payload['image_url'] ?? null,
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
            'min_order_value' => $payload['min_order_value'] ?? null,
            'max_discount_value' => $payload['max_discount_value'] ?? null,
            'start_date' => $payload['start_date'] ?? date('Y-m-d H:i:s'),
            'end_date' => $payload['end_date'] ?? date('Y-m-d H:i:s', strtotime('+30 days')),
            'usage_limit' => $payload['usage_limit'] ?? null,
            'used_count' => 0,
            'status' => $payload['status'] ?? 'active',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->promotions->find($id) ?? [];
    }

    public function updatePromotion(int $providerId, int $promotionId, array $payload): array
    {
        $promo = $this->promotions->find($promotionId);
        if (!$promo || ((int) ($promo['provider_id'] ?? 0) !== $providerId && $promo['provider_id'] !== null)) {
            throw new ApiException('Không tìm thấy mã khuyến mãi.', 404);
        }

        $allowed = [
            'title', 'description', 'image_url', 'discount_type', 'discount_value', 'min_order_value',
            'max_discount_value', 'start_date', 'end_date', 'usage_limit', 'status'
        ];

        $data = [];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $payload)) {
                $data[$field] = $payload[$field];
            }
        }

        if ($data === []) {
            return $promo;
        }

        if (array_key_exists('discount_type', $data) && !in_array((string) $data['discount_type'], ['percent', 'fixed'], true)) {
            throw new ApiException('Loại giảm giá không hợp lệ.', 422, [
                'discount_type' => ['Loại giảm giá chỉ nhận percent hoặc fixed.'],
            ]);
        }

        if (array_key_exists('discount_value', $data) && (float) $data['discount_value'] <= 0) {
            throw new ApiException('Giá trị giảm phải lớn hơn 0.', 422, [
                'discount_value' => ['Giá trị giảm phải lớn hơn 0.'],
            ]);
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->promotions->updateById($promotionId, $data);

        return $this->promotions->find($promotionId) ?? [];
    }

    public function deletePromotion(int $providerId, int $promotionId): void
    {
        $promo = $this->promotions->find($promotionId);
        if (!$promo || ((int) ($promo['provider_id'] ?? 0) !== $providerId && $promo['provider_id'] !== null)) {
            throw new ApiException('Không tìm thấy mã khuyến mãi.', 404);
        }

        $this->promotions->deleteById($promotionId);
    }

    public function hideFeedback(int $providerId, int $commentId): array
    {
        $sql = 'SELECT c.*
                FROM comments c
                INNER JOIN tours t ON t.id = c.tour_id
                WHERE c.id = :comment_id AND t.provider_id = :provider_id
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'comment_id' => $commentId,
            'provider_id' => $providerId,
        ]);

        $comment = $stmt->fetch();
        if (!$comment) {
            throw new ApiException('Không tìm thấy phản hồi thuộc provider hiện tại.', 404);
        }

        $this->comments->updateById($commentId, [
            'status' => 'hidden',
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->comments->find($commentId) ?? [];
    }

    public function replyFeedback(int $providerId, int $commentId, string $message): array
    {
        $cleanMessage = trim($message);
        if ($cleanMessage === '') {
            throw new ApiException('Nội dung phản hồi không được để trống.', 422);
        }

        $sql = 'SELECT c.id, c.user_id, c.tour_id, t.title AS tour_title
                FROM comments c
                INNER JOIN tours t ON t.id = c.tour_id
                WHERE c.id = :comment_id AND t.provider_id = :provider_id
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'comment_id' => $commentId,
            'provider_id' => $providerId,
        ]);

        $comment = $stmt->fetch();
        if (!$comment) {
            throw new ApiException('Không tìm thấy phản hồi thuộc provider hiện tại.', 404);
        }

        $this->notifications->create([
            'user_id' => (int) $comment['user_id'],
            'title' => 'Phản hồi mới từ nhà cung cấp',
            'content' => 'Tour ' . ($comment['tour_title'] ?? '') . ': ' . $cleanMessage,
            'type' => 'provider_feedback_reply',
            'is_read' => 0,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return [
            'comment_id' => $commentId,
            'message' => $cleanMessage,
        ];
    }

    public function feedback(int $providerId, array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));

        $sql = 'SELECT c.id AS comment_id, c.content, c.status, c.created_at,
                       r.score, r.review,
                       u.full_name AS user_name,
                       t.id AS tour_id, t.title AS tour_title
                FROM tours t
                LEFT JOIN comments c ON c.tour_id = t.id
                LEFT JOIN ratings r ON r.tour_id = t.id AND (r.user_id = c.user_id OR c.user_id IS NULL)
                LEFT JOIN users u ON u.id = COALESCE(c.user_id, r.user_id)
                WHERE t.provider_id = :provider_id
                ORDER BY COALESCE(c.created_at, r.created_at) DESC';

        return $this->comments->paginate($sql, ['provider_id' => $providerId], $page, $limit);
    }
}


