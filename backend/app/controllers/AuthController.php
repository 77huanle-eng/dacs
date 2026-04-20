<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Request;
use App\Services\AuthService;

class AuthController extends Controller
{
    private AuthService $auth;

    public function __construct()
    {
        $this->auth = new AuthService();
    }

    public function register(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'full_name' => 'required|string|min:2|max:120',
            'email' => 'required|email|max:180',
            'phone' => 'phone|max:30',
            'password' => 'required|min:6|max:255',
        ], 'Dữ liệu đăng ký không hợp lệ.');

        $result = $this->auth->register($payload);
        $this->created($result, 'Đăng ký tài khoản thành công.');
    }

    public function login(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'email' => 'required|email',
            'password' => 'required|min:6',
        ], 'Thông tin đăng nhập không hợp lệ.');

        $result = $this->auth->login((string) $payload['email'], (string) $payload['password']);
        $this->ok($result, 'Đăng nhập thành công.');
    }

    public function refresh(Request $request, array $params): void
    {
        $refreshToken = (string) ($request->input('refreshToken') ?? $request->header('X-Refresh-Token', ''));
        $result = $this->auth->refresh($refreshToken);
        $this->ok($result, 'Refresh token thành công.');
    }

    public function logout(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $refreshToken = (string) ($request->input('refreshToken') ?? $request->header('X-Refresh-Token', ''));
        $this->auth->logout((int) $user['id'], $refreshToken);
        $this->ok(null, 'Đăng xuất thành công.');
    }

    public function me(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $data = $this->auth->me((int) $user['id']);
        $this->ok($data, 'Lấy thông tin người dùng thành công.');
    }

    public function forgotPassword(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, ['email' => 'required|email'], 'Email không hợp lệ.');

        $data = $this->auth->forgotPassword((string) $payload['email']);
        $this->ok($data, 'Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.');
    }

    public function resetPassword(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'email' => 'required|email',
            'token' => 'required|min:10',
            'password' => 'required|min:6|max:255',
        ], 'Dữ liệu reset password không hợp lệ.');

        $this->auth->resetPassword(
            (string) $payload['email'],
            (string) $payload['token'],
            (string) $payload['password']
        );

        $this->ok(null, 'Đặt lại mật khẩu thành công.');
    }

    public function changePassword(Request $request, array $params): void
    {
        $payload = $request->input();
        $this->validatePayload($payload, [
            'current_password' => 'required|min:6',
            'new_password' => 'required|min:6|max:255',
            'confirm_password' => 'max:255',
        ], 'Dữ liệu đổi mật khẩu không hợp lệ.');

        $confirmPassword = (string) ($payload['confirm_password'] ?? '');
        if ($confirmPassword !== '' && $confirmPassword !== (string) $payload['new_password']) {
            throw new ApiException('Xác nhận mật khẩu mới không khớp.', 422, [
                'confirm_password' => ['Xác nhận mật khẩu mới không khớp.'],
            ]);
        }

        $user = $request->attribute('auth_user');
        $this->auth->changePassword((int) $user['id'], (string) $payload['current_password'], (string) $payload['new_password']);

        $this->ok(null, 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
    }
}
