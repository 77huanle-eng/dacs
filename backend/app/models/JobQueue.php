<?php
declare(strict_types=1);
namespace App\Models;
use App\Core\Model;
class JobQueue extends Model
{
    protected string $table = 'job_queues';
}
