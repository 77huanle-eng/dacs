<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\ApiException;
use App\Core\Database;
use App\Helpers\StrHelper;
use App\Models\Booking;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Post;
use App\Models\Promotion;
use App\Models\Provider;
use App\Models\ProviderRequest;
use App\Models\Rating;
use App\Models\Role;
use App\Models\Tour;
use App\Models\User;
use PDO;

class AdminService
{
    private PDO $db;
    private User $users;
    private Role $roles;
    private Tour $tours;
    private Category $categories;
    private Booking $bookings;
    private Payment $payments;
    private Invoice $invoices;
    private Post $posts;
    private Promotion $promotions;
    private Provider $providers;
    private ProviderRequest $providerRequests;
    private Comment $comments;
    private Rating $ratings;
    private ?array $postColumns = null;

    public function __construct()
    {
        $this->db = Database::connection();
        $this->users = new User();
        $this->roles = new Role();
        $this->tours = new Tour();
        $this->categories = new Category();
        $this->bookings = new Booking();
        $this->payments = new Payment();
        $this->invoices = new Invoice();
        $this->posts = new Post();
        $this->promotions = new Promotion();
        $this->providers = new Provider();
        $this->providerRequests = new ProviderRequest();
        $this->comments = new Comment();
        $this->ratings = new Rating();
    }

    public function dashboard(): array
    {
        $summary = [
            'total_users' => $this->count('users'),
            'total_providers' => $this->count('providers'),
            'total_tours' => $this->count('tours'),
            'total_bookings' => $this->count('bookings'),
            'total_revenue' => $this->sum('bookings', 'total_amount', 'payment_status = "paid"'),
        ];

        $recentBookings = $this->db->query('SELECT b.id, b.booking_code, b.total_amount, b.booking_status, b.payment_status, b.created_at, t.title AS tour_title
                                            FROM bookings b
                                            INNER JOIN tours t ON t.id = b.tour_id
                                            ORDER BY b.id DESC
                                            LIMIT 8')->fetchAll();

        $pendingProviders = $this->providerRequests->paginateRequests(['status' => 'pending'], 1, 8)['items'];

        $revenueChart = $this->db->query('SELECT DATE_FORMAT(created_at, "%Y-%m") AS month_key, COALESCE(SUM(total_amount),0) AS revenue
                                          FROM bookings
                                          WHERE payment_status = "paid"
                                          GROUP BY DATE_FORMAT(created_at, "%Y-%m")
                                          ORDER BY month_key ASC')->fetchAll();

        $categoryChart = $this->db->query('SELECT c.name AS category_name, COUNT(t.id) AS total
                                           FROM categories c
                                           LEFT JOIN tours t ON t.category_id = c.id
                                           GROUP BY c.id, c.name
                                           ORDER BY total DESC')->fetchAll();

        return [
            'summary' => $summary,
            'recent_bookings' => $recentBookings,
            'pending_providers' => $pendingProviders,
            'revenue_chart' => $revenueChart,
            'category_chart' => $categoryChart,
        ];
    }

    public function stats(): array
    {
        $userGrowth = $this->db->query('SELECT DATE_FORMAT(created_at, "%Y-%m") AS month_key, COUNT(*) AS total
                                        FROM users
                                        GROUP BY DATE_FORMAT(created_at, "%Y-%m")
                                        ORDER BY month_key ASC')->fetchAll();

        $bookingRegion = $this->db->query('SELECT t.destination, COUNT(b.id) AS total
                                           FROM bookings b
                                           INNER JOIN tours t ON t.id = b.tour_id
                                           GROUP BY t.destination
                                           ORDER BY total DESC
                                           LIMIT 10')->fetchAll();

        $topTours = $this->db->query('SELECT t.id, t.title, t.views_count, t.bookings_count,
                                             COALESCE(SUM(CASE WHEN b.payment_status = "paid" THEN b.total_amount ELSE 0 END), 0) AS revenue
                                      FROM tours t
                                      LEFT JOIN bookings b ON b.tour_id = t.id
                                      GROUP BY t.id, t.title, t.views_count, t.bookings_count
                                      ORDER BY t.bookings_count DESC, revenue DESC
                                      LIMIT 10')->fetchAll();

        return [
            'user_growth' => $userGrowth,
            'booking_region' => $bookingRegion,
            'top_tours' => $topTours,
        ];
    }

    public function users(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));
        return $this->users->paginateList($query, $page, $limit);
    }

    public function getUser(int $id): array
    {
        $sql = 'SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at, u.updated_at, r.name AS role_name
                FROM users u
                INNER JOIN roles r ON r.id = u.role_id
                WHERE u.id = :id
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new ApiException('Không tìm thấy user.', 404);
        }

        return $user;
    }

    public function createUser(array $payload): array
    {
        $roleId = (int) ($payload['role_id'] ?? 0);
        if ($roleId <= 0 || !$this->roles->find($roleId)) {
            throw new ApiException('role_id không hợp lệ.', 422);
        }

        $fullName = trim((string) ($payload['full_name'] ?? ''));
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $password = (string) ($payload['password'] ?? '');
        $status = (string) ($payload['status'] ?? 'active');

        if ($fullName === '' || strlen($fullName) < 2) {
            throw new ApiException('Họ tên không hợp lệ.', 422, [
                'full_name' => ['Họ tên tối thiểu 2 ký tự.'],
            ]);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ApiException('Email không đúng định dạng.', 422, [
                'email' => ['Email không đúng định dạng.'],
            ]);
        }

        if (strlen($password) < 6) {
            throw new ApiException('Mật khẩu tối thiểu 6 ký tự.', 422, [
                'password' => ['Mật khẩu tối thiểu 6 ký tự.'],
            ]);
        }

        if (!in_array($status, ['active', 'inactive', 'blocked'], true)) {
            throw new ApiException('Trạng thái tài khoản không hợp lệ.', 422, [
                'status' => ['Trạng thái tài khoản không hợp lệ.'],
            ]);
        }

        $id = $this->users->create([
            'role_id' => $roleId,
            'full_name' => $fullName,
            'email' => $email,
            'phone' => $payload['phone'] ?? null,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'avatar' => $payload['avatar'] ?? null,
            'status' => $status,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->users->find($id) ?? [];
    }

    public function updateUser(int $id, array $payload): array
    {
        $user = $this->users->find($id);
        if (!$user) {
            throw new ApiException('Không tìm thấy user.', 404);
        }

        $allowed = ['role_id', 'full_name', 'email', 'phone', 'avatar', 'status'];
        $data = [];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $payload)) {
                $data[$field] = $payload[$field];
            }
        }

        if (!empty($payload['password'])) {
            $data['password_hash'] = password_hash((string) $payload['password'], PASSWORD_DEFAULT);
        }

        if ($data === []) {
            return $user;
        }

        if (isset($data['email']) && !filter_var((string) $data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new ApiException('Email không đúng định dạng.', 422, [
                'email' => ['Email không đúng định dạng.'],
            ]);
        }

        if (isset($data['status']) && !in_array((string) $data['status'], ['active', 'inactive', 'blocked'], true)) {
            throw new ApiException('Trạng thái tài khoản không hợp lệ.', 422, [
                'status' => ['Trạng thái tài khoản không hợp lệ.'],
            ]);
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->users->updateById($id, $data);

        return $this->users->find($id) ?? [];
    }

    public function deleteUser(int $id): void
    {
        $this->users->deleteById($id);
    }

    public function roles(): array
    {
        return $this->roles->all([], 'id ASC');
    }

    public function createRole(array $payload): array
    {
        $id = $this->roles->create([
            'name' => strtolower(trim((string) ($payload['name'] ?? ''))),
            'description' => $payload['description'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->roles->find($id) ?? [];
    }

    public function updateRole(int $id, array $payload): array
    {
        $role = $this->roles->find($id);
        if (!$role) {
            throw new ApiException('Không tìm thấy role.', 404);
        }

        $data = [];
        foreach (['name', 'description'] as $field) {
            if (array_key_exists($field, $payload)) {
                $data[$field] = $payload[$field];
            }
        }

        if ($data === []) {
            return $role;
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->roles->updateById($id, $data);

        return $this->roles->find($id) ?? [];
    }

    public function deleteRole(int $id): void
    {
        $this->roles->deleteById($id);
    }

    public function tours(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));

        return $this->tours->paginatePublic($query, $page, $limit);
    }

    public function createTour(array $payload): array
    {
        $title = trim((string) ($payload['title'] ?? ''));
        $destination = trim((string) ($payload['destination'] ?? ''));
        $departure = trim((string) ($payload['departure_location'] ?? ''));
        $priceAdult = (float) ($payload['price_adult'] ?? 0);
        $status = (string) ($payload['status'] ?? 'draft');

        if ($title === '' || $destination === '' || $departure === '' || $priceAdult <= 0) {
            throw new ApiException('Dữ liệu tour không hợp lệ.', 422, [
                'title' => ['Tên tour là bắt buộc.'],
                'destination' => ['Điểm đến là bắt buộc.'],
                'departure_location' => ['Điểm khởi hành là bắt buộc.'],
                'price_adult' => ['Giá người lớn phải lớn hơn 0.'],
            ]);
        }

        if (!in_array($status, ['draft', 'active', 'inactive', 'archived'], true)) {
            throw new ApiException('Trạng thái tour không hợp lệ.', 422, [
                'status' => ['Trạng thái tour không hợp lệ.'],
            ]);
        }

        $id = $this->tours->create([
            'provider_id' => (int) ($payload['provider_id'] ?? 1),
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
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->tours->find($id) ?? [];
    }

    public function getTour(int $id): array
    {
        $tour = $this->tours->find($id);
        if (!$tour) {
            throw new ApiException('Không tìm thấy tour.', 404);
        }

        return $tour;
    }

    public function updateTour(int $id, array $payload): array
    {
        $tour = $this->tours->find($id);
        if (!$tour) {
            throw new ApiException('Không tìm thấy tour.', 404);
        }

        $data = [];
        foreach ([
                     'provider_id', 'category_id', 'title', 'destination', 'departure_location', 'duration_days',
                     'duration_nights', 'price_adult', 'price_child', 'discount_price', 'thumbnail',
                     'short_description', 'description', 'itinerary', 'included_services', 'excluded_services',
                     'policy', 'max_guests', 'available_slots', 'departure_date', 'return_date', 'status',
                     'is_featured', 'rating_avg'
                 ] as $field) {
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
                'price_adult' => ['Giá người lớn phải lớn hơn 0.'],
            ]);
        }

        if (array_key_exists('status', $data) && !in_array((string) $data['status'], ['draft', 'active', 'inactive', 'archived'], true)) {
            throw new ApiException('Trạng thái tour không hợp lệ.', 422, [
                'status' => ['Trạng thái tour không hợp lệ.'],
            ]);
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->tours->updateById($id, $data);

        return $this->tours->find($id) ?? [];
    }

    public function deleteTour(int $id): void
    {
        $this->tours->deleteById($id);
    }

    public function categories(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 20)));

        $sql = 'SELECT * FROM categories WHERE 1=1';
        $params = [];

        if (!empty($query['q'])) {
            $sql .= ' AND (name LIKE :q OR slug LIKE :q)';
            $params['q'] = '%' . $query['q'] . '%';
        }

        if (!empty($query['status'])) {
            $sql .= ' AND status = :status';
            $params['status'] = $query['status'];
        }

        $sql .= ' ORDER BY id DESC';

        return $this->categories->paginate($sql, $params, $page, $limit);
    }

    public function createCategory(array $payload): array
    {
        $name = trim((string) ($payload['name'] ?? ''));
        if ($name === '') {
            throw new ApiException('Tên danh mục là bắt buộc.', 422);
        }

        $id = $this->categories->create([
            'name' => $name,
            'slug' => StrHelper::slug($name),
            'description' => $payload['description'] ?? null,
            'image' => $payload['image'] ?? null,
            'status' => $payload['status'] ?? 'active',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->categories->find($id) ?? [];
    }

    public function updateCategory(int $id, array $payload): array
    {
        $category = $this->categories->find($id);
        if (!$category) {
            throw new ApiException('Không tìm thấy danh mục.', 404);
        }

        $data = [];
        foreach (['name', 'description', 'image', 'status'] as $field) {
            if (array_key_exists($field, $payload)) {
                $data[$field] = $payload[$field];
            }
        }

        if (isset($data['name'])) {
            $data['slug'] = StrHelper::slug((string) $data['name']);
        }

        if ($data === []) {
            return $category;
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->categories->updateById($id, $data);

        return $this->categories->find($id) ?? [];
    }

    public function deleteCategory(int $id): void
    {
        $this->categories->deleteById($id);
    }

    public function bookings(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));
        return $this->bookings->adminList($query, $page, $limit);
    }

    public function bookingDetail(int $id): array
    {
        $booking = $this->bookings->adminDetail($id);
        if (!$booking) {
            throw new ApiException('Không tìm thấy booking.', 404);
        }

        return $booking;
    }

    public function updateBooking(int $id, array $payload): array
    {
        $booking = $this->bookingDetail($id);
        $data = [];

        foreach (['booking_status', 'payment_status', 'note'] as $field) {
            if (array_key_exists($field, $payload)) {
                $data[$field] = $payload[$field];
            }
        }

        if ($data === []) {
            return $booking;
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->bookings->updateById($id, $data);

        return $this->bookings->find($id) ?? [];
    }

    public function payments(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));

        $sql = 'SELECT p.*, b.booking_code
                FROM payments p
                INNER JOIN bookings b ON b.id = p.booking_id
                WHERE 1=1';
        $params = [];

        if (!empty($query['status'])) {
            $sql .= ' AND p.payment_status = :status';
            $params['status'] = $query['status'];
        }

        if (!empty($query['q'])) {
            $sql .= ' AND (p.transaction_code LIKE :q OR b.booking_code LIKE :q)';
            $params['q'] = '%' . $query['q'] . '%';
        }

        $sql .= ' ORDER BY p.id DESC';

        return $this->payments->paginate($sql, $params, $page, $limit);
    }

    public function paymentDetail(int $id): array
    {
        $payment = $this->payments->find($id);
        if (!$payment) {
            throw new ApiException('Không tìm thấy payment.', 404);
        }

        return $payment;
    }

    public function updatePayment(int $id, array $payload): array
    {
        $payment = $this->paymentDetail($id);
        $data = [];
        foreach (['payment_status', 'transaction_code', 'payment_method'] as $field) {
            if (array_key_exists($field, $payload)) {
                $data[$field] = $payload[$field];
            }
        }

        if ($data === []) {
            return $payment;
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->payments->updateById($id, $data);

        return $this->payments->find($id) ?? [];
    }

    public function invoices(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));

        $sql = 'SELECT i.*, b.booking_code
                FROM invoices i
                INNER JOIN bookings b ON b.id = i.booking_id
                WHERE 1=1';
        $params = [];

        if (!empty($query['status'])) {
            $sql .= ' AND i.payment_status = :status';
            $params['status'] = $query['status'];
        }

        if (!empty($query['q'])) {
            $sql .= ' AND (i.invoice_code LIKE :q OR b.booking_code LIKE :q)';
            $params['q'] = '%' . $query['q'] . '%';
        }

        $sql .= ' ORDER BY i.id DESC';

        return $this->invoices->paginate($sql, $params, $page, $limit);
    }

    public function invoiceDetail(int $id): array
    {
        $invoice = $this->invoices->find($id);
        if (!$invoice) {
            throw new ApiException('Không tìm thấy invoice.', 404);
        }

        return $invoice;
    }

    public function posts(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));

        $sql = 'SELECT p.*, u.full_name AS author_name
                FROM posts p
                INNER JOIN users u ON u.id = p.author_id
                WHERE 1=1';
        $params = [];

        if (!empty($query['status'])) {
            $sql .= ' AND p.status = :status';
            $params['status'] = $query['status'];
        }

        if (!empty($query['q'])) {
            $sql .= ' AND (p.title LIKE :q OR p.excerpt LIKE :q)';
            $params['q'] = '%' . $query['q'] . '%';
        }

        $sql .= ' ORDER BY p.id DESC';

        return $this->posts->paginate($sql, $params, $page, $limit);
    }

    public function createPost(int $authorId, array $payload): array
    {
        $title = trim((string) ($payload['title'] ?? ''));
        if ($title === '') {
            throw new ApiException('Tiêu đề bài viết là bắt buộc.', 422);
        }

        $status = (string) ($payload['status'] ?? 'draft');
        $postData = [
            'author_id' => $authorId,
            'title' => $title,
            'slug' => StrHelper::slug($title),
            'excerpt' => $payload['excerpt'] ?? null,
            'thumbnail' => $payload['thumbnail'] ?? null,
            'content' => $payload['content'] ?? null,
            'status' => $status,
            'published_at' => $status === 'published' ? date('Y-m-d H:i:s') : null,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        $postData = array_merge($postData, $this->extractOptionalPostFields($payload));

        $id = $this->posts->create($postData);

        return $this->posts->find($id) ?? [];
    }

    public function updatePost(int $id, array $payload): array
    {
        $post = $this->posts->find($id);
        if (!$post) {
            throw new ApiException('Không tìm thấy bài viết.', 404);
        }

        $data = [];
        foreach (['title', 'excerpt', 'thumbnail', 'content', 'status'] as $field) {
            if (array_key_exists($field, $payload)) {
                $data[$field] = $payload[$field];
            }
        }

        $data = array_merge($data, $this->extractOptionalPostFields($payload));

        if (isset($data['title'])) {
            $data['slug'] = StrHelper::slug((string) $data['title']);
        }

        if (($data['status'] ?? '') === 'published' && empty($post['published_at'])) {
            $data['published_at'] = date('Y-m-d H:i:s');
        }

        if ($data === []) {
            return $post;
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->posts->updateById($id, $data);

        return $this->posts->find($id) ?? [];
    }

    public function deletePost(int $id): void
    {
        $this->posts->deleteById($id);
    }

    private function extractOptionalPostFields(array $payload): array
    {
        $data = [];
        $optionalMap = [
            'category' => 'category',
            'tags' => 'tags',
            'gallery' => 'gallery',
            'meta_title' => 'meta_title',
            'meta_description' => 'meta_description',
            'is_featured' => 'is_featured',
        ];

        foreach ($optionalMap as $payloadKey => $column) {
            if (!$this->postColumnExists($column) || !array_key_exists($payloadKey, $payload)) {
                continue;
            }

            $value = $payload[$payloadKey];
            if (in_array($column, ['tags', 'gallery'], true)) {
                if (is_array($value)) {
                    $value = json_encode(array_values(array_filter(array_map('strval', $value))), JSON_UNESCAPED_UNICODE);
                } elseif ($value === null || $value === '') {
                    $value = null;
                } else {
                    $value = (string) $value;
                }
            }

            if ($column === 'is_featured') {
                $value = !empty($value) ? 1 : 0;
            }

            $data[$column] = $value;
        }

        return $data;
    }

    private function postColumnExists(string $column): bool
    {
        if ($this->postColumns === null) {
            $this->postColumns = [];
            $stmt = $this->db->query('SHOW COLUMNS FROM posts');
            foreach ($stmt->fetchAll() as $row) {
                $field = (string) ($row['Field'] ?? '');
                if ($field !== '') {
                    $this->postColumns[$field] = true;
                }
            }
        }

        return isset($this->postColumns[$column]);
    }

    public function promotions(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));

        $sql = 'SELECT p.*, pr.company_name AS provider_name
                FROM promotions p
                LEFT JOIN providers pr ON pr.id = p.provider_id
                WHERE 1=1';
        $params = [];

        if (!empty($query['status'])) {
            $sql .= ' AND p.status = :status';
            $params['status'] = $query['status'];
        }

        if (!empty($query['q'])) {
            $sql .= ' AND (p.code LIKE :q OR p.title LIKE :q)';
            $params['q'] = '%' . $query['q'] . '%';
        }

        $sql .= ' ORDER BY p.id DESC';

        return $this->promotions->paginate($sql, $params, $page, $limit);
    }

    public function createPromotion(array $payload): array
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
            'provider_id' => $payload['provider_id'] ?? null,
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

    public function updatePromotion(int $id, array $payload): array
    {
        $promotion = $this->promotions->find($id);
        if (!$promotion) {
            throw new ApiException('Không tìm thấy khuyến mãi.', 404);
        }

        $data = [];
        foreach ([
                     'provider_id', 'code', 'title', 'description', 'image_url', 'discount_type', 'discount_value',
                     'min_order_value', 'max_discount_value', 'start_date', 'end_date', 'usage_limit',
                     'status'
                 ] as $field) {
            if (array_key_exists($field, $payload)) {
                $data[$field] = $payload[$field];
            }
        }

        if ($data === []) {
            return $promotion;
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
        $this->promotions->updateById($id, $data);

        return $this->promotions->find($id) ?? [];
    }

    public function deletePromotion(int $id): void
    {
        $this->promotions->deleteById($id);
    }

    public function providers(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));

        return $this->providers->paginateProviders($query, $page, $limit);
    }

    public function providerRequests(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));
        return $this->providerRequests->paginateRequests($query, $page, $limit);
    }

    public function providerDetail(int $id): array
    {
        $provider = $this->providers->find($id);
        if (!$provider) {
            throw new ApiException('Không tìm thấy provider.', 404);
        }

        return $provider;
    }

    public function approveProvider(int $id, string $note = ''): array
    {
        $provider = $this->providerDetail($id);

        $this->db->beginTransaction();
        try {
            $this->providers->updateById($id, [
                'status' => 'active',
                'approved_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            $roleId = $this->getRoleId('provider');
            $stmt = $this->db->prepare('UPDATE users SET role_id = :role_id, updated_at = NOW() WHERE id = :id');
            $stmt->execute([
                'role_id' => $roleId,
                'id' => (int) $provider['user_id'],
            ]);

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return $this->providers->find($id) ?? [];
    }

    public function rejectProvider(int $id, string $note = ''): array
    {
        $this->providerDetail($id);
        $this->providers->updateById($id, [
            'status' => 'rejected',
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->providers->find($id) ?? [];
    }

    public function comments(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 10)));

        $sql = 'SELECT c.*, u.full_name AS user_name, t.title AS tour_title
                FROM comments c
                INNER JOIN users u ON u.id = c.user_id
                INNER JOIN tours t ON t.id = c.tour_id
                WHERE 1=1';
        $params = [];

        if (!empty($query['status'])) {
            $sql .= ' AND c.status = :status';
            $params['status'] = $query['status'];
        }

        if (!empty($query['q'])) {
            $sql .= ' AND (c.content LIKE :q OR u.full_name LIKE :q OR t.title LIKE :q)';
            $params['q'] = '%' . $query['q'] . '%';
        }

        $sql .= ' ORDER BY c.id DESC';

        return $this->comments->paginate($sql, $params, $page, $limit);
    }

    public function hideComment(int $id): array
    {
        $comment = $this->comments->find($id);
        if (!$comment) {
            throw new ApiException('Không tìm thấy bình luận.', 404);
        }

        $this->comments->updateById($id, [
            'status' => 'hidden',
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->comments->find($id) ?? [];
    }

    public function deleteComment(int $id): void
    {
        $this->comments->deleteById($id);
    }

    private function count(string $table, string $where = '1=1'): int
    {
        $stmt = $this->db->query("SELECT COUNT(*) AS total FROM {$table} WHERE {$where}");
        return (int) ($stmt->fetch()['total'] ?? 0);
    }

    private function sum(string $table, string $column, string $where = '1=1'): float
    {
        $stmt = $this->db->query("SELECT COALESCE(SUM({$column}),0) AS total FROM {$table} WHERE {$where}");
        return (float) ($stmt->fetch()['total'] ?? 0);
    }

    private function getRoleId(string $name): int
    {
        $stmt = $this->db->prepare('SELECT id FROM roles WHERE name = :name LIMIT 1');
        $stmt->execute(['name' => $name]);
        $row = $stmt->fetch();

        if (!$row) {
            throw new ApiException('Role không tồn tại: ' . $name, 500);
        }

        return (int) $row['id'];
    }

    public function approveProviderRequest(int $requestId, string $note = ''): array
    {
        $request = $this->providerRequests->find($requestId);
        if (!$request) {
            throw new ApiException('Không tìm thấy yêu cầu provider.', 404);
        }

        if ((string) $request['status'] === 'approved') {
            return $request;
        }

        $this->db->beginTransaction();
        try {
            $provider = $this->providers->findByUserId((int) $request['user_id']);
            $providerData = [
                'user_id' => (int) $request['user_id'],
                'company_name' => $request['company_name'] ?: 'Nhà cung cấp',
                'tax_code' => $request['tax_code'] ?: null,
                'business_license' => $request['business_license'] ?: null,
                'description' => $request['description'] ?: null,
                'address' => $request['address'] ?: null,
                'contact_email' => $request['contact_email'] ?: null,
                'contact_phone' => $request['contact_phone'] ?: null,
                'status' => 'active',
                'approved_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            if ($provider) {
                $this->providers->updateById((int) $provider['id'], $providerData);
            } else {
                $providerData['created_at'] = date('Y-m-d H:i:s');
                $this->providers->create($providerData);
            }

            $this->providerRequests->updateById($requestId, [
                'status' => 'approved',
                'admin_note' => $note !== '' ? $note : null,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            $roleId = $this->getRoleId('provider');
            $stmt = $this->db->prepare('UPDATE users SET role_id = :role_id, updated_at = NOW() WHERE id = :id');
            $stmt->execute([
                'role_id' => $roleId,
                'id' => (int) $request['user_id'],
            ]);

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return $this->providerRequests->find($requestId) ?? [];
    }

    public function rejectProviderRequest(int $requestId, string $note = ''): array
    {
        $request = $this->providerRequests->find($requestId);
        if (!$request) {
            throw new ApiException('Không tìm thấy yêu cầu provider.', 404);
        }

        $this->providerRequests->updateById($requestId, [
            'status' => 'rejected',
            'admin_note' => $note !== '' ? $note : null,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->providerRequests->find($requestId) ?? [];
    }
}
