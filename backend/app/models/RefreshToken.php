<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

class RefreshToken extends Model
{
    protected string $table = 'refresh_tokens';

    public function createToken(int $userId, string $plainToken, string $expiresAt): int
    {
        return $this->create([
            'user_id' => $userId,
            'token' => hash('sha256', $plainToken),
            'expires_at' => $expiresAt,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function findActiveByToken(string $plainToken): ?array
    {
        $sql = 'SELECT * FROM refresh_tokens
                WHERE token = :token
                  AND revoked_at IS NULL
                  AND expires_at >= NOW()
                ORDER BY id DESC
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['token' => hash('sha256', $plainToken)]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function revokeToken(string $plainToken): void
    {
        $sql = 'UPDATE refresh_tokens
                SET revoked_at = NOW(), updated_at = NOW()
                WHERE token = :token AND revoked_at IS NULL';

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['token' => hash('sha256', $plainToken)]);
    }

    public function revokeByUser(int $userId): void
    {
        $sql = 'UPDATE refresh_tokens
                SET revoked_at = NOW(), updated_at = NOW()
                WHERE user_id = :user_id AND revoked_at IS NULL';
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['user_id' => $userId]);
    }
}
