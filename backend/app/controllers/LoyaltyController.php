<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Request;
use App\Models\LoyaltyPoint;
use App\Models\MembershipTier;

class LoyaltyController extends Controller
{
    private LoyaltyPoint $points;
    private MembershipTier $tiers;

    public function __construct()
    {
        $this->points = new LoyaltyPoint();
        $this->tiers = new MembershipTier();
    }

    public function balance(Request $request, array $params): void
    {
        $userId = $this->authUserId($request);
        $this->ok($this->points->balance($userId));
    }

    public function history(Request $request, array $params): void
    {
        $userId = $this->authUserId($request);
        $page = max(1, (int) ($request->query('page') ?? 1));
        $limit = min(50, max(1, (int) ($request->query('limit') ?? 20)));
        $this->ok($this->points->paginate(
            'SELECT * FROM loyalty_points WHERE user_id = :uid ORDER BY created_at DESC',
            ['uid' => $userId], $page, $limit
        ));
    }

    public function tiers(Request $request, array $params): void
    {
        $this->ok($this->tiers->all([], 'min_points ASC'));
    }

    public function adminBonus(Request $request, array $params): void
    {
        $data = $request->input();
        $this->validatePayload($data, ['user_id' => 'required', 'points' => 'required'], 'Dữ liệu không hợp lệ.');
        $userId = (int) $data['user_id'];
        $pts = (int) $data['points'];
        $reason = (string) ($data['reason'] ?? 'Admin bonus');
        if ($pts <= 0) throw new ApiException('Số điểm phải > 0.', 422);
        $this->points->earn($userId, $pts, 'admin_bonus', null, $reason);
        $this->points->syncUserPoints($userId);
        $this->ok($this->points->balance($userId), "Đã cộng {$pts} điểm.");
    }

    public function adminDeduct(Request $request, array $params): void
    {
        $data = $request->input();
        $this->validatePayload($data, ['user_id' => 'required', 'points' => 'required'], 'Dữ liệu không hợp lệ.');
        $userId = (int) $data['user_id'];
        $pts = (int) $data['points'];
        $reason = (string) ($data['reason'] ?? 'Admin deduct');
        if ($pts <= 0) throw new ApiException('Số điểm phải > 0.', 422);
        $this->points->redeem($userId, $pts, 'admin_deduct', null, $reason);
        $this->points->syncUserPoints($userId);
        $this->ok($this->points->balance($userId), "Đã trừ {$pts} điểm.");
    }
}
