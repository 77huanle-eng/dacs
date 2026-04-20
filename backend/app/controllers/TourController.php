<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Services\TourService;

class TourController extends Controller
{
    private TourService $tourService;

    public function __construct()
    {
        $this->tourService = new TourService();
    }

    public function index(Request $request, array $params): void
    {
        $result = $this->tourService->listing($request->query());
        $this->ok($result['items'], 'Lấy danh sách tour thành công.', $result['meta']);
    }

    public function featured(Request $request, array $params): void
    {
        $result = $this->tourService->featured($request->query());
        $this->ok($result['items'], 'Lấy tour nổi bật thành công.', $result['meta']);
    }

    public function promotions(Request $request, array $params): void
    {
        $result = $this->tourService->promotions($request->query());
        $this->ok($result['items'], 'Lấy tour khuyến mãi thành công.', $result['meta']);
    }

    public function publicPromotions(Request $request, array $params): void
    {
        $result = $this->tourService->publicPromotions($request->query());
        $this->ok($result['items'], 'Lấy danh sách mã khuyến mãi thành công.', $result['meta']);
    }

    public function detail(Request $request, array $params): void
    {
        $id = (int) ($params['id'] ?? 0);
        $data = $this->tourService->detail($id);
        $this->ok($data, 'Lấy chi tiết tour thành công.');
    }

    public function comments(Request $request, array $params): void
    {
        $tourId = (int) ($params['id'] ?? 0);
        $page = (int) ($request->query('page') ?? 1);
        $limit = (int) ($request->query('limit') ?? 10);

        $result = $this->tourService->comments($tourId, $page, $limit);
        $this->ok($result['items'], 'Lấy bình luận tour thành công.', $result['meta']);
    }

    public function ratings(Request $request, array $params): void
    {
        $tourId = (int) ($params['id'] ?? 0);
        $page = (int) ($request->query('page') ?? 1);
        $limit = (int) ($request->query('limit') ?? 10);

        $result = $this->tourService->ratings($tourId, $page, $limit);
        $this->ok($result['items'], 'Lấy đánh giá tour thành công.', $result['meta']);
    }
}
