<?php
declare(strict_types=1);
namespace App\Services;

class VnpayService
{
    private string $tmnCode;
    private string $hashSecret;
    private string $url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

    public function __construct()
    {
        $this->tmnCode = getenv('VNPAY_TMN_CODE') ?: 'VNPAY_TEST';
        $this->hashSecret = getenv('VNPAY_HASH_SECRET') ?: '';
    }

    public function createPaymentUrl(string $orderId, int $amount, string $orderInfo, string $returnUrl, string $ip = '127.0.0.1'): string
    {
        $params = [
            'vnp_Version' => '2.1.0', 'vnp_Command' => 'pay',
            'vnp_TmnCode' => $this->tmnCode, 'vnp_Amount' => $amount * 100,
            'vnp_CurrCode' => 'VND', 'vnp_TxnRef' => $orderId,
            'vnp_OrderInfo' => $orderInfo, 'vnp_OrderType' => 'travel',
            'vnp_Locale' => 'vn', 'vnp_ReturnUrl' => $returnUrl,
            'vnp_IpAddr' => $ip, 'vnp_CreateDate' => date('YmdHis'),
        ];

        ksort($params);
        $query = http_build_query($params);
        $hash = hash_hmac('sha512', $query, $this->hashSecret);
        return $this->url . '?' . $query . '&vnp_SecureHash=' . $hash;
    }

    public function verifyResponse(array $data): bool
    {
        $hash = $data['vnp_SecureHash'] ?? '';
        unset($data['vnp_SecureHash'], $data['vnp_SecureHashType']);
        ksort($data);
        $query = http_build_query($data);
        return hash_hmac('sha512', $query, $this->hashSecret) === $hash;
    }
}
