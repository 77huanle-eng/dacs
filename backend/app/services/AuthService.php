<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\ApiException;
use App\Core\Config;
use App\Core\Database;
use App\Helpers\JwtHelper;
use App\Helpers\StrHelper;
use App\Models\RefreshToken;
use App\Models\User;
use App\Models\UserProfile;
use PDO;

class AuthService
{
    private PDO $db;
    private User $users;
    private RefreshToken $refreshTokens;
    private UserProfile $profiles;

    public function __construct()
    {
        $this->db = Database::connection();
        $this->users = new User();
        $this->refreshTokens = new RefreshToken();
        $this->profiles = new UserProfile();
    }

    public function register(array $payload): array
    {
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        if ($email === '' || empty($payload['password']) || empty($payload['full_name'])) {
            throw new ApiException('Thiếu thông tin đăng ký bắt buộc.', 422, [
                'full_name' => ['Họ tên là bắt buộc.'],
                'email' => ['Email là bắt buộc.'],
                'password' => ['Mật khẩu là bắt buộc.'],
            ]);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ApiException('Email không đúng định dạng.', 422, ['email' => ['Email không hợp lệ.']]);
        }

        if (strlen((string) $payload['password']) < 6) {
            throw new ApiException('Mật khẩu quá ngắn.', 422, ['password' => ['Mật khẩu tối thiểu 6 ký tự.']]);
        }

        if ($this->users->findByEmail($email)) {
            throw new ApiException('Email đã tồn tại trong hệ thống.', 409, ['email' => ['Email đã được sử dụng.']]);
        }

        $roleId = $this->getRoleIdByName('user');

        $this->db->beginTransaction();
        try {
            $userId = $this->users->create([
                'role_id' => $roleId,
                'full_name' => trim((string) $payload['full_name']),
                'email' => $email,
                'phone' => $payload['phone'] ?? null,
                'password_hash' => password_hash((string) $payload['password'], PASSWORD_DEFAULT),
                'avatar' => $payload['avatar'] ?? null,
                'status' => 'active',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            $this->profiles->create([
                'user_id' => $userId,
                'city' => $payload['city'] ?? null,
                'address' => $payload['address'] ?? null,
                'date_of_birth' => $payload['date_of_birth'] ?? null,
                'gender' => $payload['gender'] ?? null,
                'bio' => $payload['bio'] ?? null,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return $this->login($email, (string) $payload['password']);
    }

    public function login(string $email, string $password): array
    {
        $user = $this->users->findByEmail(strtolower(trim($email)));

        if (!$user || !password_verify($password, (string) $user['password_hash'])) {
            throw new ApiException('Email hoặc mật khẩu không đúng.', 401, [
                'email' => ['Thông tin đăng nhập không hợp lệ.'],
            ]);
        }

        if ($user['status'] !== 'active') {
            throw new ApiException('Tài khoản đã bị khóa hoặc chưa kích hoạt.', 403);
        }

        $authUser = $this->users->findWithRole((int) $user['id']);

        $accessToken = JwtHelper::createAccessToken([
            'sub' => (int) $user['id'],
            'role' => $authUser['role_name'],
            'email' => $user['email'],
        ]);

        $refreshToken = JwtHelper::createRefreshToken();
        $this->refreshTokens->createToken((int) $user['id'], $refreshToken, JwtHelper::refreshExpiresAt());

        return [
            'accessToken' => $accessToken,
            'refreshToken' => $refreshToken,
            'user' => $this->formatUser($authUser),
        ];
    }

    public function refresh(string $refreshToken): array
    {
        if ($refreshToken === '') {
            throw new ApiException('Refresh token là bắt buộc.', 422);
        }

        $tokenRow = $this->refreshTokens->findActiveByToken($refreshToken);
        if (!$tokenRow) {
            throw new ApiException('Refresh token không hợp lệ hoặc đã hết hạn.', 401);
        }

        $user = $this->users->findWithRole((int) $tokenRow['user_id']);
        if (!$user || $user['status'] !== 'active') {
            throw new ApiException('Không tìm thấy tài khoản cho refresh token.', 401);
        }

        $accessToken = JwtHelper::createAccessToken([
            'sub' => (int) $user['id'],
            'role' => $user['role_name'],
            'email' => $user['email'],
        ]);

        $newRefreshToken = JwtHelper::createRefreshToken();

        $this->db->beginTransaction();
        try {
            $this->refreshTokens->revokeToken($refreshToken);
            $this->refreshTokens->createToken((int) $user['id'], $newRefreshToken, JwtHelper::refreshExpiresAt());
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return [
            'accessToken' => $accessToken,
            'refreshToken' => $newRefreshToken,
            'user' => $this->formatUser($user),
        ];
    }

    public function logout(int $userId, string $refreshToken = ''): void
    {
        if ($refreshToken !== '') {
            $tokenRow = $this->refreshTokens->findActiveByToken($refreshToken);
            if ($tokenRow && (int) ($tokenRow['user_id'] ?? 0) === $userId) {
                $this->refreshTokens->revokeToken($refreshToken);
            }
        }

        $this->refreshTokens->revokeByUser($userId);
        $this->users->updateById($userId, [
            'token_invalid_before' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function me(int $userId): array
    {
        $user = $this->users->findWithRole($userId);
        if (!$user) {
            throw new ApiException('Không tìm thấy người dùng.', 404);
        }

        $profile = $this->profiles->firstBy(['user_id' => $userId]);

        return array_merge($this->formatUser($user), [
            'profile' => $profile,
        ]);
    }

    public function updateProfile(int $userId, array $payload): array
    {
        $user = $this->users->find($userId);
        if (!$user) {
            throw new ApiException('Không tìm thấy tài khoản.', 404);
        }

        $userData = [];
        foreach (['full_name', 'phone', 'avatar'] as $field) {
            if (array_key_exists($field, $payload)) {
                $userData[$field] = $payload[$field];
            }
        }

        if (array_key_exists('email', $payload)) {
            $email = strtolower(trim((string) $payload['email']));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new ApiException('Email không đúng định dạng.', 422);
            }

            $exists = $this->users->findByEmail($email);
            if ($exists && (int) $exists['id'] !== $userId) {
                throw new ApiException('Email đã tồn tại.', 409);
            }

            $userData['email'] = $email;
        }

        if ($userData !== []) {
            $userData['updated_at'] = date('Y-m-d H:i:s');
            $this->users->updateById($userId, $userData);
        }

        $profileData = [];
        foreach (['city', 'address', 'date_of_birth', 'gender', 'bio'] as $field) {
            if (array_key_exists($field, $payload)) {
                $profileData[$field] = $payload[$field];
            }
        }

        if ($profileData !== []) {
            $profileData['updated_at'] = date('Y-m-d H:i:s');
            $profile = $this->profiles->firstBy(['user_id' => $userId]);
            if ($profile) {
                $this->profiles->updateById((int) $profile['id'], $profileData);
            } else {
                $profileData['user_id'] = $userId;
                $profileData['created_at'] = date('Y-m-d H:i:s');
                $this->profiles->create($profileData);
            }
        }

        return $this->me($userId);
    }

    public function uploadAvatar(int $userId, array $file): array
    {
        $user = $this->users->find($userId);
        if (!$user) {
            throw new ApiException('Không tìm thấy tài khoản.', 404);
        }

        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error !== UPLOAD_ERR_OK) {
            throw new ApiException('Upload ảnh hồ sơ thất bại. Vui lòng thử lại.', 422);
        }

        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            throw new ApiException('File ảnh hồ sơ không hợp lệ.', 422);
        }

        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > 5 * 1024 * 1024) {
            throw new ApiException('Kích thước ảnh tối đa 5MB.', 422);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = strtolower((string) $finfo->file($tmp));
        $allowed = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (!isset($allowed[$mime])) {
            throw new ApiException('Định dạng ảnh chưa hỗ trợ. Chỉ chấp nhận JPG/PNG/WEBP.', 422);
        }

        $ext = $allowed[$mime];
        $root = dirname(__DIR__, 2);
        $targetDir = $root . '/public/uploads/avatars';
        if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
            throw new ApiException('Không thể tạo thư mục lưu ảnh hồ sơ.', 500);
        }

        $filename = 'avatar-' . $userId . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
        $targetFile = $targetDir . '/' . $filename;
        if (!move_uploaded_file($tmp, $targetFile)) {
            throw new ApiException('Không thể lưu ảnh hồ sơ lên máy chủ.', 500);
        }

        $scriptName = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? ''));
        $publicBase = rtrim(str_replace('/index.php', '', $scriptName), '/');
        if ($publicBase === '') {
            $publicBase = '/backend/public';
        }

        $avatarUrl = $publicBase . '/uploads/avatars/' . $filename;
        $this->users->updateById($userId, [
            'avatar' => $avatarUrl,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->me($userId);
    }

    public function changePassword(int $userId, string $currentPassword, string $newPassword): void
    {
        if (strlen($newPassword) < 6) {
            throw new ApiException('Mật khẩu mới tối thiểu 6 ký tự.', 422);
        }

        $user = $this->users->find($userId);
        if (!$user || !password_verify($currentPassword, (string) $user['password_hash'])) {
            throw new ApiException('Mật khẩu hiện tại không đúng.', 422);
        }

        $this->users->updateById($userId, [
            'password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
            'token_invalid_before' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $this->refreshTokens->revokeByUser($userId);
    }

    public function forgotPassword(string $email): array
    {
        $normalizedEmail = strtolower(trim($email));
        $user = $this->users->findByEmail($normalizedEmail);

        if (!$user) {
            return [
                'email' => $normalizedEmail,
                'sent' => true,
                'expires_in' => 3600,
            ];
        }

        $token = StrHelper::randomString(64);
        $expiresIn = 3600;
        $expiresAt = date('Y-m-d H:i:s', time() + $expiresIn);

        $this->db->beginTransaction();
        try {
            $deleteStmt = $this->db->prepare('DELETE FROM password_resets WHERE email = :email');
            $deleteStmt->execute(['email' => $normalizedEmail]);

            $stmt = $this->db->prepare('INSERT INTO password_resets (email, token, expires_at, created_at) VALUES (:email, :token, :expires_at, NOW())');
            $stmt->execute([
                'email' => $normalizedEmail,
                'token' => hash('sha256', $token),
                'expires_at' => $expiresAt,
            ]);

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        $sent = $this->sendResetPasswordEmail(
            $normalizedEmail,
            (string) ($user['full_name'] ?? ''),
            $token,
            $expiresIn
        );

        $response = [
            'email' => $normalizedEmail,
            'sent' => $sent,
            'expires_in' => $expiresIn,
            'delivery_mode' => $sent ? 'mail' : $this->mailDeliveryMode(),
            'preview_available' => false,
        ];

        if (!$sent && $this->shouldExposeMailPreview()) {
            $response['preview_available'] = true;
            $response['reset_token_preview'] = $token;
            $response['reset_link_preview'] = $this->buildResetLink($normalizedEmail, $token);
            $response['delivery_message'] = 'Mail server chưa gửi thật. Hệ thống đang cung cấp reset link preview cho môi trường phát triển.';
        }

        return $response;
    }

    public function resetPassword(string $email, string $token, string $newPassword): void
    {
        if (strlen($newPassword) < 6) {
            throw new ApiException('Mật khẩu mới tối thiểu 6 ký tự.', 422);
        }

        $hashed = hash('sha256', $token);

        $sql = 'SELECT * FROM password_resets
                WHERE email = :email AND token = :token AND expires_at >= NOW()
                ORDER BY created_at DESC
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'email' => strtolower(trim($email)),
            'token' => $hashed,
        ]);

        $reset = $stmt->fetch();

        if (!$reset) {
            throw new ApiException('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 422);
        }

        $user = $this->users->findByEmail(strtolower(trim($email)));
        if (!$user) {
            throw new ApiException('Không tìm thấy tài khoản tương ứng.', 404);
        }

        $this->db->beginTransaction();
        try {
            $this->users->updateById((int) $user['id'], [
                'password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
                'token_invalid_before' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            $deleteStmt = $this->db->prepare('DELETE FROM password_resets WHERE email = :email');
            $deleteStmt->execute(['email' => strtolower(trim($email))]);

            $this->refreshTokens->revokeByUser((int) $user['id']);

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private function sendResetPasswordEmail(string $email, string $fullName, string $token, int $expiresIn): bool
    {
        $mailConfig = Config::get('app.mail', []);
        $transport = strtolower(trim((string) ($mailConfig['transport'] ?? 'mail')));

        if ($transport === 'log') {
            $this->logMailFailure($email, 'Dat lai mat khau - Viet Horizon Travel', $this->buildResetLink($email, $token), 'preview-only');
            return false;
        }

        $fromAddress = (string) ($mailConfig['from_address'] ?? 'no-reply@viethorizon.vn');
        $fromName = (string) ($mailConfig['from_name'] ?? 'Viet Horizon Travel');

        $smtpHost = trim((string) ($mailConfig['smtp_host'] ?? ''));
        $smtpPort = (int) ($mailConfig['smtp_port'] ?? 25);

        if ($smtpHost !== '') {
            @ini_set('SMTP', $smtpHost);
            if ($smtpPort > 0) {
                @ini_set('smtp_port', (string) $smtpPort);
            }
            @ini_set('sendmail_from', $fromAddress);
        }

        $subject = 'Dat lai mat khau - Viet Horizon Travel';
        $displayName = trim($fullName) !== '' ? trim($fullName) : 'Ban';
        $resetLink = $this->buildResetLink($email, $token);

        $message = "Xin chao {$displayName},\n\n";
        $message .= "Chung toi da nhan duoc yeu cau dat lai mat khau cho tai khoan cua ban.\n";
        $message .= "Lien ket dat lai mat khau (hieu luc {$expiresIn} giay):\n{$resetLink}\n\n";
        $message .= "Neu ban khong thuc hien yeu cau nay, vui long bo qua email nay.\n\n";
        $message .= "Viet Horizon Travel";

        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'From: ' . $fromName . ' <' . $fromAddress . '>',
            'Reply-To: ' . $fromAddress,
        ];

        $sent = @mail($email, $subject, $message, implode("\r\n", $headers));
        if (!$sent) {
            $this->logMailFailure($email, $subject, $resetLink, 'mail()-failed');
        }

        return $sent;
    }

    private function buildResetLink(string $email, string $token): string
    {
        $frontend = rtrim((string) Config::get('app.frontend_url', 'http://localhost'), '/');
        return $frontend . '/pages/forgot-password.html?email=' . rawurlencode($email) . '&token=' . rawurlencode($token);
    }

    private function logMailFailure(string $email, string $subject, string $resetLink, string $reason = 'mail-failed'): void
    {
        $root = dirname(__DIR__, 2);
        $dir = $root . '/storage/logs';
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        $line = sprintf(
            "[%s] mail_failed reason=%s to=%s subject=%s link=%s%s",
            date('Y-m-d H:i:s'),
            $reason,
            $email,
            $subject,
            $resetLink,
            PHP_EOL
        );

        @file_put_contents($dir . '/mail.log', $line, FILE_APPEND);
    }

    private function shouldExposeMailPreview(): bool
    {
        if ((bool) Config::get('app.debug', false)) {
            return true;
        }

        return (bool) Config::get('app.mail.log_preview', false);
    }

    private function mailDeliveryMode(): string
    {
        $transport = strtolower(trim((string) Config::get('app.mail.transport', 'mail')));
        return $transport === 'log' ? 'log' : 'mail-fallback';
    }
    private function getRoleIdByName(string $name): int
    {
        $stmt = $this->db->prepare('SELECT id FROM roles WHERE name = :name LIMIT 1');
        $stmt->execute(['name' => $name]);
        $row = $stmt->fetch();

        if (!$row) {
            throw new ApiException('Chưa cấu hình role mặc định.', 500);
        }

        return (int) $row['id'];
    }

    private function formatUser(array $user): array
    {
        return [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'avatar' => $user['avatar'],
            'status' => $user['status'],
            'role' => $user['role_name'] ?? null,
            'created_at' => $user['created_at'] ?? null,
        ];
    }
}
