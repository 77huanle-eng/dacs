# Viet Horizon Travel - Website Tour Du Lịch

Nền tảng đặt tour du lịch giao diện thương mại hoàn chỉnh cho 3 nhóm người dùng:
- `USER`
- `PROVIDER`
- `ADMIN`

Dự án tập trung vào UI/UX hiện đại, cao cấp, đồng bộ, responsive đầy đủ và mô phỏng luồng nghiệp vụ đặt tour thực tế bằng frontend tĩnh.

## 1) Công nghệ sử dụng
- `HTML5`
- `CSS3`
- `JavaScript (Vanilla)`
- `Bootstrap 5`
- `Bootstrap Icons`
- `Chart.js`

## 2) Tính năng nổi bật

### Khu USER
- Trang chủ với hero, tìm kiếm nhanh, tour phổ biến, khuyến mãi, review, bài viết.
- Danh sách tour có `search + filter + sort + pagination`.
- Chi tiết tour: gallery, tab nội dung, booking box sticky, tour liên quan, bình luận.
- Đăng nhập, đăng ký, quên mật khẩu (form validation + password toggle).
- Hồ sơ cá nhân, cập nhật hồ sơ.
- Đặt tour nhiều bước, thanh toán mock, lịch sử đơn, chi tiết đơn, hóa đơn.
- Wishlist (lưu/xóa tour yêu thích).
- Trang bài viết, chi tiết bài viết, liên hệ hỗ trợ.

### Khu PROVIDER
- Dashboard thống kê + biểu đồ booking theo tháng.
- Quản lý thông tin nhà cung cấp.
- Quản lý tour: danh sách, thêm tour, sửa tour.
- Quản lý booking nhận được + drawer chi tiết.
- Quản lý dịch vụ đi kèm.
- Quản lý khuyến mãi.
- Quản lý phản hồi khách hàng.

### Khu ADMIN
- Dashboard SaaS với chỉ số tổng quan + biểu đồ doanh thu/cơ cấu tour.
- CRUD mô phỏng cho: users, roles, tours, categories, bookings, payments, invoices, posts, promotions, providers, comments.
- Trang thống kê chi tiết hệ thống.

## 3) Design System & UI
- Tone màu xanh dương - trắng - xanh ngọc - cam nhấn CTA.
- Card bo góc mềm, shadow tinh tế, badge trạng thái rõ ràng.
- Table, form, button, spacing, border radius đồng bộ toàn hệ thống.
- Motion polish:
  - reveal on-scroll
  - progress bar theo scroll
  - parallax nhẹ khu hero
  - hover micro-interaction cho card/panel

## 4) Cấu trúc thư mục

```text
/ index.html
/ pages/
  tours.html
  tour-detail.html
  login.html
  register.html
  forgot-password.html
  profile.html
  profile-edit.html
  booking.html
  payment.html
  booking-history.html
  booking-detail.html
  invoice.html
  wishlist.html
  posts.html
  post-detail.html
  contact.html

  provider-dashboard.html
  provider-profile.html
  provider-tours.html
  provider-tour-form.html
  provider-tour-edit.html
  provider-bookings.html
  provider-booking-detail.html
  provider-services.html
  provider-promotions.html
  provider-feedback.html

  admin-dashboard.html
  admin-users.html
  admin-roles.html
  admin-tours.html
  admin-categories.html
  admin-bookings.html
  admin-payments.html
  admin-invoices.html
  admin-posts.html
  admin-promotions.html
  admin-providers.html
  admin-comments.html
  admin-stats.html

/ assets/css/style.css
/ assets/js/main.js
/ assets/images/
```

## 5) Cách chạy dự án (XAMPP)
1. Đặt thư mục dự án tại: `c:\xampp\htdocs\dác2`
2. Mở `Apache` trong XAMPP.
3. Truy cập trình duyệt:
   - `http://localhost/d%C3%A1c2/`
   - hoặc mở trực tiếp `http://localhost/d%C3%A1c2/index.html`

## 6) Điều hướng nhanh
- Home: `/index.html`
- Tours: `/pages/tours.html`
- Tour detail: `/pages/tour-detail.html?id=1`
- Booking: `/pages/booking.html?tourId=1`
- Booking history: `/pages/booking-history.html`
- Invoice: `/pages/invoice.html?code=BK2026040101`
- Provider dashboard: `/pages/provider-dashboard.html`
- Admin dashboard: `/pages/admin-dashboard.html`

## 7) Dữ liệu mock và localStorage

### Dữ liệu mock tập trung
Tất cả dữ liệu mẫu được đặt trong `assets/js/main.js`, gồm:
- tours
- providers
- promotions
- posts
- users
- bookings
- comments
- services
- payments (derive)
- invoices (derive)

### LocalStorage keys
- `vh_wishlist`: danh sách tour yêu thích
- `vh_profile`: hồ sơ người dùng
- `vh_booking_draft`: dữ liệu đặt tour tạm
- `vh_recent_filters`: bộ lọc tour gần nhất
- `vh_orders`: đơn mới tạo từ luồng thanh toán mock
- `vh_cancelled_codes`: các mã đơn đã gửi yêu cầu hủy

## 8) Ghi chú quan trọng
- Đây là frontend tĩnh, chưa tích hợp backend/API thật.
- Các thao tác thanh toán/in/tải PDF ở mức mô phỏng UI.
- Có thể gắn backend sau bằng cách thay nguồn dữ liệu trong `main.js` bằng API.

## 9) Đề xuất nâng cấp tiếp
- Tách `main.js` thành module theo domain (`public`, `provider`, `admin`).
- Kết nối API thật + JWT auth + phân quyền route.
- Thêm i18n, Dark mode, unit test cho logic filter/booking.

---

**Thương hiệu giao diện:** Viet Horizon Travel
