<?php
declare(strict_types=1);
namespace App\Models;
use App\Core\Model;

class Ticket extends Model
{
    protected string $table = 'tickets';

    public function findByBookingId(int $bookingId): ?array
    {
        return $this->firstBy(['booking_id' => $bookingId]);
    }
}
