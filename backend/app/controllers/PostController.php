<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Request;
use App\Models\Post;

class PostController extends Controller
{
    private Post $posts;

    public function __construct()
    {
        $this->posts = new Post();
    }

    public function index(Request $request, array $params): void
    {
        $page = max(1, (int) ($request->query('page') ?? 1));
        $limit = max(1, min(100, (int) ($request->query('limit') ?? 10)));

        $result = $this->posts->paginatePublic($request->query(), $page, $limit);
        $this->ok($result['items'], 'Lấy danh sách bài viết thành công.', $result['meta']);
    }

    public function detail(Request $request, array $params): void
    {
        $slug = (string) ($params['slug'] ?? '');
        $post = $this->posts->findBySlug($slug);

        if (!$post || !in_array($post['status'], ['published', 'active'], true)) {
            throw new ApiException('Không tìm thấy bài viết.', 404);
        }

        $this->ok($post, 'Lấy chi tiết bài viết thành công.');
    }
}
