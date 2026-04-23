<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Request;
use App\Services\AdminService;
use App\Services\MediaUploadService;

class AdminController extends Controller
{
    private AdminService $admin;
    private MediaUploadService $mediaUpload;

    public function __construct()
    {
        $this->admin = new AdminService();
        $this->mediaUpload = new MediaUploadService();
    }

    public function dashboard(Request $request, array $params): void
    {
        $this->ok($this->admin->dashboard(), 'Lấy dashboard admin thành công.');
    }

    public function stats(Request $request, array $params): void
    {
        $this->ok($this->admin->stats(), 'Lấy thống kê hệ thống thành công.');
    }

    public function users(Request $request, array $params): void
    {
        $result = $this->admin->users($request->query());
        $this->ok($result['items'], 'Lấy danh sách users thành công.', $result['meta']);
    }

    public function createUser(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'role_id' => 'required|integer',
            'full_name' => 'required|string|min:2|max:120',
            'email' => 'required|email|max:180',
            'password' => 'required|string|min:6|max:255',
            'status' => 'in:active,inactive,blocked',
            'phone' => 'phone|max:30',
        ], 'Dữ liệu người dùng không hợp lệ.');

        $this->created($this->admin->createUser($payload), 'Tạo user thành công.');
    }

    public function getUser(Request $request, array $params): void
    {
        $this->ok($this->admin->getUser($this->routeId($params)), 'Lấy user thành công.');
    }

    public function updateUser(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'role_id' => 'integer',
            'full_name' => 'string|min:2|max:120',
            'email' => 'email|max:180',
            'password' => 'string|min:6|max:255',
            'status' => 'in:active,inactive,blocked',
            'phone' => 'phone|max:30',
        ], 'Dữ liệu cập nhật người dùng không hợp lệ.');

        $this->ok($this->admin->updateUser($this->routeId($params), $payload), 'Cập nhật user thành công.');
    }

    public function deleteUser(Request $request, array $params): void
    {
        $this->admin->deleteUser($this->routeId($params));
        $this->ok(null, 'Xóa user thành công.');
    }

    public function roles(Request $request, array $params): void
    {
        $this->ok($this->admin->roles(), 'Lấy danh sách roles thành công.');
    }

    public function createRole(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'name' => 'required|string|min:2|max:50',
            'description' => 'string|max:255',
        ], 'Dữ liệu vai trò không hợp lệ.');

        $this->created($this->admin->createRole($payload), 'Tạo role thành công.');
    }

    public function updateRole(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'name' => 'string|min:2|max:50',
            'description' => 'string|max:255',
        ], 'Dữ liệu cập nhật vai trò không hợp lệ.');

        $this->ok($this->admin->updateRole($this->routeId($params), $payload), 'Cập nhật role thành công.');
    }

    public function deleteRole(Request $request, array $params): void
    {
        $this->admin->deleteRole($this->routeId($params));
        $this->ok(null, 'Xóa role thành công.');
    }

    public function tours(Request $request, array $params): void
    {
        $result = $this->admin->tours($request->query());
        $this->ok($result['items'], 'Lấy danh sách tours thành công.', $result['meta']);
    }

    public function createTour(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'provider_id' => 'required|integer',
            'category_id' => 'required|integer',
            'title' => 'required|string|min:3|max:180',
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
        ], 'Dữ liệu tour không hợp lệ.');

        $this->created($this->admin->createTour($payload), 'Tạo tour thành công.');
    }

    public function getTour(Request $request, array $params): void
    {
        $this->ok($this->admin->getTour($this->routeId($params)), 'Lấy chi tiết tour thành công.');
    }

    public function updateTour(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'provider_id' => 'integer',
            'category_id' => 'integer',
            'title' => 'string|min:3|max:180',
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

        $this->ok($this->admin->updateTour($this->routeId($params), $payload), 'Cập nhật tour thành công.');
    }

    public function deleteTour(Request $request, array $params): void
    {
        $this->admin->deleteTour($this->routeId($params));
        $this->ok(null, 'Xóa tour thành công.');
    }

    public function categories(Request $request, array $params): void
    {
        $result = $this->admin->categories($request->query());
        $this->ok($result['items'], 'Lấy danh sách categories thành công.', $result['meta']);
    }

    public function createCategory(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'name' => 'required|string|min:2|max:120',
            'description' => 'max:2000',
            'status' => 'in:active,inactive',
        ], 'Dữ liệu danh mục không hợp lệ.');

        $this->created($this->admin->createCategory($payload), 'Tạo category thành công.');
    }

    public function updateCategory(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'name' => 'string|min:2|max:120',
            'description' => 'max:2000',
            'status' => 'in:active,inactive',
        ], 'Dữ liệu cập nhật danh mục không hợp lệ.');

        $this->ok($this->admin->updateCategory($this->routeId($params), $payload), 'Cập nhật category thành công.');
    }

    public function deleteCategory(Request $request, array $params): void
    {
        $this->admin->deleteCategory($this->routeId($params));
        $this->ok(null, 'Xóa category thành công.');
    }

    public function bookings(Request $request, array $params): void
    {
        $result = $this->admin->bookings($request->query());
        $this->ok($result['items'], 'Lấy danh sách bookings thành công.', $result['meta']);
    }

    public function bookingDetail(Request $request, array $params): void
    {
        $this->ok($this->admin->bookingDetail($this->routeId($params)), 'Lấy chi tiết booking thành công.');
    }

    public function updateBooking(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'booking_status' => 'in:pending,confirmed,completed,cancelled',
            'payment_status' => 'in:unpaid,pending,paid,failed,refunded',
            'note' => 'string|max:2000',
        ], 'Dữ liệu booking không hợp lệ.');

        $this->ok($this->admin->updateBooking($this->routeId($params), $payload), 'Cập nhật booking thành công.');
    }

    public function payments(Request $request, array $params): void
    {
        $result = $this->admin->payments($request->query());
        $this->ok($result['items'], 'Lấy danh sách payments thành công.', $result['meta']);
    }

    public function paymentDetail(Request $request, array $params): void
    {
        $this->ok($this->admin->paymentDetail($this->routeId($params)), 'Lấy chi tiết payment thành công.');
    }

    public function updatePayment(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'payment_status' => 'in:pending,paid,failed,refunded',
            'transaction_code' => 'string|max:120',
            'payment_method' => 'string|max:60',
        ], 'Dữ liệu giao dịch không hợp lệ.');

        $this->ok($this->admin->updatePayment($this->routeId($params), $payload), 'Cập nhật payment thành công.');
    }

    public function invoices(Request $request, array $params): void
    {
        $result = $this->admin->invoices($request->query());
        $this->ok($result['items'], 'Lấy danh sách invoices thành công.', $result['meta']);
    }

    public function invoiceDetail(Request $request, array $params): void
    {
        $this->ok($this->admin->invoiceDetail($this->routeId($params)), 'Lấy chi tiết invoice thành công.');
    }

    public function posts(Request $request, array $params): void
    {
        $result = $this->admin->posts($request->query());
        $this->ok($result['items'], 'Lấy danh sách posts thành công.', $result['meta']);
    }

    public function createPost(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'title' => 'required|string|min:3|max:220',
            'excerpt' => 'required|string|max:400',
            'content' => 'required|string|max:40000',
            'thumbnail' => 'string|max:255',
            'category' => 'string|max:120',
            'tags' => 'array',
            'gallery' => 'array',
            'meta_title' => 'string|max:255',
            'meta_description' => 'string|max:400',
            'status' => 'in:draft,published,archived',
        ], 'Dữ liệu bài viết không hợp lệ.');

        $user = $request->attribute('auth_user');
        $this->created($this->admin->createPost((int) $user['id'], $payload), 'Tạo post thành công.');
    }

    public function updatePost(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'title' => 'string|min:3|max:220',
            'excerpt' => 'string|max:400',
            'content' => 'string|max:40000',
            'thumbnail' => 'string|max:255',
            'category' => 'string|max:120',
            'tags' => 'array',
            'gallery' => 'array',
            'meta_title' => 'string|max:255',
            'meta_description' => 'string|max:400',
            'status' => 'in:draft,published,archived',
        ], 'Dữ liệu cập nhật bài viết không hợp lệ.');

        $this->ok($this->admin->updatePost($this->routeId($params), $payload), 'Cập nhật post thành công.');
    }

    public function deletePost(Request $request, array $params): void
    {
        $this->admin->deletePost($this->routeId($params));
        $this->ok(null, 'Xóa post thành công.');
    }

    public function uploadPostImage(Request $request, array $params): void
    {
        $file = $request->file('image');
        $this->validateUploadedImage($file, 'ảnh bài viết', 8);

        $url = $this->mediaUpload->uploadImage($file, 'posts', 8);
        $this->created(['url' => $url], 'Tải ảnh bài viết thành công.');
    }

    public function promotions(Request $request, array $params): void
    {
        $result = $this->admin->promotions($request->query());
        $this->ok($result['items'], 'Lấy danh sách promotions thành công.', $result['meta']);
    }

    public function createPromotion(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'provider_id' => 'integer',
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
            'description' => 'string|max:2000',
            'image_url' => 'string|max:255',
        ], 'Dữ liệu khuyến mãi không hợp lệ.');

        $this->created($this->admin->createPromotion($payload), 'Tạo promotion thành công.');
    }

    public function updatePromotion(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'provider_id' => 'integer',
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
            'description' => 'string|max:2000',
            'image_url' => 'string|max:255',
        ], 'Dữ liệu cập nhật khuyến mãi không hợp lệ.');

        $this->ok($this->admin->updatePromotion($this->routeId($params), $payload), 'Cập nhật promotion thành công.');
    }

    public function deletePromotion(Request $request, array $params): void
    {
        $this->admin->deletePromotion($this->routeId($params));
        $this->ok(null, 'Xóa promotion thành công.');
    }

    public function uploadPromotionImage(Request $request, array $params): void
    {
        $file = $request->file('image');
        $this->validateUploadedImage($file, 'ảnh khuyến mãi', 8);

        $url = $this->mediaUpload->uploadImage($file, 'promotions', 8);
        $this->created(['url' => $url], 'Tải ảnh khuyến mãi thành công.');
    }

    public function providers(Request $request, array $params): void
    {
        $result = $this->admin->providers($request->query());
        $this->ok($result['items'], 'Lấy danh sách providers thành công.', $result['meta']);
    }

    public function providerDetail(Request $request, array $params): void
    {
        $this->ok($this->admin->providerDetail($this->routeId($params)), 'Lấy chi tiết provider thành công.');
    }

    public function providerApprove(Request $request, array $params): void
    {
        $note = (string) ($request->input('admin_note') ?? '');
        $this->ok($this->admin->approveProvider($this->routeId($params), $note), 'Duyệt provider thành công.');
    }

    public function providerReject(Request $request, array $params): void
    {
        $note = (string) ($request->input('admin_note') ?? '');
        $this->ok($this->admin->rejectProvider($this->routeId($params), $note), 'Từ chối provider thành công.');
    }

    public function providerRequests(Request $request, array $params): void
    {
        $result = $this->admin->providerRequests($request->query());
        $this->ok($result['items'], 'Lấy danh sách yêu cầu provider thành công.', $result['meta']);
    }

    public function providerRequestApprove(Request $request, array $params): void
    {
        $this->validatePayload($request->input(), [
            'admin_note' => 'string|max:2000',
        ], 'Ghi chú duyệt provider request không hợp lệ.');
        $note = (string) ($request->input('admin_note') ?? '');
        $this->ok($this->admin->approveProviderRequest($this->routeId($params), $note), 'Duyệt yêu cầu provider thành công.');
    }

    public function providerRequestReject(Request $request, array $params): void
    {
        $this->validatePayload($request->input(), [
            'admin_note' => 'string|max:2000',
        ], 'Ghi chú từ chối provider request không hợp lệ.');
        $note = (string) ($request->input('admin_note') ?? '');
        $this->ok($this->admin->rejectProviderRequest($this->routeId($params), $note), 'Từ chối yêu cầu provider thành công.');
    }

    public function comments(Request $request, array $params): void
    {
        $result = $this->admin->comments($request->query());
        $this->ok($result['items'], 'Lấy danh sách comments thành công.', $result['meta']);
    }

    public function hideComment(Request $request, array $params): void
    {
        $this->ok($this->admin->hideComment($this->routeId($params)), 'Ẩn bình luận thành công.');
    }

    public function deleteComment(Request $request, array $params): void
    {
        $this->admin->deleteComment($this->routeId($params));
        $this->ok(null, 'Xóa bình luận thành công.');
    }
}
