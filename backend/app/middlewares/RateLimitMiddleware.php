<?php
declare(strict_types=1);
namespace App\Middlewares;
use App\Core\Database;
use App\Core\MiddlewareInterface;
use App\Core\Request;
use PDO;

class RateLimitMiddleware implements MiddlewareInterface
{
    private int $maxHits;
    private int $windowMinutes;

    public function __construct(int $maxHits = 60, int $windowMinutes = 1)
    {
        $this->maxHits = $maxHits;
        $this->windowMinutes = $windowMinutes;
    }

    public function handle(Request $request, callable $next, array $params = []): mixed
    {
        if (isset($params[0])) $this->maxHits = (int) $params[0];
        if (isset($params[1])) $this->windowMinutes = (int) $params[1];

        $keyRaw = $this->resolveKey($request);
        $keyHash = hash('sha256', $keyRaw);
        $db = Database::connection();
        $now = date('Y-m-d H:i:s');
        $windowStart = date('Y-m-d H:i:s', strtotime("-{$this->windowMinutes} minutes"));

        // Clean old records
        $db->prepare('DELETE FROM rate_limits WHERE window_start < :cutoff')->execute(['cutoff' => $windowStart]);

        // Check current window
        $stmt = $db->prepare('SELECT id, requests FROM rate_limits WHERE key_hash = :key AND window_start > :ws LIMIT 1');
        $stmt->execute(['key' => $keyHash, 'ws' => $windowStart]);
        $row = $stmt->fetch();

        if ($row) {
            if ((int) $row['requests'] >= $this->maxHits) {
                http_response_code(429);
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Too many requests. Please try again later.']);
                exit;
            }
            $db->prepare('UPDATE rate_limits SET requests = requests + 1, updated_at = NOW() WHERE id = :id')->execute(['id' => (int) $row['id']]);
        } else {
            $db->prepare('INSERT INTO rate_limits (key_hash, requests, window_start) VALUES (:key, 1, NOW())')->execute(['key' => $keyHash]);
        }

        return $next($request);
    }

    private function resolveKey(Request $request): string
    {
        $ip = $request->ip();
        $path = $request->uri();
        return "rl:{$ip}:{$path}";
    }
}