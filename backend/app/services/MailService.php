<?php
declare(strict_types=1);
namespace App\Services;
use App\Core\Config;

class MailService
{
    public function send(string $to, string $subject, string $body): bool
    {
        $overrideTo = getenv('MAIL_OVERRIDE_TO');
        if (!empty($overrideTo)) {
            $subject .= " (Original to: {$to})";
            $to = $overrideTo;
        }

        $transport = Config::get('app.mail_transport', getenv('MAIL_TRANSPORT') ?: 'log');

        if ($transport === 'log' || (getenv('MAIL_LOG_PREVIEW') === 'true')) {
            error_log("[MAIL] To: {$to} | Subject: {$subject} | Body length: " . strlen($body));
            return true;
        }

        if (strtolower((string) $transport) === 'smtp') {
            return $this->sendSmtp($to, $subject, $body);
        }

        $host = getenv('MAIL_SMTP_HOST') ?: 'smtp.gmail.com';
        $port = (int) (getenv('MAIL_SMTP_PORT') ?: 587);
        $user = getenv('MAIL_SMTP_USER') ?: '';
        $pass = getenv('MAIL_SMTP_PASS') ?: '';
        $from = getenv('MAIL_FROM_ADDRESS') ?: $user;
        $fromName = getenv('MAIL_FROM_NAME') ?: 'Viet Horizon Travel';

        $headers = implode("\r\n", [
            "From: {$fromName} <{$from}>",
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
        ]);

        return @mail($to, $subject, $body, $headers);
    }

    public function sendPaymentConfirmation(string $to, array $booking): bool
    {
        $subject = "Xác nhận thanh toán đơn #{$booking['booking_code']}";
        $body = "<h2>Cảm ơn bạn đã đặt tour!</h2>"
            . "<p>Mã đơn: <strong>{$booking['booking_code']}</strong></p>"
            . "<p>Tổng tiền: <strong>" . number_format((float) $booking['total_amount']) . " VNĐ</strong></p>"
            . "<p>Trạng thái: Đã thanh toán</p>";
        return $this->send($to, $subject, $body);
    }

    public function sendWelcomeEmail(string $to, string $fullName): bool
    {
        $subject = "Chào mừng bạn đến với Viet Horizon Travel!";
        $body = "<h2>Chào mừng {$fullName}!</h2>"
            . "<p>Cảm ơn bạn đã đăng ký tài khoản trên hệ thống của chúng tôi.</p>"
            . "<p>Giờ đây bạn đã có thể đăng nhập để đặt các tour du lịch hấp dẫn, quản lý các booking và nhận nhiều ưu đãi độc quyền.</p>"
            . "<p>Chúc bạn có những chuyến đi tuyệt vời cùng Viet Horizon Travel!</p>";
        return $this->send($to, $subject, $body);
    }

    public function sendContactConfirmation(string $to, string $fullName, string $subjectText): bool
    {
        $subject = "Xác nhận tiếp nhận yêu cầu liên hệ: {$subjectText}";
        $body = "<h2>Chào {$fullName},</h2>"
            . "<p>Cảm ơn bạn đã gửi tin nhắn liên hệ cho chúng tôi.</p>"
            . "<p>Đội ngũ hỗ trợ của Viet Horizon Travel đã tiếp nhận yêu cầu của bạn và sẽ phản hồi sớm nhất trong vòng 24 giờ làm việc.</p>"
            . "<p>Trân trọng cảm ơn!</p>";
        return $this->send($to, $subject, $body);
    }

    public function sendSubscribeConfirmation(string $to, string $fullName): bool
    {
        $subject = "Đăng ký nhận bản tin Viet Horizon Travel thành công!";
        $body = "<h2>Xin chào {$fullName},</h2>"
            . "<p>Cảm ơn bạn đã đăng ký theo dõi bản tin của Viet Horizon Travel.</p>"
            . "<p>Chúng tôi sẽ gửi cho bạn những chương trình ưu đãi tour du lịch mới nhất và các cẩm nang du lịch hữu ích định kỳ.</p>"
            . "<p>Chúc bạn một ngày vui vẻ!</p>";
        return $this->send($to, $subject, $body);
    }

    private function sendSmtp(string $to, string $subject, string $body): bool
    {
        $host = getenv('MAIL_SMTP_HOST') ?: 'smtp.gmail.com';
        $port = (int) (getenv('MAIL_SMTP_PORT') ?: 587);
        $user = getenv('MAIL_SMTP_USER') ?: '';
        $pass = getenv('MAIL_SMTP_PASS') ?: '';
        $from = getenv('MAIL_FROM_ADDRESS') ?: $user;
        $fromName = getenv('MAIL_FROM_NAME') ?: 'Viet Horizon Travel';
        $secure = getenv('MAIL_SMTP_SECURE') ?: 'tls';

        $success = $this->executeSmtpSend($to, $subject, $body, $host, $port, $user, $pass, $from, $fromName, $secure);
        if ($success) {
            return true;
        }

        // Auto fallback
        if ($port === 587) {
            error_log("[SMTP Fallback] Port 587 failed. Trying port 465 with SSL...");
            return $this->executeSmtpSend($to, $subject, $body, $host, 465, $user, $pass, $from, $fromName, 'ssl');
        } elseif ($port === 465) {
            error_log("[SMTP Fallback] Port 465 failed. Trying port 587 with TLS...");
            return $this->executeSmtpSend($to, $subject, $body, $host, 587, $user, $pass, $from, $fromName, 'tls');
        }

        return false;
    }

    private function executeSmtpSend(
        string $to,
        string $subject,
        string $body,
        string $host,
        int $port,
        string $user,
        string $pass,
        string $from,
        string $fromName,
        string $secure
    ): bool {
        $prefix = '';
        if (strtolower((string) $secure) === 'ssl') {
            $prefix = 'ssl://';
        }

        $socket = @fsockopen($prefix . $host, $port, $errno, $errstr, 5);
        if (!$socket) {
            error_log("[SMTP Connect Error] $errno: $errstr");
            return false;
        }

        stream_set_timeout($socket, 5);

        $getResponse = function($socket) {
            $res = "";
            while (true) {
                $line = fgets($socket, 512);
                if ($line === false) {
                    break;
                }
                $res .= $line;
                if (strlen($line) >= 4 && $line[3] !== '-') {
                    break;
                }
                $info = stream_get_meta_data($socket);
                if ($info['timed_out']) {
                    error_log("[SMTP Timeout] Socket read timed out");
                    break;
                }
            }
            return trim($res);
        };

        $res = $getResponse($socket);
        if (strpos($res, '220') === false) {
            fclose($socket);
            return false;
        }

        fwrite($socket, "EHLO localhost\r\n");
        $getResponse($socket);

        if (strtolower((string) $secure) === 'tls') {
            fwrite($socket, "STARTTLS\r\n");
            $res = $getResponse($socket);
            if (strpos($res, '220') === false) {
                fclose($socket);
                return false;
            }
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($socket);
                return false;
            }
            fwrite($socket, "EHLO localhost\r\n");
            $getResponse($socket);
        }

        if ($user && $pass) {
            fwrite($socket, "AUTH LOGIN\r\n");
            $res = $getResponse($socket);
            if (strpos($res, '334') === false) {
                fclose($socket);
                return false;
            }

            fwrite($socket, base64_encode($user) . "\r\n");
            $res = $getResponse($socket);
            if (strpos($res, '334') === false) {
                fclose($socket);
                return false;
            }

            fwrite($socket, base64_encode($pass) . "\r\n");
            $res = $getResponse($socket);
            if (strpos($res, '235') === false) {
                fclose($socket);
                return false;
            }
        }

        fwrite($socket, "MAIL FROM:<{$from}>\r\n");
        $getResponse($socket);

        fwrite($socket, "RCPT TO:<{$to}>\r\n");
        $getResponse($socket);

        fwrite($socket, "DATA\r\n");
        $getResponse($socket);

        $headers = [
            "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$from}>",
            "To: <{$to}>",
            "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=",
            "MIME-Version: 1.0",
            "Content-Type: text/html; charset=UTF-8",
            "Content-Transfer-Encoding: 8bit",
            "Date: " . date('r'),
        ];

        $emailContent = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.\r\n";
        fwrite($socket, $emailContent);
        $res = $getResponse($socket);

        fwrite($socket, "QUIT\r\n");
        fclose($socket);

        return strpos($res, '250') !== false;
    }
}
