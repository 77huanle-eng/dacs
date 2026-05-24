<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\Controller;
use App\Core\Request;
use App\Models\Itinerary;

class ItineraryController extends Controller
{
    private Itinerary $itineraries;
    public function __construct() { $this->itineraries = new Itinerary(); }

    public function getByTour(Request $request, array $params): void
    {
        $tourId = (int) ($params['id'] ?? 0);
        $this->ok($this->itineraries->all(['tour_id' => $tourId], 'day_number ASC'));
    }
}
