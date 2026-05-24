<?php
declare(strict_types=1);
namespace App\Models;
use App\Core\Model;
class AuditLog extends Model
{
    protected string $table = 'audit_logs';
}
