<?php
declare(strict_types=1);
namespace App\Services;
use App\Core\Config;
use App\Core\Database;

class AiChatService
{
    private string $apiKey;
    private string $model;

    public function __construct()
    {
        $this->apiKey = Config::get('app.gemini_api_key', getenv('GEMINI_API_KEY') ?: '');
        $this->model = Config::get('app.gemini_model', getenv('GEMINI_MODEL') ?: 'gemini-2.0-flash');
    }

    public function chat(string $message): array
    {
        if ($this->apiKey === '') {
            return ['reply' => $this->getFallbackReply($message)];
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

        $systemPrompt = "Bạn là Trợ lý ảo chính thức của hệ thống Viet Horizon Travel.\n"
            . "Nhiệm vụ của bạn là hỗ trợ khách hàng các thông tin liên quan đến hệ thống Viet Horizon Travel như các tour du lịch, điểm đến, đặt vé, thông tin tài khoản (khách du lịch, nhà cung cấp, admin) và liên hệ.\n"
            . "QUY TẮC QUAN TRỌNG:\n"
            . "- CHỈ trả lời các câu hỏi liên quan đến hệ thống Viet Horizon Travel và các dịch vụ du lịch liên quan.\n"
            . "- Tuyệt đối KHÔNG trả lời các câu hỏi ngoài phạm vi như lập trình máy tính, giải toán, khoa học, tư vấn tài chính hoặc kiến thức chung ngoài ngành khác.\n"
            . "- Nếu người dùng hỏi các câu hỏi ngoài phạm vi, hãy từ chối lịch sự bằng tiếng Việt: 'Xin lỗi, tôi là trợ lý du lịch của Viet Horizon Travel nên chỉ có thể hỗ trợ các thông tin liên quan đến các tour du lịch, dịch vụ và tài khoản của hệ thống.'";

        $payload = json_encode([
            'contents' => [
                ['parts' => [['text' => $message]]]
            ],
            'systemInstruction' => [
                'parts' => [
                    ['text' => $systemPrompt]
                ]
            ],
            'generationConfig' => ['maxOutputTokens' => 1024, 'temperature' => 0.5],
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            return ['reply' => $this->getFallbackReply($message)];
        }

        $data = json_decode($response, true);
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'Không có phản hồi.';
        return ['reply' => $text];
    }

    private function getFallbackReply(string $message): string
    {
        $messageLower = mb_strtolower(trim($message), 'UTF-8');

        // 1. Chào hỏi
        if (preg_match('/(xin chào|hello|hi|chào|chao)/iu', $messageLower)) {
            return "Xin chào! Tôi là Trợ lý ảo của Viet Horizon Travel. Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể hỏi tôi về các tour du lịch hiện có, thông tin liên hệ hoặc cách đăng nhập/đăng ký tài khoản.";
        }

        // 2. Thông tin liên hệ
        if (preg_match('/(liên hệ|sđt|điện thoại|email|địa chỉ|hotline|hỗ trợ|lien he)/iu', $messageLower)) {
            return "Bạn có thể liên hệ với Viet Horizon Travel qua các kênh sau:\n- 📞 Hotline: 1900 xxxx (8:00 - 22:00)\n- ✉️ Email: contact@viethorizon.vn\n- 📍 Văn phòng chính: Cần Thơ, TP. Hồ Chí Minh, Hà Nội và Đà Nẵng.";
        }

        // 3. Tài khoản và đăng nhập
        if (preg_match('/(tài khoản|đăng nhập|đăng ký|mật khẩu|admin|provider|tai khoan|dang nhap|dang ky)/iu', $messageLower)) {
            return "Để quản lý đặt tour và tài khoản, bạn hãy truy cập trang Đăng nhập tại: http://localhost/DACS2/pages/login.html\n- Tài khoản Admin: `admin@viethorizon.vn` / `123456`\n- Tài khoản Provider: `provider@viethorizon.vn` / `123456`\n- Tài khoản User: `user@viethorizon.vn` / `123456`";
        }

        // 4. Gợi ý và tìm kiếm Tour
        if (preg_match('/(tour|du lịch|đi đâu|gợi ý|đặt|giá|phú quốc|đà nẵng|hạ long|sapa|đà lạt|nha trang|du lich|goi y)/iu', $messageLower)) {
            try {
                $db = Database::connection();
                // Lấy ra các từ khóa tìm kiếm chính
                $words = explode(' ', $messageLower);
                $keyword = '';
                foreach ($words as $word) {
                    if (strlen($word) > 2 && !in_array($word, ['tour', 'bằng', 'trên', 'trong', 'dưới', 'của', 'cho'])) {
                        $keyword = $word;
                        break;
                    }
                }

                if ($keyword !== '') {
                    $stmt = $db->prepare("SELECT title, price_adult, destination FROM tours WHERE title LIKE :search OR destination LIKE :search LIMIT 3");
                    $stmt->execute(['search' => '%' . $keyword . '%']);
                    $tours = $stmt->fetchAll();
                } else {
                    $tours = [];
                }

                if (empty($tours)) {
                    $stmt = $db->query("SELECT title, price_adult, destination FROM tours ORDER BY id DESC LIMIT 3");
                    $tours = $stmt->fetchAll();
                }

                if (!empty($tours)) {
                    $reply = "Dưới đây là một số tour du lịch nổi bật hiện đang có tại Viet Horizon Travel:\n\n";
                    foreach ($tours as $tour) {
                        $priceFormatted = number_format((float)$tour['price_adult'], 0, ',', '.') . ' VNĐ';
                        $reply .= "- 🌟 **{$tour['title']}** (Điểm đến: {$tour['destination']}) - Giá từ: `{$priceFormatted}`\n";
                    }
                    $reply .= "\nBạn có thể nhấp vào mục **Tour** trên thanh menu để xem chi tiết và đặt lịch trình nhé!";
                    return $reply;
                }
            } catch (\Throwable $e) {
                // Bỏ qua lỗi DB và trả về text tĩnh bên dưới
            }
            return "Viet Horizon Travel cung cấp rất nhiều tour đa dạng như Đà Nẵng - Hội An, Phú Quốc, Sapa, Đà Lạt, Nha Trang, Hạ Long... Bạn có thể xem danh sách đầy đủ tại mục 'Tour' trên thanh điều hướng.";
        }

        // 5. Mặc định
        return "Cảm ơn bạn đã nhắn tin. Hiện tại cổng kết nối AI Cloud của Google đang bận hoặc vượt quá giới hạn lượt dùng thử miễn phí, tuy nhiên bạn có thể tham khảo đầy đủ thông tin về các tour du lịch, tin tức và dịch vụ của Viet Horizon Travel ngay trên thanh menu của trang web nhé! Tôi luôn sẵn sàng hỗ trợ thông tin liên hệ hoặc tài khoản nếu bạn cần.";
    }
}
