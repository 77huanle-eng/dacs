<?php
declare(strict_types=1);
namespace App\Models;
use App\Core\Model;

class LoginHistory extends Model
{
    protected string $table = 'login_histories';

    public function log(int $userId, string $status, ?string $ip, ?string $ua): int
    {
        $parsed = $this->parseUA($ua ?? '');
        return $this->create([
            'user_id' => $userId,
            'ip_address' => $ip,
            'user_agent' => $ua,
            'device_type' => $parsed['device'],
            'browser' => $parsed['browser'],
            'os' => $parsed['os'],
            'status' => $status,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }

    private function parseUA(string $ua): array
    {
        $device = 'Desktop';
        $browser = 'Unknown';
        $os = 'Unknown';

        if (preg_match('/Mobile|Android|iPhone/i', $ua)) $device = 'Mobile';
        elseif (preg_match('/Tablet|iPad/i', $ua)) $device = 'Tablet';

        if (preg_match('/Edg/i', $ua)) $browser = 'Edge';
        elseif (preg_match('/Chrome/i', $ua)) $browser = 'Chrome';
        elseif (preg_match('/Firefox/i', $ua)) $browser = 'Firefox';
        elseif (preg_match('/Safari/i', $ua)) $browser = 'Safari';

        if (preg_match('/Windows/i', $ua)) $os = 'Windows';
        elseif (preg_match('/Mac/i', $ua)) $os = 'macOS';
        elseif (preg_match('/Android/i', $ua)) $os = 'Android';
        elseif (preg_match('/iPhone|iOS/i', $ua)) $os = 'iOS';
        elseif (preg_match('/Linux/i', $ua)) $os = 'Linux';

        return compact('device', 'browser', 'os');
    }
}
