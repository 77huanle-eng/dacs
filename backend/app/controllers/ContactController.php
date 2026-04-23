<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Models\Contact;

class ContactController extends Controller
{
    private Contact $contacts;

    public function __construct()
    {
        $this->contacts = new Contact();
    }

    public function create(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'full_name' => 'required|string|min:2|max:120',
            'email' => 'required|email|max:180',
            'phone' => 'phone|max:30',
            'subject' => 'required|string|min:3|max:160',
            'message' => 'required|string|min:10|max:3000',
        ], 'Dữ liệu liên hệ không hợp lệ.');

        $id = $this->contacts->create([
            'full_name' => $payload['full_name'],
            'email' => strtolower(trim((string) $payload['email'])),
            'phone' => $payload['phone'] ?? null,
            'subject' => $payload['subject'],
            'message' => $payload['message'],
            'status' => 'new',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $this->created($this->contacts->find($id), 'Đã gửi liên hệ hỗ trợ thành công.');
    }

    public function subscribe(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'email' => 'required|email|max:180',
            'full_name' => 'max:120',
        ], 'Email đăng ký bản tin không hợp lệ.');

        $email = strtolower(trim((string) $payload['email']));
        $subject = 'NEWSLETTER_SUBSCRIPTION';
        $existing = $this->contacts->firstBy([
            'email' => $email,
            'subject' => $subject,
        ]);

        if ($existing) {
            $this->ok($existing, 'Email đã được đăng ký nhận bản tin từ trước.');
            return;
        }

        $id = $this->contacts->create([
            'full_name' => trim((string) ($payload['full_name'] ?? 'Khách đăng ký bản tin')),
            'email' => $email,
            'phone' => null,
            'subject' => $subject,
            'message' => 'Đăng ký nhận bản tin ưu đãi tour từ website.',
            'status' => 'new',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $this->created($this->contacts->find($id), 'Đăng ký bản tin thành công.');
    }
}
