<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Request;
use App\Services\DepartureService;

class DepartureController extends Controller
{
    private DepartureService $service;
    public function __construct() { $this->service = new DepartureService(); }

    public function publicList(Request $request, array $params): void
    {
        $tourId = (int) ($params['id'] ?? 0);
        $this->ok($this->service->openByTour($tourId));
    }

    public function providerList(Request $request, array $params): void
    {
        $tourId = (int) ($params['id'] ?? 0);
        $this->ok($this->service->byTour($tourId));
    }

    public function providerCreate(Request $request, array $params): void
    {
        $tourId = (int) ($params['id'] ?? 0);
        $data = $request->input();
        $this->validatePayload($data, ['departure_date' => 'required', 'max_guests' => 'required'], 'Dữ liệu lịch khởi hành không hợp lệ.');
        $data['tour_id'] = $tourId;
        $result = $this->service->create($data);
        $this->created($result);
    }

    public function providerUpdate(Request $request, array $params): void
    {
        $tourId = (int) ($params['id'] ?? 0);
        $did = (int) ($params['did'] ?? 0);
        $data = $request->input();
        $result = $this->service->update($did, $tourId, $data);
        $this->ok($result);
    }

    public function providerDelete(Request $request, array $params): void
    {
        $tourId = (int) ($params['id'] ?? 0);
        $did = (int) ($params['did'] ?? 0);
        $this->service->delete($did, $tourId);
        $this->ok(null, 'Xóa lịch khởi hành thành công.');
    }

    public function adminList(Request $request, array $params): void
    {
        $page = max(1, (int) ($request->query('page') ?? 1));
        $limit = min(50, max(1, (int) ($request->query('limit') ?? 20)));
        $dep = new \App\Models\Departure();
        $sql = 'SELECT d.*, t.title AS tour_title FROM departures d LEFT JOIN tours t ON d.tour_id=t.id ORDER BY d.departure_date DESC';
        $this->ok($dep->paginate($sql, [], $page, $limit));
    }
}
