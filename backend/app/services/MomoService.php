<?php
declare(strict_types=1);
namespace App\Services;
use App\Core\Config;

class MomoService
{
    private string $partnerCode;
    private string $accessKey;
    private string $secretKey;
    private string $endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';

    public function __construct()
    {
        $this->partnerCode = getenv('MOMO_PARTNER_CODE') ?: 'MOMO_TEST';
        $this->accessKey = getenv('MOMO_ACCESS_KEY') ?: '';
        $this->secretKey = getenv('MOMO_SECRET_KEY') ?: '';
    }

    public function createPayment(string $orderId, int $amount, string $orderInfo, string $returnUrl, string $notifyUrl): array
    {
        $requestId = $orderId . '_' . time();
        $rawHash = "accessKey={$this->accessKey}&amount={$amount}&extraData=&ipnUrl={$notifyUrl}&orderId={$orderId}&orderInfo={$orderInfo}&partnerCode={$this->partnerCode}&redirectUrl={$returnUrl}&requestId={$requestId}&requestType=payWithMethod";
        $signature = hash_hmac('sha256', $rawHash, $this->secretKey);

        $payload = [
            'partnerCode' => $this->partnerCode, 'requestId' => $requestId,
            'amount' => $amount, 'orderId' => $orderId, 'orderInfo' => $orderInfo,
            'redirectUrl' => $returnUrl, 'ipnUrl' => $notifyUrl,
            'requestType' => 'payWithMethod', 'extraData' => '',
            'lang' => 'vi', 'signature' => $signature,
        ];

        $ch = curl_init($this->endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
        ]);
        $resp = curl_exec($ch);
        curl_close($ch);

        return json_decode($resp ?: '{}', true) ?: [];
    }

    public function verifyIpnSignature(array $data): bool
    {
        $sig = $data['signature'] ?? '';
        unset($data['signature']);
        ksort($data);
        $raw = urldecode(http_build_query($data));
        return hash_hmac('sha256', $raw, $this->secretKey) === $sig;
    }
}
