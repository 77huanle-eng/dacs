<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Request;
use App\Models\Provider;
use App\Services\MediaUploadService;
use App\Services\ProviderService;

class ProviderController extends Controller
{
    private ProviderService $service;
    private Provider $providers;
    private MediaUploadService $mediaUpload;

    public function __construct()
    {
        $this->service = new ProviderService();
        $this->providers = new Provider();
        $this->mediaUpload = new MediaUploadService();
    }

    public function requestProvider(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $payload = $request->input();
        $this->validatePayload($payload, [
            'company_name' => 'required|string|min:2|max:160',
            'contact_email' => 'email|max:180',
            'contact_phone' => 'phone|max:30',
            'address' => 'max:255',
            'tax_code' => 'max:80',
            'description' => 'max:2000',
        ], 'Dữ liệu đăng ký provider không hợp lệ.');

        $data = $this->service->submitRequest((int) $user['id'], $payload);
        $this->created($data, 'Đã gửi yêu cầu đăng ký provider.');
    }

    public function latestRequest(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $data = $this->service->latestRequest((int) $user['id']);
        $this->ok($data, 'Lấy trạng thái yêu cầu provider thành công.');
    }

    public function profile(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $data = $this->providers->find($providerId);
        $this->ok($data, 'Lấy hồ sơ provider thành công.');
    }

    public function updateProfile(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'company_name' => 'string|min:2|max:160',
            'contact_email' => 'email|max:180',
            'contact_phone' => 'phone|max:30',
            'address' => 'max:255',
            'tax_code' => 'max:80',
            'status' => 'in:pending,active,inactive,rejected',
            'description' => 'max:2000',
            'support_policy' => 'max:2000',
        ], 'Dữ liệu hồ sơ provider không hợp lệ.');

        $user = $request->attribute('auth_user');
        $role = strtolower((string) ($user['role_name'] ?? 'provider'));

        if ($role === 'provider') {
            $data = $this->service->updateProfile((int) $user['id'], $payload);
        } else {
            $providerId = $this->resolveProviderId($request);
            $provider = $this->providers->find($providerId);
            if (!$provider) {
                throw new ApiException('Không tìm thấy provider.', 404);
            }

            $cleanPayload = $this->sanitizeProviderPayload($payload, $provider);
            if ($cleanPayload !== []) {
                $cleanPayload['updated_at'] = date('Y-m-d H:i:s');
                $this->providers->updateById($providerId, $cleanPayload);
            }

            $data = $this->providers->find($providerId);
        }

        $this->ok($data, 'Cập nhật hồ sơ provider thành công.');
    }

    public function dashboard(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $data = $this->service->dashboard($providerId);
        $this->ok($data, 'Lấy dashboard provider thành công.');
    }

    public function tours(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $result = $this->service->tours($providerId, $request->query());
        $this->ok($result['items'], 'Lấy danh sách tour provider thành công.', $result['meta']);
    }

    public function createTour(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'title' => 'required|string|min:3|max:180',
            'category_id' => 'required|integer',
            'destination' => 'required|string|min:2|max:180',
            'departure_location' => 'required|string|min:2|max:180',
            'duration_days' => 'required|integer|min_num:1|max_num:30',
            'duration_nights' => 'integer|min_num:0|max_num:29',
            'price_adult' => 'required|numeric|min_num:1',
            'price_child' => 'numeric|min_num:0',
            'max_guests' => 'integer|min_num:1|max_num:500',
            'available_slots' => 'integer|min_num:0|max_num:500',
            'status' => 'in:draft,active,inactive,archived',
            'departure_date' => 'date',
            'return_date' => 'date|after_or_equal:departure_date',
            'short_description' => 'max:500',
            'description' => 'max:10000',
            'itinerary' => 'max:20000',
            'included_services' => 'max:4000',
            'excluded_services' => 'max:4000',
            'policy' => 'max:4000',
        ], 'Dữ liệu tour provider không hợp lệ.');

        $providerId = $this->resolveProviderId($request);
        $data = $this->service->createTour($providerId, $payload);
        $this->created($data, 'Tạo tour mới thành công.');
    }

    public function getTour(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $data = $this->service->getTour($providerId, (int) ($params['id'] ?? 0));
        $this->ok($data, 'Lấy chi tiết tour thành công.');
    }

    public function updateTour(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'title' => 'string|min:3|max:180',
            'category_id' => 'integer',
            'destination' => 'string|min:2|max:180',
            'departure_location' => 'string|min:2|max:180',
            'duration_days' => 'integer|min_num:1|max_num:30',
            'duration_nights' => 'integer|min_num:0|max_num:29',
            'price_adult' => 'numeric|min_num:1',
            'price_child' => 'numeric|min_num:0',
            'max_guests' => 'integer|min_num:1|max_num:500',
            'available_slots' => 'integer|min_num:0|max_num:500',
            'status' => 'in:draft,active,inactive,archived',
            'departure_date' => 'date',
            'return_date' => 'date|after_or_equal:departure_date',
            'short_description' => 'max:500',
            'description' => 'max:10000',
            'itinerary' => 'max:20000',
            'included_services' => 'max:4000',
            'excluded_services' => 'max:4000',
            'policy' => 'max:4000',
        ], 'Dữ liệu cập nhật tour không hợp lệ.');

        $providerId = $this->resolveProviderId($request);
        $data = $this->service->updateTour($providerId, (int) ($params['id'] ?? 0), $payload);
        $this->ok($data, 'Cập nhật tour thành công.');
    }

    public function deleteTour(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $this->service->deleteTour($providerId, (int) ($params['id'] ?? 0));
        $this->ok(null, 'Xóa tour thành công.');
    }

    public function uploadTourImage(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $tourId = (int) ($params['id'] ?? 0);
        $file = $request->file('image');

        if (!$file) {
            throw new ApiException('Vui lòng chọn file ảnh để tải lên.', 422);
        }

        $setThumbnail = filter_var($request->input('set_thumbnail', true), FILTER_VALIDATE_BOOL);
        $data = $this->service->uploadTourImage($providerId, $tourId, $file, $setThumbnail);
        $this->created($data, 'Tải ảnh tour thành công.');
    }

    public function bookings(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $result = $this->service->bookings($providerId, $request->query());
        $this->ok($result['items'], 'Lấy booking provider thành công.', $result['meta']);
    }

    public function bookingDetail(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $data = $this->service->bookingDetail($providerId, (int) ($params['id'] ?? 0));
        $this->ok($data, 'Lấy chi tiết booking thành công.');
    }

    public function bookingConfirm(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $data = $this->service->confirmBooking($providerId, (int) ($params['id'] ?? 0));
        $this->ok($data, 'Xác nhận booking thành công.');
    }

    public function bookingCancel(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $data = $this->service->cancelBooking($providerId, (int) ($params['id'] ?? 0));
        $this->ok($data, 'Hủy booking thành công.');
    }

    public function services(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $data = $this->service->listServices($providerId);
        $this->ok($data, 'Lấy danh sách dịch vụ thành công.');
    }

    public function createService(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'tour_id' => 'required|integer',
            'service_name' => 'required|string|min:2|max:180',
            'service_type' => 'max:80',
            'description' => 'max:1000',
        ], 'Dữ liệu dịch vụ không hợp lệ.');

        $providerId = $this->resolveProviderId($request);
        $data = $this->service->createService($providerId, $payload);
        $this->created($data, 'Tạo dịch vụ thành công.');
    }

    public function updateService(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'service_name' => 'string|min:2|max:180',
            'service_type' => 'max:80',
            'description' => 'max:1000',
        ], 'Dữ liệu cập nhật dịch vụ không hợp lệ.');

        $providerId = $this->resolveProviderId($request);
        $data = $this->service->updateService($providerId, (int) ($params['id'] ?? 0), $payload);
        $this->ok($data, 'Cập nhật dịch vụ thành công.');
    }

    public function deleteService(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $this->service->deleteService($providerId, (int) ($params['id'] ?? 0));
        $this->ok(null, 'Xóa dịch vụ thành công.');
    }

    public function promotions(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $result = $this->service->promotions($providerId, $request->query());
        $this->ok($result['items'], 'Lấy danh sách khuyến mãi thành công.', $result['meta']);
    }

    public function createPromotion(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'title' => 'required|string|min:3|max:180',
            'code' => 'max:80',
            'discount_type' => 'required|in:percent,fixed',
            'discount_value' => 'required|numeric|min_num:1',
            'min_order_value' => 'numeric|min_num:0',
            'max_discount_value' => 'numeric|min_num:0',
            'usage_limit' => 'integer|min_num:0',
            'status' => 'in:active,inactive,expired',
            'start_date' => 'date',
            'end_date' => 'date|after_or_equal:start_date',
            'description' => 'max:2000',
            'image_url' => 'max:255',
        ], 'Dữ liệu khuyến mãi không hợp lệ.');

        $providerId = $this->resolveProviderId($request);
        $data = $this->service->createPromotion($providerId, $payload);
        $this->created($data, 'Tạo mã khuyến mãi thành công.');
    }

    public function updatePromotion(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'title' => 'string|min:3|max:180',
            'code' => 'max:80',
            'discount_type' => 'in:percent,fixed',
            'discount_value' => 'numeric|min_num:1',
            'min_order_value' => 'numeric|min_num:0',
            'max_discount_value' => 'numeric|min_num:0',
            'usage_limit' => 'integer|min_num:0',
            'status' => 'in:active,inactive,expired',
            'start_date' => 'date',
            'end_date' => 'date|after_or_equal:start_date',
            'description' => 'max:2000',
            'image_url' => 'max:255',
        ], 'Dữ liệu cập nhật khuyến mãi không hợp lệ.');

        $providerId = $this->resolveProviderId($request);
        $data = $this->service->updatePromotion($providerId, (int) ($params['id'] ?? 0), $payload);
        $this->ok($data, 'Cập nhật khuyến mãi thành công.');
    }

    public function deletePromotion(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $this->service->deletePromotion($providerId, (int) ($params['id'] ?? 0));
        $this->ok(null, 'Xóa khuyến mãi thành công.');
    }

    public function uploadPromotionImage(Request $request, array $params): void
    {
        $this->resolveProviderId($request);
        $file = $request->file('image');
        if (!$file) {
            throw new ApiException('Vui lòng chọn ảnh khuyến mãi để tải lên.', 422);
        }

        $url = $this->mediaUpload->uploadImage($file, 'promotions', 8);
        $this->created(['url' => $url], 'Tải ảnh khuyến mãi thành công.');
    }


    public function hideFeedback(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $commentId = (int) ($params['id'] ?? 0);
        $data = $this->service->hideFeedback($providerId, $commentId);
        $this->ok($data, 'Đã ẩn phản hồi khách hàng.');
    }

    public function replyFeedback(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'message' => 'required|min:3|max:1000',
        ], 'Nội dung phản hồi không hợp lệ.');

        $providerId = $this->resolveProviderId($request);
        $commentId = (int) ($params['id'] ?? 0);
        $message = (string) ($payload['message'] ?? '');
        $data = $this->service->replyFeedback($providerId, $commentId, $message);
        $this->ok($data, 'Đã gửi phản hồi cho khách hàng.');
    }
    public function feedback(Request $request, array $params): void
    {
        $providerId = $this->resolveProviderId($request);
        $result = $this->service->feedback($providerId, $request->query());
        $this->ok($result['items'], 'Lấy phản hồi khách hàng thành công.', $result['meta']);
    }

    private function sanitizeProviderPayload(array $payload, array $provider = []): array
    {
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

        $clean = [];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $payload)) {
                $clean[$field] = $payload[$field];
            }
        }

        return $clean;
    }
    private function resolveProviderId(Request $request): int
    {
        $user = $request->attribute('auth_user');
        $role = strtolower((string) ($user['role_name'] ?? ''));

        if ($role === 'provider') {
            $provider = $this->providers->findByUserId((int) $user['id']);
            if (!$provider) {
                throw new ApiException('Tài khoản chưa có hồ sơ provider.', 404);
            }

            return (int) $provider['id'];
        }

        $providerId = (int) ($request->query('provider_id') ?? $request->input('provider_id') ?? 0);

        if ($providerId <= 0) {
            throw new ApiException('Thiếu provider_id cho thao tác này.', 422, [
                'provider_id' => ['Vui lòng chỉ định provider_id hợp lệ.'],
            ]);
        }

        if (!$this->providers->find($providerId)) {
            throw new ApiException('Không tìm thấy provider.', 404);
        }

        return $providerId;
    }

}



