<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Request;
use App\Models\Banner;
use App\Services\MediaUploadService;

class BannerController extends Controller
{
    private Banner $banners;
    private MediaUploadService $media;

    public function __construct()
    {
        $this->banners = new Banner();
        $this->media = new MediaUploadService();
    }

    public function active(Request $request, array $params): void
    {
        $this->ok($this->banners->all(['status' => 1], 'sort_order ASC'));
    }

    public function index(Request $request, array $params): void
    {
        $page = max(1, (int) ($request->query('page') ?? 1));
        $limit = min(50, max(1, (int) ($request->query('limit') ?? 20)));
        $this->ok($this->banners->paginate('SELECT * FROM banners ORDER BY sort_order ASC, id DESC', [], $page, $limit));
    }

    public function create(Request $request, array $params): void
    {
        $data = $request->input();
        $this->validatePayload($data, ['title' => 'required'], 'Tiêu đề banner là bắt buộc.');
        $now = date('Y-m-d H:i:s');
        $data['created_at'] = $now;
        $data['updated_at'] = $now;
        $id = $this->banners->create($data);
        $this->created($this->banners->find($id));
    }

    public function update(Request $request, array $params): void
    {
        $id = $this->routeId($params);
        $data = $request->input();
        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->banners->updateById($id, $data);
        $this->ok($this->banners->find($id));
    }

    public function delete(Request $request, array $params): void
    {
        $id = $this->routeId($params);
        $this->banners->deleteById($id);
        $this->ok(null, 'Đã xóa banner.');
    }

    public function uploadImage(Request $request, array $params): void
    {
        $url = $this->media->uploadImage($request, 'image', 'banners');
        $this->ok(['url' => $url]);
    }
}
