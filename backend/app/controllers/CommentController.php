<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Request;
use App\Models\Comment;
use App\Models\Tour;

class CommentController extends Controller
{
    private Comment $comments;
    private Tour $tours;

    public function __construct()
    {
        $this->comments = new Comment();
        $this->tours = new Tour();
    }

    public function publicFeed(Request $request, array $params): void
    {
        $page = max(1, (int) ($request->query('page') ?? 1));
        $limit = max(1, min(100, (int) ($request->query('limit') ?? 10)));

        $result = $this->comments->publicFeed($request->query(), $page, $limit);
        $this->ok($result['items'], 'Lấy danh sách đánh giá công khai thành công.', $result['meta']);
    }

    public function create(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $payload = $request->input();
        $this->validatePayload($payload, [
            'tour_id' => 'required|integer|min_num:1',
            'content' => 'required|min:2|max:2000',
        ], 'Dữ liệu bình luận không hợp lệ.');

        $tourId = (int) ($payload['tour_id'] ?? 0);
        $content = trim((string) ($payload['content'] ?? ''));

        if ($tourId <= 0 || !$this->tours->find($tourId)) {
            throw new ApiException('tour_id không hợp lệ.', 422);
        }

        if ($content === '') {
            throw new ApiException('Nội dung bình luận là bắt buộc.', 422);
        }

        $id = $this->comments->create([
            'user_id' => (int) $user['id'],
            'tour_id' => $tourId,
            'content' => $content,
            'status' => 'visible',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $this->created($this->comments->find($id), 'Tạo bình luận thành công.');
    }

    public function update(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $id = (int) ($params['id'] ?? 0);
        $comment = $this->comments->find($id);

        if (!$comment) {
            throw new ApiException('Không tìm thấy bình luận.', 404);
        }

        $role = strtolower((string) ($user['role_name'] ?? 'user'));
        if ((int) $comment['user_id'] !== (int) $user['id'] && $role !== 'admin') {
            throw new ApiException('Bạn không có quyền sửa bình luận này.', 403);
        }

        $payload = $request->input();
        $this->validatePayload($payload, [
            'content' => 'required|min:2|max:2000',
        ], 'Dữ liệu cập nhật bình luận không hợp lệ.');

        $content = trim((string) ($payload['content'] ?? ''));
        if ($content === '') {
            throw new ApiException('Nội dung bình luận là bắt buộc.', 422);
        }

        $this->comments->updateById($id, [
            'content' => $content,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $this->ok($this->comments->find($id), 'Cập nhật bình luận thành công.');
    }

    public function delete(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $id = (int) ($params['id'] ?? 0);
        $comment = $this->comments->find($id);

        if (!$comment) {
            throw new ApiException('Không tìm thấy bình luận.', 404);
        }

        $role = strtolower((string) ($user['role_name'] ?? 'user'));
        if ((int) $comment['user_id'] !== (int) $user['id'] && $role !== 'admin') {
            throw new ApiException('Bạn không có quyền xóa bình luận này.', 403);
        }

        $this->comments->deleteById($id);
        $this->ok(null, 'Xóa bình luận thành công.');
    }
}

