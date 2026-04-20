<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

/**
 * @deprecated Flow reset password hien dang thao tac truc tiep bang SQL trong AuthService.
 * Giữ model này để tương thích ngược cho đến khi dọn hẳn toàn bộ reference cũ.
 */
class PasswordReset extends Model
{
    protected string $table = 'password_resets';
}
