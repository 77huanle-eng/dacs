# Viet Horizon Travel

Website tour du lịch đa vai trò `user / provider / admin`.
Frontend chạy bằng `HTML + CSS + JS modules`, backend API chạy bằng `PHP + MySQL + JWT`.

## Báo cáo audit mới
- Xem tại: `README_AUDIT.md`

## Công nghệ
- Frontend: HTML5, CSS3, JavaScript (ES Modules), Bootstrap 5, Bootstrap Icons, Chart.js
- Backend: PHP 8, MySQL, PDO, JWT access/refresh token
- Test: Node test runner (`tests/logic.test.mjs`)

## Cấu trúc chính
- Frontend: `index.html`, `pages/*`, `assets/js/*`, `assets/css/style.css`
- Backend: `backend/public`, `backend/routes`, `backend/app/*`, `backend/database/*`

## Chạy thật (API + DB)
### 1) Khởi động MySQL
Bật MySQL trong XAMPP Control Panel.

### 2) Tạo database và nạp dữ liệu
```bash
C:\xampp\mysql\bin\mysql.exe -uroot -e "CREATE DATABASE IF NOT EXISTS viet_horizon_travel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
C:\xampp\mysql\bin\mysql.exe -uroot viet_horizon_travel < backend\database\schema.sql
C:\xampp\mysql\bin\mysql.exe -uroot viet_horizon_travel < backend\database\seed.sql
```

### Nạp bộ dữ liệu lớn 1000 bản ghi thật (tùy chọn)
Sau khi đã chạy `seed.sql`, có thể nạp thêm bộ dữ liệu lớn để test filter/pagination/dashboard:
```bash
C:\xampp\mysql\bin\mysql.exe -uroot viet_horizon_travel < backend\database\seed_1000.sql
```
Nếu chạy trong PowerShell, dùng:
```powershell
cmd /c "C:\xampp\mysql\bin\mysql.exe -uroot viet_horizon_travel < backend\database\seed_1000.sql"
```
Bộ seed này có kèm ảnh thật:
- `thumbnail` cho toàn bộ tour loadtest
- `tour_images` gallery 3 ảnh/tour (khoảng 3000 ảnh cho 1000 tour)

### Dọn dữ liệu lỗi / dữ liệu test (loadtest)
Nếu cần xóa toàn bộ dữ liệu test đã sinh từ `seed_1000.sql`, chạy:
```bash
C:\xampp\mysql\bin\mysql.exe -uroot viet_horizon_travel < backend\database\cleanup_bad_data.sql
```
PowerShell:
```powershell
cmd /c "C:\xampp\mysql\bin\mysql.exe -uroot viet_horizon_travel < backend\database\cleanup_bad_data.sql"
```

### Sửa dữ liệu tiếng Việt bị lỗi mã hóa (nếu có)
```bash
C:\xampp\mysql\bin\mysql.exe --default-character-set=utf8mb4 -uroot viet_horizon_travel < backend\database\fix_bad_utf8_data.sql
```

### 3) Cấu hình backend env
Dự án đã có `backend/.env` mặc định local.
Nếu cần chỉnh, sửa file này:
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`

### 4) Chạy backend API
```bash
C:\xampp\php\php.exe -S 127.0.0.1:8080 -t backend/public
```
Health check:
- `http://127.0.0.1:8080/api/health`

### 5) Mở frontend
Nếu project nằm ở `C:\xampp\htdocs\DACS2`:
- `http://localhost/DACS2/`

Frontend sẽ gọi API base theo thứ tự ưu tiên:
1. `window.__VHT_API_BASE__`
2. `localStorage.vh_api_base`
3. auto-fallback (`/backend/public/api`, `http://localhost:8080/api`)

## Tài khoản seed (mật khẩu: `123456`)
- `admin@viethorizon.vn`
- `provider@viethorizon.vn`
- `user@viethorizon.vn`

## Lệnh kiểm tra nhanh
```bash
npm test
npm run check:main
```

## Ghi chú
- Các luồng chính đã nối API thật: đăng nhập, profile, tours, wishlist, booking, payment, contact.
- Khu Provider đã có submit API cho hồ sơ, tour form, dịch vụ, khuyến mãi, xác nhận/hủy booking.
- Đã nối thêm các flow thật:
  - user gửi yêu cầu trở thành provider từ trang hồ sơ
  - admin duyệt/từ chối `provider_requests` bằng đúng request id
  - notifications list/read/read-all ở trang hồ sơ
  - user sửa/xóa comment và rating của chính mình tại trang chi tiết tour
- Các thao tác quản trị quan trọng trong `legacy-app.js` không còn dùng `window.prompt()` / `window.confirm()`, đã chuyển sang modal Bootstrap đồng bộ UI.
- Nếu backend không kết nối và **không** bật `vh_allow_local_fallback=1`, frontend sẽ hiển thị trạng thái lỗi thay vì giả dữ liệu như môi trường thật.

## Migration bổ sung
Nếu DB đã tạo từ bản cũ, chạy thêm:
```sql
ALTER TABLE providers ADD COLUMN support_policy TEXT NULL AFTER description;
```
Và bổ sung cột metadata cho bài viết:
```bash
C:\xampp\mysql\bin\mysql.exe -uroot viet_horizon_travel < backend\database\migrate_posts_metadata.sql
```
