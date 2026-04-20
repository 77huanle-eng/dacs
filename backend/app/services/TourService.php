<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\ApiException;
use App\Models\Comment;
use App\Models\Promotion;
use App\Models\Rating;
use App\Models\Tour;
use App\Models\TourImage;
use App\Models\TourService as TourServiceModel;

class TourService
{
    private Tour $tours;
    private TourImage $tourImages;
    private TourServiceModel $tourServices;
    private Comment $comments;
    private Rating $ratings;
    private Promotion $promotions;

    public function __construct()
    {
        $this->tours = new Tour();
        $this->tourImages = new TourImage();
        $this->tourServices = new TourServiceModel();
        $this->comments = new Comment();
        $this->ratings = new Rating();
        $this->promotions = new Promotion();
    }

    public function listing(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 12)));

        return $this->tours->paginatePublic($query, $page, $limit);
    }

    public function featured(array $query): array
    {
        $limit = max(1, min(30, (int) ($query['limit'] ?? 8)));
        return [
            'items' => $this->tours->getFeatured($limit),
            'meta' => ['limit' => $limit],
        ];
    }

    public function promotions(array $query): array
    {
        $limit = max(1, min(30, (int) ($query['limit'] ?? 8)));
        return [
            'items' => $this->tours->getPromotionTours($limit),
            'meta' => ['limit' => $limit],
        ];
    }

    public function publicPromotions(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = max(1, min(100, (int) ($query['limit'] ?? 20)));

        return $this->promotions->publicActive($query, $page, $limit);
    }

    public function detail(int $id): array
    {
        $tour = $this->tours->detail($id);
        if (!$tour) {
            throw new ApiException('Không tìm thấy tour.', 404);
        }

        $this->tours->increaseViews($id);

        $images = $this->tourImages->all(['tour_id' => $id], 'sort_order ASC, id ASC');
        $services = $this->tourServices->all(['tour_id' => $id], 'id ASC');

        return [
            'tour' => $tour,
            'images' => $images,
            'services' => $services,
        ];
    }

    public function comments(int $tourId, int $page, int $limit): array
    {
        $sql = 'SELECT c.*, u.full_name AS user_name, u.avatar AS user_avatar
                FROM comments c
                INNER JOIN users u ON u.id = c.user_id
                WHERE c.tour_id = :tour_id AND c.status = "visible"
                ORDER BY c.id DESC';

        return $this->comments->paginate($sql, ['tour_id' => $tourId], max(1, $page), max(1, min(50, $limit)));
    }

    public function ratings(int $tourId, int $page, int $limit): array
    {
        $sql = 'SELECT r.*, u.full_name AS user_name, u.avatar AS user_avatar
                FROM ratings r
                INNER JOIN users u ON u.id = r.user_id
                WHERE r.tour_id = :tour_id
                ORDER BY r.id DESC';

        return $this->ratings->paginate($sql, ['tour_id' => $tourId], max(1, $page), max(1, min(50, $limit)));
    }
}
