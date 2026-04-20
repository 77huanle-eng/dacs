<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

/**
 * @deprecated Bảng pivot promotion_tours hien duoc truy cap truc tiep qua query/service.
 * Giữ model này de tranh vo reference ngầm trong giai đoạn chuyển tiếp.
 */
class PromotionTour extends Model
{
    protected string $table = 'promotion_tours';
}
