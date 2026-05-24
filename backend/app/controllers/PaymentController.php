<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\Controller;
use App\Core\Request;
use App\Services\BookingService;

class PaymentController extends Controller
{
    private BookingService $service;
    public function __construct() { $this->service = new BookingService(); }

    public function momoIpn(Request $request, array $params): void
    {
        $result = $this->service->handleMomoIpn($request->input());
        $this->ok($result);
    }

    public function momoReturn(Request $request, array $params): void
    {
        $result = $this->service->paymentReturn($request->query());
        $this->ok($result);
    }

    public function vnpayReturn(Request $request, array $params): void
    {
        $result = $this->service->handleVnpayReturn($request->query());
        $this->ok($result);
    }

    public function vnpayIpn(Request $request, array $params): void
    {
        $result = $this->service->handleVnpayReturn($request->query());
        $this->ok($result);
    }
}
