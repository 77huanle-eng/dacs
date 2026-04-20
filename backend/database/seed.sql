USE `viet_horizon_travel`;

SET NAMES utf8mb4;

-- Dọn dữ liệu loadtest/fake cũ (nếu có)
DELETE pt
FROM promotion_tours pt
INNER JOIN promotions p ON p.id = pt.promotion_id
WHERE p.code LIKE 'LTP%';

DELETE ti
FROM tour_images ti
INNER JOIN tours t ON t.id = ti.tour_id
WHERE t.slug LIKE 'loadtest-tour-%';

DELETE bt
FROM booking_travelers bt
INNER JOIN bookings b ON b.id = bt.booking_id
INNER JOIN tours t ON t.id = b.tour_id
WHERE t.slug LIKE 'loadtest-tour-%';

DELETE p
FROM payments p
INNER JOIN bookings b ON b.id = p.booking_id
INNER JOIN tours t ON t.id = b.tour_id
WHERE t.slug LIKE 'loadtest-tour-%';

DELETE i
FROM invoices i
INNER JOIN bookings b ON b.id = i.booking_id
INNER JOIN tours t ON t.id = b.tour_id
WHERE t.slug LIKE 'loadtest-tour-%';

DELETE b
FROM bookings b
INNER JOIN tours t ON t.id = b.tour_id
WHERE t.slug LIKE 'loadtest-tour-%';

DELETE w
FROM wishlists w
INNER JOIN tours t ON t.id = w.tour_id
WHERE t.slug LIKE 'loadtest-tour-%';

DELETE r
FROM ratings r
INNER JOIN tours t ON t.id = r.tour_id
WHERE t.slug LIKE 'loadtest-tour-%';

DELETE c
FROM comments c
INNER JOIN tours t ON t.id = c.tour_id
WHERE t.slug LIKE 'loadtest-tour-%';

DELETE FROM tours WHERE slug LIKE 'loadtest-tour-%';
DELETE FROM posts WHERE slug LIKE 'loadtest-post-%';
DELETE FROM promotions WHERE code LIKE 'LTP%';
DELETE FROM categories
WHERE slug = 'kham-pha-tong-hop'
  AND NOT EXISTS (
      SELECT 1
      FROM tours t
      WHERE t.category_id = categories.id
  );

-- Dọn bản ghi placeholder/vô nghĩa
DELETE FROM posts
WHERE title IS NULL OR TRIM(title) = ''
   OR content IS NULL OR TRIM(content) = ''
   OR LOWER(title) REGEXP '(demo|test|lorem|sample)';

DELETE FROM promotions
WHERE code IS NULL OR TRIM(code) = ''
   OR discount_value <= 0
   OR end_date < start_date;

DELETE FROM tours
WHERE title IS NULL OR TRIM(title) = ''
   OR destination IS NULL OR TRIM(destination) = ''
   OR price_adult <= 0
   OR LOWER(title) REGEXP '(^tour[[:space:]]*[0-9]+$|demo|test|abc|lorem)';

SET @seed_password_hash = '$2y$10$8Db9eby.OONDPsaHQja6.Oxy2XsoV2NqK8w9fUiiqv0Gl/mK/7Ys6';

INSERT INTO roles (name, description) VALUES
('admin', 'Quản trị hệ thống'),
('provider', 'Nhà cung cấp tour'),
('user', 'Khách hàng')
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    updated_at = NOW();

DROP TEMPORARY TABLE IF EXISTS tmp_seed_users;
CREATE TEMPORARY TABLE tmp_seed_users (
    role_name VARCHAR(50) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    status ENUM('active','inactive','blocked') NOT NULL
);

INSERT INTO tmp_seed_users VALUES
('admin', 'Quản trị viên hệ thống', 'admin@viethorizon.vn', '0900000001', 'active'),
('provider', 'Sunrise Destination', 'provider@viethorizon.vn', '0900000002', 'active'),
('provider', 'Horizon Premium Travel', 'provider2@viethorizon.vn', '0900000005', 'active'),
('provider', 'Indochina Elite Tours', 'provider3@viethorizon.vn', '0900000006', 'active'),
('user', 'Nguyễn Văn An', 'user@viethorizon.vn', '0900000003', 'active'),
('user', 'Trần Thị Minh', 'user2@viethorizon.vn', '0900000004', 'active'),
('user', 'Lê Hoàng Phúc', 'user3@viethorizon.vn', '0900000007', 'active'),
('user', 'Phạm Ngọc Linh', 'user4@viethorizon.vn', '0900000008', 'active');

INSERT INTO users (role_id, full_name, email, phone, password_hash, status, created_at, updated_at)
SELECT r.id, u.full_name, u.email, u.phone, @seed_password_hash, u.status, NOW(), NOW()
FROM tmp_seed_users u
JOIN roles r ON r.name = u.role_name
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id),
    full_name = VALUES(full_name),
    phone = VALUES(phone),
    password_hash = VALUES(password_hash),
    status = VALUES(status),
    updated_at = NOW();

INSERT INTO user_profiles (user_id, city, address, date_of_birth, gender, bio, created_at, updated_at)
SELECT u.id,
       CASE
         WHEN u.email = 'user@viethorizon.vn' THEN 'TP. Hồ Chí Minh'
         WHEN u.email = 'user2@viethorizon.vn' THEN 'Hà Nội'
         WHEN u.email = 'user3@viethorizon.vn' THEN 'Đà Nẵng'
         WHEN u.email = 'user4@viethorizon.vn' THEN 'Cần Thơ'
         ELSE NULL
       END,
       CASE
         WHEN u.email = 'user@viethorizon.vn' THEN 'Quận 1, TP. Hồ Chí Minh'
         WHEN u.email = 'user2@viethorizon.vn' THEN 'Cầu Giấy, Hà Nội'
         WHEN u.email = 'user3@viethorizon.vn' THEN 'Sơn Trà, Đà Nẵng'
         WHEN u.email = 'user4@viethorizon.vn' THEN 'Ninh Kiều, Cần Thơ'
         ELSE NULL
       END,
       CASE
         WHEN u.email = 'user@viethorizon.vn' THEN '1995-06-18'
         WHEN u.email = 'user2@viethorizon.vn' THEN '1994-09-02'
         WHEN u.email = 'user3@viethorizon.vn' THEN '1997-03-15'
         WHEN u.email = 'user4@viethorizon.vn' THEN '1998-12-09'
         ELSE NULL
       END,
       CASE
         WHEN u.email IN ('user@viethorizon.vn', 'user3@viethorizon.vn') THEN 'male'
         WHEN u.email IN ('user2@viethorizon.vn', 'user4@viethorizon.vn') THEN 'female'
         ELSE NULL
       END,
       CASE
         WHEN u.email = 'user@viethorizon.vn' THEN 'Ưa trải nghiệm biển đảo, du lịch cùng gia đình vào mùa hè.'
         WHEN u.email = 'user2@viethorizon.vn' THEN 'Thích city break cuối tuần và ẩm thực địa phương.'
         WHEN u.email = 'user3@viethorizon.vn' THEN 'Ưu tiên tour leo núi và thiên nhiên, chụp ảnh phong cảnh.'
         WHEN u.email = 'user4@viethorizon.vn' THEN 'Đam mê tour quốc tế và khám phá văn hóa.'
         ELSE NULL
       END,
       NOW(),
       NOW()
FROM users u
WHERE u.email IN ('user@viethorizon.vn', 'user2@viethorizon.vn', 'user3@viethorizon.vn', 'user4@viethorizon.vn')
ON DUPLICATE KEY UPDATE
    city = VALUES(city),
    address = VALUES(address),
    date_of_birth = VALUES(date_of_birth),
    gender = VALUES(gender),
    bio = VALUES(bio),
    updated_at = NOW();

DROP TEMPORARY TABLE IF EXISTS tmp_seed_providers;
CREATE TEMPORARY TABLE tmp_seed_providers (
    user_email VARCHAR(180) NOT NULL,
    company_name VARCHAR(160) NOT NULL,
    tax_code VARCHAR(80) NOT NULL,
    business_license VARCHAR(255) NOT NULL,
    description TEXT,
    support_policy TEXT,
    address VARCHAR(255),
    contact_email VARCHAR(180),
    contact_phone VARCHAR(30),
    status ENUM('pending','active','inactive','rejected') NOT NULL
);

INSERT INTO tmp_seed_providers VALUES
('provider@viethorizon.vn', 'Sunrise Destination', '0312345678', 'GPKD-001', 'Đơn vị tổ chức tour biển và nghỉ dưỡng nội địa phân khúc trung cao.', 'Đổi lịch 1 lần miễn phí trước 7 ngày khởi hành.', 'Đà Nẵng', 'provider@viethorizon.vn', '0900000002', 'active'),
('provider2@viethorizon.vn', 'Horizon Premium Travel', '0312345679', 'GPKD-002', 'Đơn vị chuyên tour quốc tế, visa đoàn và hành trình cao cấp.', 'Hỗ trợ thủ tục visa trọn gói và tổng đài 24/7.', 'TP. Hồ Chí Minh', 'provider2@viethorizon.vn', '0900000005', 'active'),
('provider3@viethorizon.vn', 'Indochina Elite Tours', '0312345680', 'GPKD-003', 'Đơn vị tổ chức tour văn hóa di sản và tuyến trekking chuyên sâu.', 'Linh hoạt đổi lịch trước 10 ngày, hỗ trợ riêng cho nhóm đoàn.', 'Hà Nội', 'provider3@viethorizon.vn', '0900000006', 'active');

INSERT INTO providers (
    user_id,
    company_name,
    tax_code,
    business_license,
    description,
    support_policy,
    logo,
    address,
    contact_email,
    contact_phone,
    status,
    approved_at,
    created_at,
    updated_at
)
SELECT u.id,
       p.company_name,
       p.tax_code,
       p.business_license,
       p.description,
       p.support_policy,
       NULL,
       p.address,
       p.contact_email,
       p.contact_phone,
       p.status,
       NOW(),
       NOW(),
       NOW()
FROM tmp_seed_providers p
JOIN users u ON u.email = p.user_email
ON DUPLICATE KEY UPDATE
    company_name = VALUES(company_name),
    tax_code = VALUES(tax_code),
    business_license = VALUES(business_license),
    description = VALUES(description),
    support_policy = VALUES(support_policy),
    address = VALUES(address),
    contact_email = VALUES(contact_email),
    contact_phone = VALUES(contact_phone),
    status = VALUES(status),
    approved_at = VALUES(approved_at),
    updated_at = NOW();

INSERT INTO categories (name, slug, description, image, status, created_at, updated_at) VALUES
('Biển Nghỉ Dưỡng', 'bien-nghi-duong', 'Tour biển đảo và nghỉ dưỡng cao cấp.', NULL, 'active', NOW(), NOW()),
('Săn Mây Núi Rừng', 'san-may-nui-rung', 'Tour thiên nhiên, săn mây, trekking nhẹ đến trung bình.', NULL, 'active', NOW(), NOW()),
('Quốc Tế Cao Cấp', 'quoc-te-cao-cap', 'Tour quốc tế chuẩn 4-5 sao, có visa hỗ trợ.', NULL, 'active', NOW(), NOW()),
('Văn Hóa Di Sản', 'van-hoa-di-san', 'Tour tìm hiểu lịch sử, di sản và văn hóa bản địa.', NULL, 'active', NOW(), NOW()),
('Gia Đình Vui Chơi', 'gia-dinh-vui-choi', 'Tour phù hợp gia đình có trẻ nhỏ và người lớn tuổi.', NULL, 'active', NOW(), NOW()),
('City Break', 'city-break', 'Tour ngắn ngày khám phá đô thị, ẩm thực và mua sắm.', NULL, 'active', NOW(), NOW()),
('Adventure Trekking', 'adventure-trekking', 'Tour vận động ngoài trời, trekking và cắm trại.', NULL, 'active', NOW(), NOW()),
('Honeymoon Luxury', 'honeymoon-luxury', 'Tour nghỉ dưỡng trăng mật, resort riêng tư.', NULL, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    image = VALUES(image),
    status = VALUES(status),
    updated_at = NOW();

DROP TEMPORARY TABLE IF EXISTS tmp_seed_tours;
CREATE TEMPORARY TABLE tmp_seed_tours (
    provider_email VARCHAR(180) NOT NULL,
    category_slug VARCHAR(160) NOT NULL,
    title VARCHAR(180) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    destination VARCHAR(180) NOT NULL,
    departure_location VARCHAR(180) NOT NULL,
    duration_days INT UNSIGNED NOT NULL,
    duration_nights INT UNSIGNED NOT NULL,
    price_adult DECIMAL(15,2) NOT NULL,
    price_child DECIMAL(15,2) NOT NULL,
    discount_price DECIMAL(15,2) NULL,
    thumbnail VARCHAR(255) NOT NULL,
    short_description TEXT,
    description LONGTEXT,
    itinerary LONGTEXT,
    included_services LONGTEXT,
    excluded_services LONGTEXT,
    policy LONGTEXT,
    departure_offset_day INT NOT NULL,
    status ENUM('draft','active','inactive','archived') NOT NULL,
    is_featured TINYINT(1) NOT NULL,
    max_guests INT UNSIGNED NOT NULL,
    available_slots INT UNSIGNED NOT NULL
);

INSERT INTO tmp_seed_tours VALUES
('provider@viethorizon.vn', 'bien-nghi-duong', 'Đà Nẵng - Hội An 3N2Đ', 'da-nang-hoi-an-3n2d', 'Đà Nẵng', 'TP. Hồ Chí Minh', 3, 2, 4590000, 3190000, 4190000, 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80', 'Khám phá Bà Nà Hills và phố cổ Hội An với lịch trình tối ưu cuối tuần.', 'Hành trình cân bằng giữa nghỉ dưỡng biển, tham quan biểu tượng Đà Nẵng và trải nghiệm phố cổ về đêm.', 'Ngày 1: Bay đến Đà Nẵng, check-in khách sạn, tham quan bán đảo Sơn Trà và cầu Rồng.|Ngày 2: Bà Nà Hills, Cầu Vàng, tối dạo Hội An và thả đèn hoa đăng.|Ngày 3: Mua sắm đặc sản, tự do tắm biển Mỹ Khê, ra sân bay.', 'Vé máy bay khứ hồi; Khách sạn 4 sao; Ăn sáng + 3 bữa chính; Vé tham quan theo chương trình; HDV suốt tuyến.', 'Chi phí cá nhân; Đồ uống ngoài menu; Thuế VAT theo yêu cầu xuất hóa đơn.', 'Hủy trước 7 ngày hoàn 80%; trước 3 ngày hoàn 50%; dưới 72 giờ không hoàn.', 12, 'active', 1, 40, 32),
('provider@viethorizon.vn', 'bien-nghi-duong', 'Phú Quốc Nghỉ Dưỡng 4N3Đ', 'phu-quoc-nghi-duong-4n3d', 'Phú Quốc', 'TP. Hồ Chí Minh', 4, 3, 6890000, 4990000, 6390000, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 'Combo nghỉ dưỡng biển đảo, cano 4 đảo và resort gần trung tâm.', 'Tour phù hợp nhóm bạn và gia đình muốn kết hợp nghỉ dưỡng cao cấp và trải nghiệm biển đảo.', 'Ngày 1: Bay đến Phú Quốc, nhận phòng resort, ngắm hoàng hôn Dinh Cậu.|Ngày 2: Cano 4 đảo, lặn ngắm san hô và chụp ảnh flycam.|Ngày 3: Grand World hoặc Safari tự do lựa chọn.|Ngày 4: Chợ Dương Đông, trả phòng và bay về.', 'Vé máy bay; Resort 4 sao; Tour cano 4 đảo; Xe đưa đón sân bay; Bảo hiểm du lịch.', 'Chi phí vui chơi tự chọn tại công viên chủ đề; Thuê thiết bị quay chụp cá nhân.', 'Được đổi lịch 1 lần trước 5 ngày; hủy trong 5 ngày áp dụng phí 40%.', 18, 'active', 1, 38, 30),
('provider3@viethorizon.vn', 'san-may-nui-rung', 'Đà Lạt Săn Mây 3N2Đ', 'da-lat-san-may-3n2d', 'Đà Lạt', 'TP. Hồ Chí Minh', 3, 2, 3990000, 2890000, 3590000, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80', 'Lịch trình săn mây Cầu Đất, cafe rừng và đồi thông ngoại ô.', 'Hành trình thiên nhiên nhẹ nhàng, nhiều điểm check-in đẹp cho nhóm trẻ và cặp đôi.', 'Ngày 1: Di chuyển đến Đà Lạt, tham quan hồ Xuân Hương và quảng trường Lâm Viên.|Ngày 2: Săn mây Cầu Đất, vườn hoa, trải nghiệm cafe rừng.|Ngày 3: Chợ Đà Lạt, mua đặc sản, trở về.', 'Xe limousine; Khách sạn 3 sao trung tâm; Vé tham quan cơ bản; HDV địa phương.', 'Chi phí ăn tối tự do và dịch vụ xe jeep riêng tại đồi chè.', 'Hủy trước 6 ngày hoàn 80%; hủy trước 2 ngày hoàn 40%.', 15, 'active', 0, 32, 26),
('provider@viethorizon.vn', 'gia-dinh-vui-choi', 'Nha Trang VinWonders 3N2Đ', 'nha-trang-vinwonders-3n2d', 'Nha Trang', 'TP. Hồ Chí Minh', 3, 2, 4390000, 3190000, 3990000, 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80', 'Tour biển gia đình kết hợp vui chơi công viên chủ đề trọn ngày.', 'Thiết kế cho gia đình có trẻ nhỏ với nhịp đi chậm, ưu tiên thời gian nghỉ ngơi.', 'Ngày 1: Nhận phòng khách sạn, city tour nhẹ quanh trung tâm.|Ngày 2: Vui chơi VinWonders cả ngày, cáp treo khứ hồi.|Ngày 3: Tắm biển buổi sáng, mua đặc sản về lại TP. Hồ Chí Minh.', 'Xe di chuyển khứ hồi; Khách sạn 4 sao; Vé VinWonders; 2 bữa chính; HDV.', 'Chi phí trò chơi tính điểm và ăn uống phát sinh ngoài chương trình.', 'Trẻ em dưới 5 tuổi miễn phí dịch vụ tour cơ bản; hủy trước 5 ngày hoàn 70%.', 20, 'active', 1, 42, 34),
('provider3@viethorizon.vn', 'van-hoa-di-san', 'Huế - Đà Nẵng Di Sản 4N3Đ', 'hue-da-nang-di-san-4n3d', 'Huế - Đà Nẵng', 'Hà Nội', 4, 3, 6290000, 4590000, 5790000, 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?auto=format&fit=crop&w=1200&q=80', 'Khám phá Đại Nội Huế, đèo Hải Vân và ẩm thực miền Trung.', 'Hành trình văn hóa di sản kết hợp nghỉ dưỡng nhẹ tại biển miền Trung.', 'Ngày 1: Bay đến Huế, tham quan Đại Nội và chùa Thiên Mụ.|Ngày 2: Lăng Khải Định, trải nghiệm ca Huế trên sông Hương.|Ngày 3: Di chuyển đèo Hải Vân, tham quan Đà Nẵng.|Ngày 4: Tự do mua sắm và trở về.', 'Vé máy bay; Khách sạn 4 sao; Vé di tích; HDV; Nước suối mỗi ngày.', 'Chi phí xe điện trong khu di tích và tip cá nhân.', 'Hủy trước 7 ngày hoàn 80%; hủy trong 72 giờ hoàn 30%.', 24, 'active', 0, 36, 28),
('provider3@viethorizon.vn', 'san-may-nui-rung', 'Sapa Fansipan 3N2Đ', 'sapa-fansipan-3n2d', 'Sapa', 'Hà Nội', 3, 2, 4290000, 3090000, 3890000, 'https://images.unsplash.com/photo-1577648188599-291bb8b831c3?auto=format&fit=crop&w=1200&q=80', 'Bản Cát Cát, cáp treo Fansipan và chợ đêm Sapa.', 'Tour phù hợp khách muốn trải nghiệm khí hậu vùng cao và thiên nhiên Tây Bắc.', 'Ngày 1: Di chuyển Hà Nội - Sapa, tham quan bản Cát Cát.|Ngày 2: Cáp treo Fansipan, tự do thị trấn.|Ngày 3: Chợ Sapa, về Hà Nội.', 'Xe limousine; Khách sạn 4 sao; Vé cáp treo Fansipan; 2 bữa chính.', 'Đồ uống đặc biệt, thuê trang phục dân tộc chụp ảnh.', 'Đổi ngày miễn phí trước 5 ngày; hủy trước 3 ngày hoàn 50%.', 16, 'active', 1, 34, 27),
('provider3@viethorizon.vn', 'adventure-trekking', 'Hà Giang Cao Nguyên Đá 4N3Đ', 'ha-giang-cao-nguyen-da-4n3d', 'Hà Giang', 'Hà Nội', 4, 3, 5790000, 4290000, 5390000, 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?auto=format&fit=crop&w=1200&q=80', 'Cung đường đèo Mã Pí Lèng và trải nghiệm văn hóa bản địa vùng cao.', 'Hành trình thiên nhiên và văn hóa dành cho khách yêu thích cung đường núi Đông Bắc.', 'Ngày 1: Hà Nội - Hà Giang, tham quan cột mốc Km0.|Ngày 2: Quản Bạ, Yên Minh, Đồng Văn.|Ngày 3: Mã Pí Lèng, du thuyền sông Nho Quế.|Ngày 4: Làng văn hóa Lô Lô, quay về Hà Nội.', 'Xe giường nằm cabin; Homestay tiêu chuẩn sạch; Vé tham quan; HDV địa phương.', 'Chi phí thuê xe máy tự lái và chi phí cá nhân tại bản.', 'Yêu cầu sức khỏe tốt; hủy trước 7 ngày hoàn 75%.', 28, 'active', 0, 24, 18),
('provider@viethorizon.vn', 'bien-nghi-duong', 'Quy Nhơn - Kỳ Co 3N2Đ', 'quy-nhon-ky-co-3n2d', 'Quy Nhơn', 'TP. Hồ Chí Minh', 3, 2, 4690000, 3390000, 4290000, 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80', 'Biển xanh Kỳ Co, Eo Gió và đặc sản miền Trung.', 'Tour biển trong nước giá tốt, phù hợp nhóm bạn và gia đình trẻ.', 'Ngày 1: Bay đến Quy Nhơn, city tour nhẹ.|Ngày 2: Cano Kỳ Co - Eo Gió, tắm biển.|Ngày 3: Ghé chợ địa phương, bay về TP. Hồ Chí Minh.', 'Vé máy bay; Khách sạn 4 sao; Cano đảo; HDV và bảo hiểm.', 'Chi phí vui chơi tự chọn và hải sản ngoài thực đơn.', 'Hủy trước 6 ngày hoàn 75%; hủy trong 48 giờ hoàn 20%.', 22, 'active', 0, 35, 27),
('provider@viethorizon.vn', 'bien-nghi-duong', 'Phan Thiết - Mũi Né 3N2Đ', 'phan-thiet-mui-ne-3n2d', 'Phan Thiết', 'TP. Hồ Chí Minh', 3, 2, 3790000, 2790000, 3490000, 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80', 'Đồi cát bay, làng chài Mũi Né và nghỉ dưỡng biển ngắn ngày.', 'Lịch trình dễ đi, thời gian di chuyển ngắn, phù hợp chuyến nghỉ cuối tuần.', 'Ngày 1: Di chuyển đến Mũi Né, check-in resort.|Ngày 2: Jeep tour đồi cát, suối Tiên.|Ngày 3: Tắm biển sáng và về lại TP. Hồ Chí Minh.', 'Xe giường nằm khứ hồi; Resort 4 sao; Vé xe jeep; HDV tuyến.', 'Chi phí trượt cát và ăn uống tự do buổi tối.', 'Hủy trước 4 ngày hoàn 70%; dưới 2 ngày không hoàn.', 10, 'active', 0, 30, 24),
('provider3@viethorizon.vn', 'city-break', 'Cần Thơ Chợ Nổi 2N1Đ', 'can-tho-cho-noi-2n1d', 'Cần Thơ', 'TP. Hồ Chí Minh', 2, 1, 2490000, 1790000, 2290000, 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1200&q=80', 'Trải nghiệm chợ nổi Cái Răng và ẩm thực miền Tây trong 2 ngày.', 'Tour ngắn ngày nhẹ nhàng, tập trung trải nghiệm văn hóa sông nước Nam Bộ.', 'Ngày 1: TP. Hồ Chí Minh - Cần Thơ, tham quan bến Ninh Kiều.|Ngày 2: Chợ nổi Cái Răng sáng sớm, về lại TP. Hồ Chí Minh.', 'Xe đưa đón; Khách sạn 3 sao; Thuyền chợ nổi; 2 bữa chính.', 'Ăn uống phát sinh và trải nghiệm tự chọn.', 'Hủy trước 3 ngày hoàn 70%; hủy trước 24 giờ hoàn 30%.', 8, 'active', 0, 28, 23),
('provider2@viethorizon.vn', 'quoc-te-cao-cap', 'Bangkok - Pattaya 5N4Đ', 'bangkok-pattaya-5n4d', 'Bangkok - Pattaya', 'TP. Hồ Chí Minh', 5, 4, 11990000, 8990000, 10990000, 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80', 'Tour Thái Lan trọn gói, khách sạn trung tâm và lịch trình mua sắm.', 'Hành trình quốc tế phổ biến cho lần đi đầu với nhiều điểm check-in nổi bật.', 'Ngày 1: Bay đến Bangkok, về Pattaya nghỉ đêm.|Ngày 2: Đảo Coral, trải nghiệm biển.|Ngày 3: Chợ nổi và về Bangkok.|Ngày 4: Wat Arun, IconSiam, mua sắm.|Ngày 5: Ra sân bay, về Việt Nam.', 'Vé máy bay quốc tế; Khách sạn 4 sao; Bữa ăn theo chương trình; HDV song ngữ.', 'Phí hộ chiếu, tip bắt buộc theo quy định đoàn.', 'Hủy trước 15 ngày hoàn 70%; trước 7 ngày hoàn 30%.', 22, 'active', 1, 38, 30),
('provider2@viethorizon.vn', 'quoc-te-cao-cap', 'Hàn Quốc Mùa Lá Đỏ 6N5Đ', 'han-quoc-mua-la-do-6n5d', 'Seoul - Nami - Everland', 'Hà Nội', 6, 5, 21990000, 17990000, 20500000, 'https://images.unsplash.com/photo-1538485399081-7c897f5f08f1?auto=format&fit=crop&w=1200&q=80', 'Mùa lá đỏ Hàn Quốc với lịch trình chuẩn ảnh đẹp và visa trọn gói.', 'Tour quốc tế cao cấp mùa cao điểm, ưu tiên khách sạn trung tâm và điểm tham quan biểu tượng.', 'Ngày 1: Bay đêm đến Incheon.|Ngày 2: Cung điện Gyeongbok, làng Bukchon.|Ngày 3: Đảo Nami và phố Myeongdong.|Ngày 4: Everland.|Ngày 5: Tự do mua sắm.|Ngày 6: Bay về Hà Nội.', 'Vé máy bay; Visa đoàn; Khách sạn 4 sao; Vé tham quan; HDV.', 'Chi phí cá nhân và phụ thu phòng đơn.', 'Hủy sau khi xuất vé quốc tế áp dụng phí theo điều kiện hãng.', 35, 'active', 1, 34, 26),
('provider2@viethorizon.vn', 'quoc-te-cao-cap', 'Singapore - Malaysia 5N4Đ', 'singapore-malaysia-5n4d', 'Singapore - Kuala Lumpur', 'TP. Hồ Chí Minh', 5, 4, 18990000, 14990000, 17600000, 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80', 'Liên tuyến 2 quốc gia với city tour và mua sắm.', 'Tour phù hợp nhóm gia đình và khách lần đầu đi Đông Nam Á.', 'Ngày 1: Bay đến Singapore, tham quan trung tâm.|Ngày 2: Sentosa, Merlion.|Ngày 3: Di chuyển Malaysia, tham quan Malacca.|Ngày 4: Genting - Kuala Lumpur.|Ngày 5: Bay về Việt Nam.', 'Vé máy bay và xe liên tuyến; Khách sạn 4 sao; Ăn theo chương trình.', 'Chi phí mua sắm tự do và show ngoài lịch trình.', 'Hủy trước 12 ngày hoàn 70%; trước 5 ngày hoàn 25%.', 30, 'active', 1, 36, 29),
('provider2@viethorizon.vn', 'quoc-te-cao-cap', 'Tokyo - Phú Sĩ 6N5Đ', 'tokyo-phu-si-6n5d', 'Tokyo - Yamanashi', 'Hà Nội', 6, 5, 30900000, 24900000, 29500000, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80', 'Hành trình Nhật Bản với Tokyo hiện đại và khu vực núi Phú Sĩ.', 'Lịch trình tiêu chuẩn vàng cho khách muốn khám phá Nhật Bản lần đầu.', 'Ngày 1: Bay đến Tokyo.|Ngày 2: Asakusa, Tokyo Skytree.|Ngày 3: Núi Phú Sĩ, làng cổ Oshino Hakkai.|Ngày 4: Odaiba và mua sắm.|Ngày 5: Tự do khám phá nội đô.|Ngày 6: Bay về Hà Nội.', 'Vé máy bay; Visa; Khách sạn 4 sao; Vé tham quan chính; HDV.', 'Chi phí cá nhân, vé tàu điện tự túc ngoài chương trình.', 'Yêu cầu hồ sơ visa trước tối thiểu 25 ngày.', 45, 'active', 1, 30, 22),
('provider2@viethorizon.vn', 'honeymoon-luxury', 'Bali Retreat 5N4Đ', 'bali-retreat-5n4d', 'Bali', 'TP. Hồ Chí Minh', 5, 4, 19990000, 15990000, 18500000, 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1200&q=80', 'Tour nghỉ dưỡng trăng mật tại Ubud và bãi biển Seminyak.', 'Thiết kế chuyên cho cặp đôi, ưu tiên không gian riêng tư và resort view đẹp.', 'Ngày 1: Bay đến Bali, nhận phòng resort.|Ngày 2: Ubud, ruộng bậc thang và swing.|Ngày 3: Biển Seminyak.|Ngày 4: Tanah Lot sunset.|Ngày 5: Tự do và bay về.', 'Vé máy bay; Resort 4-5 sao; Xe riêng đón tiễn; HDV địa phương.', 'Chi phí spa, dinner private ngoài gói.', 'Hủy trước 14 ngày hoàn 65%; sau thời hạn hoàn theo chính sách đối tác.', 40, 'active', 1, 24, 18),
('provider2@viethorizon.vn', 'quoc-te-cao-cap', 'Đài Loan Thưởng Ngoạn 5N4Đ', 'dai-loan-thuong-ngoan-5n4d', 'Đài Bắc - Đài Trung', 'TP. Hồ Chí Minh', 5, 4, 16990000, 13500000, 15800000, 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80', 'Khám phá Đài Loan với phố cổ, chợ đêm và cảnh quan thiên nhiên.', 'Hành trình cân bằng giữa cảnh đẹp, văn hóa và ẩm thực.', 'Ngày 1: Bay đến Đài Bắc.|Ngày 2: Hồ Nhật Nguyệt.|Ngày 3: Làng cổ Thập Phần.|Ngày 4: Chợ đêm Shilin.|Ngày 5: Bay về Việt Nam.', 'Vé máy bay; Khách sạn 4 sao; Xe du lịch; HDV.', 'Phụ thu phòng đơn và chi phí ăn uống tự chọn.', 'Hủy trước 10 ngày hoàn 60%; sau đó áp dụng biểu phí hãng.', 26, 'active', 0, 32, 25),
('provider2@viethorizon.vn', 'city-break', 'Hồng Kông - Thâm Quyến 4N3Đ', 'hong-kong-tham-quyen-4n3d', 'Hồng Kông - Thâm Quyến', 'Hà Nội', 4, 3, 17990000, 13990000, 16500000, 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80', 'Tour city break kết hợp mua sắm và giải trí hiện đại.', 'Phù hợp khách yêu thích nhịp sống đô thị, trung tâm thương mại và ẩm thực đường phố.', 'Ngày 1: Bay đến Hồng Kông.|Ngày 2: Disneyland hoặc tự do.|Ngày 3: Di chuyển Thâm Quyến, city tour.|Ngày 4: Trở về Việt Nam.', 'Vé máy bay; Khách sạn 4 sao; Xe đưa đón liên tuyến; HDV.', 'Vé vui chơi tự chọn và chi phí cá nhân.', 'Hủy trước 10 ngày hoàn 65%; trước 5 ngày hoàn 20%.', 32, 'active', 0, 28, 21),
('provider2@viethorizon.vn', 'quoc-te-cao-cap', 'Châu Âu 5 Nước 10N9Đ', 'chau-au-5-nuoc-10n9d', 'Pháp - Bỉ - Hà Lan - Đức - Thụy Sĩ', 'TP. Hồ Chí Minh', 10, 9, 79900000, 69900000, 76900000, 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80', 'Hành trình châu Âu kinh điển với điểm đến biểu tượng.', 'Tour đường dài cao cấp, lịch trình tối ưu để trải nghiệm nhiều quốc gia trong một chuyến đi.', 'Ngày 1-2: Paris và các điểm biểu tượng.|Ngày 3: Brussels.|Ngày 4: Amsterdam.|Ngày 5-6: Đức.|Ngày 7-9: Thụy Sĩ.|Ngày 10: Bay về Việt Nam.', 'Vé máy bay quốc tế; Khách sạn 4 sao; Visa Schengen; Xe tiêu chuẩn châu Âu; HDV.', 'Lệ phí hộ chiếu, tip đoàn, chi phí cá nhân ngoài chương trình.', 'Yêu cầu hồ sơ visa trước 35 ngày; hủy sau khi nộp visa áp dụng phí thực tế.', 60, 'active', 1, 26, 18),
('provider2@viethorizon.vn', 'quoc-te-cao-cap', 'Dubai - Abu Dhabi 5N4Đ', 'dubai-abu-dhabi-5n4d', 'Dubai - Abu Dhabi', 'TP. Hồ Chí Minh', 5, 4, 38900000, 30900000, 36500000, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80', 'Trải nghiệm sa mạc, kiến trúc hiện đại và dịch vụ cao cấp Trung Đông.', 'Tour cao cấp nổi bật với trải nghiệm safari sa mạc và du thuyền đêm.', 'Ngày 1: Bay đến Dubai.|Ngày 2: City tour Dubai.|Ngày 3: Abu Dhabi.|Ngày 4: Safari sa mạc và gala dinner.|Ngày 5: Bay về Việt Nam.', 'Vé máy bay; Visa; Khách sạn 5 sao; Xe đưa đón; HDV.', 'Chi phí mua sắm tự do và nâng hạng dịch vụ cá nhân.', 'Hủy trước 15 ngày hoàn 60%; trước 7 ngày hoàn 20%.', 42, 'active', 1, 22, 16),
('provider2@viethorizon.vn', 'quoc-te-cao-cap', 'Úc Sydney - Melbourne 7N6Đ', 'uc-sydney-melbourne-7n6d', 'Sydney - Melbourne', 'TP. Hồ Chí Minh', 7, 6, 55900000, 45900000, 52900000, 'https://images.unsplash.com/photo-1524293581917-878a6d017c71?auto=format&fit=crop&w=1200&q=80', 'Khám phá nước Úc với hai thành phố biểu tượng và thiên nhiên đặc sắc.', 'Tour dài ngày với dịch vụ trọn gói, phù hợp gia đình và khách trung niên.', 'Ngày 1: Bay đến Sydney.|Ngày 2: Opera House và Harbour Bridge.|Ngày 3: Blue Mountains.|Ngày 4: Bay nội địa Melbourne.|Ngày 5: Great Ocean Road.|Ngày 6: Tự do mua sắm.|Ngày 7: Bay về Việt Nam.', 'Vé máy bay quốc tế + nội địa; Visa Úc; Khách sạn 4 sao; HDV.', 'Phụ thu phòng đơn và chi phí phát sinh ngoài lịch trình.', 'Yêu cầu hồ sơ visa trước tối thiểu 30 ngày.', 70, 'active', 0, 24, 17),
('provider@viethorizon.vn', 'city-break', 'Hà Nội - Ninh Bình 2N1Đ', 'ha-noi-ninh-binh-2n1d', 'Ninh Bình', 'Hà Nội', 2, 1, 2690000, 1990000, 2490000, 'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=80', 'Tràng An, chùa Bái Đính và check-in Hang Múa ngắn ngày.', 'Lựa chọn phù hợp cho chuyến đi cuối tuần từ Hà Nội.', 'Ngày 1: Hà Nội - Ninh Bình, tham quan Bái Đính.|Ngày 2: Tràng An, Hang Múa, trở về Hà Nội.', 'Xe đưa đón; Khách sạn 3 sao; Vé thuyền Tràng An; HDV.', 'Chi phí cá nhân và dịch vụ chụp ảnh riêng.', 'Hủy trước 3 ngày hoàn 70%.', 6, 'active', 0, 30, 24),
('provider3@viethorizon.vn', 'adventure-trekking', 'Tà Xùa Săn Mây 2N1Đ', 'ta-xua-san-may-2n1d', 'Sơn La', 'Hà Nội', 2, 1, 2990000, 2190000, 2790000, 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80', 'Trekking nhẹ, săn mây sống lưng khủng long Tà Xùa.', 'Tour ngắn ngày cho khách yêu thiên nhiên và chụp ảnh bình minh.', 'Ngày 1: Hà Nội - Tà Xùa, trekking nhẹ.|Ngày 2: Săn mây bình minh, quay về Hà Nội.', 'Xe đưa đón; Homestay sạch; HDV trekking; Bảo hiểm cơ bản.', 'Chi phí thuê xe ôm địa phương và chi phí cá nhân.', 'Yêu cầu thể lực trung bình; hủy trước 4 ngày hoàn 65%.', 14, 'active', 0, 20, 15),
('provider@viethorizon.vn', 'gia-dinh-vui-choi', 'Đà Nẵng - Hội An Family 4N3Đ', 'da-nang-hoi-an-family-4n3d', 'Đà Nẵng - Hội An', 'Hà Nội', 4, 3, 6990000, 5290000, 6590000, 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?auto=format&fit=crop&w=1200&q=80', 'Phiên bản tour gia đình với lịch trình thư giãn và khách sạn tiện nghi.', 'Thiết kế riêng cho gia đình có trẻ nhỏ, giảm thời gian di chuyển liên tục.', 'Ngày 1: Bay đến Đà Nẵng, nghỉ ngơi.|Ngày 2: Bà Nà Hills.|Ngày 3: Hội An và công viên giải trí.|Ngày 4: Tắm biển, mua sắm, về Hà Nội.', 'Vé máy bay; Khách sạn family room; Ăn theo chương trình; HDV.', 'Chi phí vui chơi tự chọn ngoài gói.', 'Hủy trước 7 ngày hoàn 75%; đổi lịch miễn phí 1 lần.', 26, 'active', 1, 36, 29),
('provider2@viethorizon.vn', 'honeymoon-luxury', 'Maldives Nghỉ Dưỡng 5N4Đ', 'maldives-nghi-duong-5n4d', 'Maldives', 'TP. Hồ Chí Minh', 5, 4, 65900000, 55900000, 62900000, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80', 'Overwater villa, biển xanh và dịch vụ premium dành cho cặp đôi.', 'Gói nghỉ dưỡng cao cấp với không gian riêng tư tuyệt đối.', 'Ngày 1: Bay quốc tế và chuyển thủy phi cơ.|Ngày 2-4: Nghỉ dưỡng resort, hoạt động biển và spa.|Ngày 5: Trả phòng và về Việt Nam.', 'Vé máy bay; Resort 5 sao; Bữa ăn theo gói; Đưa đón sân bay và thủy phi cơ.', 'Dịch vụ cá nhân nâng cấp riêng và chi phí ngoài minibar.', 'Hủy trước 20 ngày hoàn 60%; sau thời hạn theo chính sách resort.', 75, 'active', 1, 18, 12),
('provider3@viethorizon.vn', 'van-hoa-di-san', 'Quảng Bình Di Sản 3N2Đ', 'quang-binh-di-san-3n2d', 'Quảng Bình', 'Hà Nội', 3, 2, 4890000, 3590000, 4590000, 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80', 'Động Thiên Đường, suối nước Moọc và khám phá văn hóa địa phương.', 'Tour di sản thiên nhiên dành cho khách thích kết hợp khám phá và nghỉ dưỡng.', 'Ngày 1: Bay đến Đồng Hới, tham quan thành phố.|Ngày 2: Động Thiên Đường và suối Moọc.|Ngày 3: Mua đặc sản, bay về Hà Nội.', 'Vé máy bay; Khách sạn 4 sao; Vé tham quan chính; HDV.', 'Chi phí trò chơi mạo hiểm tự chọn.', 'Hủy trước 6 ngày hoàn 70%; trước 2 ngày hoàn 30%.', 19, 'active', 0, 30, 23);

INSERT INTO tours (
    provider_id,
    category_id,
    title,
    slug,
    destination,
    departure_location,
    duration_days,
    duration_nights,
    price_adult,
    price_child,
    discount_price,
    thumbnail,
    short_description,
    description,
    itinerary,
    included_services,
    excluded_services,
    policy,
    max_guests,
    available_slots,
    departure_date,
    return_date,
    status,
    is_featured,
    views_count,
    bookings_count,
    rating_avg,
    created_at,
    updated_at
)
SELECT p.id,
       c.id,
       t.title,
       t.slug,
       t.destination,
       t.departure_location,
       t.duration_days,
       t.duration_nights,
       t.price_adult,
       t.price_child,
       t.discount_price,
       t.thumbnail,
       t.short_description,
       t.description,
       t.itinerary,
       t.included_services,
       t.excluded_services,
       t.policy,
       t.max_guests,
       t.available_slots,
       DATE_ADD(CURDATE(), INTERVAL t.departure_offset_day DAY),
       DATE_ADD(DATE_ADD(CURDATE(), INTERVAL t.departure_offset_day DAY), INTERVAL t.duration_nights DAY),
       t.status,
       t.is_featured,
       120,
       0,
       0,
       NOW(),
       NOW()
FROM tmp_seed_tours t
JOIN users pu ON pu.email = t.provider_email
JOIN providers p ON p.user_id = pu.id
JOIN categories c ON c.slug = t.category_slug
ON DUPLICATE KEY UPDATE
    provider_id = VALUES(provider_id),
    category_id = VALUES(category_id),
    title = VALUES(title),
    destination = VALUES(destination),
    departure_location = VALUES(departure_location),
    duration_days = VALUES(duration_days),
    duration_nights = VALUES(duration_nights),
    price_adult = VALUES(price_adult),
    price_child = VALUES(price_child),
    discount_price = VALUES(discount_price),
    thumbnail = VALUES(thumbnail),
    short_description = VALUES(short_description),
    description = VALUES(description),
    itinerary = VALUES(itinerary),
    included_services = VALUES(included_services),
    excluded_services = VALUES(excluded_services),
    policy = VALUES(policy),
    max_guests = VALUES(max_guests),
    available_slots = VALUES(available_slots),
    departure_date = VALUES(departure_date),
    return_date = VALUES(return_date),
    status = VALUES(status),
    is_featured = VALUES(is_featured),
    updated_at = NOW();

-- Đồng bộ gallery ảnh cho toàn bộ tour seed
DELETE ti
FROM tour_images ti
INNER JOIN tours t ON t.id = ti.tour_id
INNER JOIN tmp_seed_tours s ON s.slug = t.slug;

INSERT INTO tour_images (tour_id, image_url, sort_order, created_at, updated_at)
SELECT t.id, t.thumbnail, 1, NOW(), NOW()
FROM tours t
JOIN tmp_seed_tours s ON s.slug = t.slug
UNION ALL
SELECT t.id,
       CASE s.category_slug
         WHEN 'bien-nghi-duong' THEN 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80'
         WHEN 'san-may-nui-rung' THEN 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80'
         WHEN 'quoc-te-cao-cap' THEN 'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1200&q=80'
         WHEN 'van-hoa-di-san' THEN 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1200&q=80'
         WHEN 'gia-dinh-vui-choi' THEN 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80'
         WHEN 'city-break' THEN 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80'
         WHEN 'adventure-trekking' THEN 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80'
         ELSE 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80'
       END,
       2,
       NOW(),
       NOW()
FROM tours t
JOIN tmp_seed_tours s ON s.slug = t.slug
UNION ALL
SELECT t.id,
       CASE
         WHEN t.destination LIKE '%Đà Nẵng%' THEN 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80'
         WHEN t.destination LIKE '%Phú Quốc%' THEN 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
         WHEN t.destination LIKE '%Đà Lạt%' THEN 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80'
         WHEN t.destination LIKE '%Bangkok%' THEN 'https://images.unsplash.com/photo-1531168556467-80aace4d10f2?auto=format&fit=crop&w=1200&q=80'
         WHEN t.destination LIKE '%Seoul%' THEN 'https://images.unsplash.com/photo-1535185384036-28bbc8035f28?auto=format&fit=crop&w=1200&q=80'
         WHEN t.destination LIKE '%Singapore%' THEN 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80'
         WHEN t.destination LIKE '%Tokyo%' THEN 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80'
         WHEN t.destination LIKE '%Bali%' THEN 'https://images.unsplash.com/photo-1468071174046-657d9d351a40?auto=format&fit=crop&w=1200&q=80'
         ELSE 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80'
       END,
       3,
       NOW(),
       NOW()
FROM tours t
JOIN tmp_seed_tours s ON s.slug = t.slug;

-- Đồng bộ dịch vụ tour, xóa dữ liệu cũ lỗi/trùng cho các tour seed
DELETE ts
FROM tour_services ts
INNER JOIN tours t ON t.id = ts.tour_id
INNER JOIN tmp_seed_tours s ON s.slug = t.slug;

INSERT INTO tour_services (tour_id, service_name, service_type, description, created_at, updated_at)
SELECT t.id,
       'Vận chuyển theo chương trình',
       'Di chuyển',
       CASE
         WHEN s.category_slug = 'quoc-te-cao-cap' THEN 'Bao gồm vé máy bay khứ hồi quốc tế/nội địa và xe đưa đón theo lịch trình.'
         ELSE 'Bao gồm xe đưa đón theo lịch trình và phương tiện nội bộ tại điểm tham quan.'
       END,
       NOW(),
       NOW()
FROM tours t
JOIN tmp_seed_tours s ON s.slug = t.slug
UNION ALL
SELECT t.id,
       CASE
         WHEN s.category_slug IN ('honeymoon-luxury', 'quoc-te-cao-cap') THEN 'Lưu trú 4-5 sao'
         ELSE 'Lưu trú tiêu chuẩn'
       END,
       'Lưu trú',
       CASE
         WHEN s.category_slug IN ('honeymoon-luxury', 'quoc-te-cao-cap') THEN 'Khách sạn hoặc resort 4-5 sao, vị trí thuận tiện trung tâm.'
         ELSE 'Khách sạn/homestay tiêu chuẩn sạch, đầy đủ tiện nghi cơ bản.'
       END,
       NOW(),
       NOW()
FROM tours t
JOIN tmp_seed_tours s ON s.slug = t.slug
UNION ALL
SELECT t.id,
       CASE
         WHEN s.category_slug = 'quoc-te-cao-cap' THEN 'Hỗ trợ visa và bảo hiểm'
         ELSE 'Bảo hiểm du lịch cơ bản'
       END,
       'Hỗ trợ',
       CASE
         WHEN s.category_slug = 'quoc-te-cao-cap' THEN 'Hỗ trợ thủ tục visa theo tuyến và bảo hiểm du lịch theo quy định.'
         ELSE 'Bảo hiểm du lịch theo tiêu chuẩn chương trình và hỗ trợ khẩn cấp.'
       END,
       NOW(),
       NOW()
FROM tours t
JOIN tmp_seed_tours s ON s.slug = t.slug;

DROP TEMPORARY TABLE IF EXISTS tmp_seed_promotions;
CREATE TEMPORARY TABLE tmp_seed_promotions (
    provider_email VARCHAR(180) NULL,
    code VARCHAR(80) NOT NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) NULL,
    discount_type ENUM('percent','fixed') NOT NULL,
    discount_value DECIMAL(15,2) NOT NULL,
    min_order_value DECIMAL(15,2) NULL,
    max_discount_value DECIMAL(15,2) NULL,
    start_offset INT NOT NULL,
    end_offset INT NOT NULL,
    usage_limit INT UNSIGNED NULL,
    status ENUM('active','inactive','expired') NOT NULL
);

INSERT INTO tmp_seed_promotions VALUES
('provider@viethorizon.vn', 'SUMMER26', 'Ưu đãi hè rực rỡ', 'Giảm 10% cho tour biển và tour gia đình mùa hè.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 'percent', 10, 3500000, 1800000, -10, 80, 1200, 'active'),
('provider@viethorizon.vn', 'BEACH600', 'Giảm ngay 600K tour biển', 'Áp dụng các tour biển nội địa có giá từ 4 triệu.', 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80', 'fixed', 600000, 4000000, 600000, -7, 60, 700, 'active'),
('provider@viethorizon.vn', 'FAMILYKID', 'Gia đình đi đông giảm sâu', 'Giảm 12% cho booking từ 4 khách trở lên.', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80', 'percent', 12, 9000000, 2500000, -5, 90, 500, 'active'),
('provider3@viethorizon.vn', 'HERITAGE15', 'Ưu đãi tour di sản', 'Giảm 15% cho các hành trình văn hóa di sản miền Trung.', 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?auto=format&fit=crop&w=1200&q=80', 'percent', 15, 5000000, 2200000, -4, 75, 300, 'active'),
('provider2@viethorizon.vn', 'EARLYINTL', 'Đặt sớm tour quốc tế', 'Giảm 8% khi đặt trước 45 ngày.', 'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1200&q=80', 'percent', 8, 15000000, 3000000, -15, 120, 450, 'active'),
('provider2@viethorizon.vn', 'KOREA8', 'Mùa lá đỏ Hàn Quốc', 'Giảm riêng cho tuyến Seoul - Nami mùa thu.', 'https://images.unsplash.com/photo-1538485399081-7c897f5f08f1?auto=format&fit=crop&w=1200&q=80', 'percent', 8, 18000000, 2500000, -20, 70, 280, 'active'),
('provider2@viethorizon.vn', 'TOKYO1200', 'Giảm 1.200.000 tour Nhật', 'Áp dụng cho tour Tokyo - Phú Sĩ.', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80', 'fixed', 1200000, 28000000, 1200000, -12, 95, 260, 'active'),
('provider2@viethorizon.vn', 'HONEY18', 'Trăng mật cao cấp', 'Giảm 18% cho gói honeymoon select.', 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1200&q=80', 'percent', 18, 30000000, 5000000, -8, 110, 180, 'active'),
(NULL, 'NATIONALDAY', 'Khuyến mãi dịp lễ', 'Mã toàn hệ thống cho các tour đủ điều kiện giá trị đơn.', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80', 'fixed', 500000, 6000000, 500000, -2, 20, 1500, 'active'),
(NULL, 'WEEKENDCITY', 'City Break cuối tuần', 'Giảm 7% cho tour city break và hành trình ngắn ngày.', 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80', 'percent', 7, 2500000, 900000, -5, 45, 900, 'active');

INSERT INTO promotions (
    provider_id,
    code,
    title,
    description,
    image_url,
    discount_type,
    discount_value,
    min_order_value,
    max_discount_value,
    start_date,
    end_date,
    usage_limit,
    used_count,
    status,
    created_at,
    updated_at
)
SELECT p.id,
       s.code,
       s.title,
       s.description,
       s.image_url,
       s.discount_type,
       s.discount_value,
       s.min_order_value,
       s.max_discount_value,
       DATE_ADD(NOW(), INTERVAL s.start_offset DAY),
       DATE_ADD(NOW(), INTERVAL s.end_offset DAY),
       s.usage_limit,
       0,
       s.status,
       NOW(),
       NOW()
FROM tmp_seed_promotions s
LEFT JOIN users u ON u.email = s.provider_email
LEFT JOIN providers p ON p.user_id = u.id
ON DUPLICATE KEY UPDATE
    provider_id = VALUES(provider_id),
    title = VALUES(title),
    description = VALUES(description),
    image_url = VALUES(image_url),
    discount_type = VALUES(discount_type),
    discount_value = VALUES(discount_value),
    min_order_value = VALUES(min_order_value),
    max_discount_value = VALUES(max_discount_value),
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    usage_limit = VALUES(usage_limit),
    status = VALUES(status),
    updated_at = NOW();

DROP TEMPORARY TABLE IF EXISTS tmp_seed_promotion_tours;
CREATE TEMPORARY TABLE tmp_seed_promotion_tours (
    code VARCHAR(80) NOT NULL,
    tour_slug VARCHAR(200) NOT NULL
);

INSERT INTO tmp_seed_promotion_tours VALUES
('SUMMER26', 'da-nang-hoi-an-3n2d'),
('SUMMER26', 'phu-quoc-nghi-duong-4n3d'),
('SUMMER26', 'nha-trang-vinwonders-3n2d'),
('BEACH600', 'quy-nhon-ky-co-3n2d'),
('BEACH600', 'phan-thiet-mui-ne-3n2d'),
('FAMILYKID', 'da-nang-hoi-an-family-4n3d'),
('FAMILYKID', 'nha-trang-vinwonders-3n2d'),
('HERITAGE15', 'hue-da-nang-di-san-4n3d'),
('HERITAGE15', 'quang-binh-di-san-3n2d'),
('EARLYINTL', 'bangkok-pattaya-5n4d'),
('EARLYINTL', 'singapore-malaysia-5n4d'),
('KOREA8', 'han-quoc-mua-la-do-6n5d'),
('TOKYO1200', 'tokyo-phu-si-6n5d'),
('HONEY18', 'bali-retreat-5n4d'),
('HONEY18', 'maldives-nghi-duong-5n4d'),
('NATIONALDAY', 'ha-noi-ninh-binh-2n1d'),
('WEEKENDCITY', 'can-tho-cho-noi-2n1d'),
('WEEKENDCITY', 'hong-kong-tham-quyen-4n3d');

DELETE pt
FROM promotion_tours pt
INNER JOIN promotions p ON p.id = pt.promotion_id
LEFT JOIN tmp_seed_promotions s ON s.code = p.code
WHERE s.code IS NULL;

DELETE FROM promotions
WHERE code NOT IN (SELECT code FROM tmp_seed_promotions);

DELETE pt
FROM promotion_tours pt
INNER JOIN promotions p ON p.id = pt.promotion_id
INNER JOIN tmp_seed_promotions s ON s.code = p.code;

INSERT INTO promotion_tours (promotion_id, tour_id, created_at, updated_at)
SELECT p.id, t.id, NOW(), NOW()
FROM tmp_seed_promotion_tours m
JOIN promotions p ON p.code = m.code
JOIN tours t ON t.slug = m.tour_slug;

DROP TEMPORARY TABLE IF EXISTS tmp_seed_posts;
CREATE TEMPORARY TABLE tmp_seed_posts (
    author_email VARCHAR(180) NOT NULL,
    title VARCHAR(220) NOT NULL,
    slug VARCHAR(240) NOT NULL,
    excerpt VARCHAR(400) NOT NULL,
    thumbnail VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    status ENUM('draft','published','archived') NOT NULL,
    published_offset_day INT NOT NULL
);

INSERT INTO tmp_seed_posts VALUES
('admin@viethorizon.vn', 'Kinh nghiệm du lịch Đà Nẵng tự túc 2026', 'kinh-nghiem-du-lich-da-nang-tu-tuc-2026', 'Lịch trình 3 ngày 2 đêm tối ưu chi phí, ăn uống và di chuyển tại Đà Nẵng.', 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80', 'Chủ đề: Cẩm nang điểm đến.\\n1) Nên đặt vé và khách sạn trước từ 3 đến 5 tuần để có giá tốt.\\n2) Các điểm nên đi gồm bán đảo Sơn Trà, Bà Nà Hills, Hội An về đêm.\\n3) Nên dành riêng nửa ngày cuối để mua đặc sản và chủ động giờ ra sân bay.', 'published', 1),
('admin@viethorizon.vn', '10 địa điểm săn mây đẹp nhất Việt Nam', '10-dia-diem-san-may-dep-nhat-viet-nam', 'Danh sách điểm săn mây từ Tà Xùa, Đà Lạt đến Sapa kèm lưu ý an toàn.', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80', 'Chủ đề: Thiên nhiên và trải nghiệm.\\nNên đi vào sáng sớm, kiểm tra thời tiết và mang áo ấm chống gió.\\nƯu tiên cung đường có điểm dừng rõ ràng, tránh tự phát khi chưa có kinh nghiệm địa hình.', 'published', 2),
('admin@viethorizon.vn', 'Mẹo săn vé máy bay giá tốt khi đi tour quốc tế', 'meo-san-ve-may-bay-gia-tot-tour-quoc-te', 'Các khung giờ đặt vé, cách theo dõi giá và tránh phụ phí ẩn.', 'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1200&q=80', 'Chủ đề: Tối ưu chi phí du lịch.\\nHãy linh hoạt ngày bay và theo dõi giá từ 6 đến 8 tuần trước khởi hành.\\nLuôn kiểm tra chính sách hành lý và điều kiện hoàn đổi để tránh phát sinh khi cần dời lịch.', 'published', 3),
('admin@viethorizon.vn', 'Checklist hành lý đi Nhật mùa hoa anh đào', 'checklist-hanh-ly-di-nhat-mua-hoa-anh-dao', 'Danh sách đồ dùng cần thiết để giữ ấm và di chuyển thuận tiện tại Nhật.', 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80', 'Chủ đề: Chuẩn bị trước chuyến đi.\\nNên mang trang phục layer, giày đi bộ tốt và pin dự phòng.\\nHộ chiếu, lịch trình, xác nhận khách sạn nên có cả bản in và bản mềm.', 'published', 4),
('admin@viethorizon.vn', 'Review ẩm thực đường phố Bangkok cho người mới', 'review-am-thuc-duong-pho-bangkok', 'Gợi ý món ăn nổi bật, khu chợ đêm và lưu ý về khẩu vị khi ăn cay.', 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1200&q=80', 'Chủ đề: Ẩm thực địa phương.\\nCác khu chợ đêm nổi bật gồm Jodd Fairs và Yaowarat.\\nNên thử pad thai, tom yum và xôi xoài ở quầy đông khách để đảm bảo độ tươi.', 'published', 5),
('admin@viethorizon.vn', 'Cẩm nang đi Sapa mùa lạnh cho gia đình', 'cam-nang-di-sapa-mua-lanh-cho-gia-dinh', 'Kinh nghiệm đặt phòng, giữ ấm cho trẻ nhỏ và lịch trình nhẹ nhàng.', 'https://images.unsplash.com/photo-1577648188599-291bb8b831c3?auto=format&fit=crop&w=1200&q=80', 'Chủ đề: Du lịch gia đình.\\nƯu tiên khách sạn gần trung tâm để giảm thời gian di chuyển.\\nTrẻ nhỏ cần quần áo giữ nhiệt, khẩu trang và lịch nghỉ hợp lý giữa các điểm tham quan.', 'published', 6),
('admin@viethorizon.vn', '5 sai lầm thường gặp khi đặt tour trăng mật', '5-sai-lam-thuong-gap-khi-dat-tour-trang-mat', 'Những lỗi phổ biến khiến chi phí tăng và trải nghiệm giảm chất lượng.', 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80', 'Chủ đề: Kinh nghiệm honeymoon.\\nSai lầm lớn nhất là đặt sát ngày bay và không kiểm tra chính sách đổi hủy.\\nNên chọn gói có hỗ trợ riêng cho cặp đôi và xác nhận rõ tiện ích phòng.', 'published', 7),
('admin@viethorizon.vn', 'Hướng dẫn đọc điều kiện hoàn hủy tour đúng cách', 'huong-dan-doc-dieu-kien-hoan-huy-tour', 'Các điều khoản quan trọng cần xem trước khi thanh toán.', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80', 'Chủ đề: Quy trình đặt tour an toàn.\\nBạn cần quan tâm các mốc thời gian hoàn tiền theo từng giai đoạn.\\nNgoài ra cần xem chính sách bất khả kháng và điều kiện đổi tên khách.', 'published', 8),
('admin@viethorizon.vn', 'Top điểm check-in đẹp tại Bali cho cặp đôi', 'top-diem-checkin-dep-tai-bali-cho-cap-doi', 'Danh sách điểm chụp ảnh nổi bật tại Ubud, Seminyak và Nusa Penida.', 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1200&q=80', 'Chủ đề: Điểm đến quốc tế.\\nNên đi sớm tại các điểm hot để tránh đông và có ảnh đẹp hơn.\\nKhi di chuyển giữa đảo cần dự phòng thời gian vì thời tiết có thể thay đổi nhanh.', 'published', 9),
('admin@viethorizon.vn', 'Kinh nghiệm xin visa Schengen lần đầu', 'kinh-nghiem-xin-visa-schengen-lan-dau', 'Checklist hồ sơ và mẹo tăng tỷ lệ đậu visa châu Âu.', 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80', 'Chủ đề: Visa quốc tế.\\nHồ sơ tài chính cần rõ ràng, lịch sử công việc ổn định và lịch trình hợp lý.\\nNên nộp sớm hơn ngày đi tối thiểu 6 tuần để xử lý phát sinh nếu có.', 'published', 10),
('admin@viethorizon.vn', 'Mẹo chọn tour phù hợp cho người lớn tuổi', 'meo-chon-tour-phu-hop-cho-nguoi-lon-tuoi', 'Tiêu chí chọn nhịp tour, bữa ăn và dịch vụ y tế hỗ trợ.', 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1200&q=80', 'Chủ đề: Trải nghiệm an toàn.\\nNên chọn tour ít đổi khách sạn, thời gian di chuyển ngắn và bữa ăn mềm dễ dùng.\\nLuôn mang theo thuốc cá nhân và thông tin liên hệ khẩn cấp.', 'published', 11),
('admin@viethorizon.vn', 'Hướng dẫn săn deal tour cuối tuần tại Viet Horizon', 'huong-dan-san-deal-tour-cuoi-tuan-viet-horizon', 'Cách kết hợp mã giảm giá và thời điểm đặt để tối ưu chi phí.', 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80', 'Chủ đề: Ưu đãi và khuyến mãi.\\nTheo dõi trang khuyến mãi vào đầu tuần để chốt lịch sớm.\\nKhi đi nhóm nên đặt chung một booking để đạt ngưỡng giảm theo điều kiện mã.', 'published', 12);

DELETE FROM posts
WHERE slug NOT IN (SELECT slug FROM tmp_seed_posts);

INSERT INTO posts (author_id, title, slug, excerpt, thumbnail, content, status, published_at, created_at, updated_at)
SELECT u.id,
       p.title,
       p.slug,
       p.excerpt,
       p.thumbnail,
       p.content,
       p.status,
       DATE_SUB(NOW(), INTERVAL p.published_offset_day DAY),
       NOW(),
       NOW()
FROM tmp_seed_posts p
JOIN users u ON u.email = p.author_email
ON DUPLICATE KEY UPDATE
    author_id = VALUES(author_id),
    title = VALUES(title),
    excerpt = VALUES(excerpt),
    thumbnail = VALUES(thumbnail),
    content = VALUES(content),
    status = VALUES(status),
    published_at = VALUES(published_at),
    updated_at = NOW();

SET @has_post_meta := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'category'
);
SET @post_meta_sql := IF(
    @has_post_meta > 0,
    'UPDATE posts
     SET category = CASE
             WHEN slug LIKE ''%visa%'' THEN ''Visa''
             WHEN slug LIKE ''%am-thuc%'' THEN ''Ẩm thực''
             WHEN slug LIKE ''%san-deal%'' OR slug LIKE ''%san-ve%'' THEN ''Khuyến mãi''
             WHEN slug LIKE ''%checklist%'' OR slug LIKE ''%kinh-nghiem%'' OR slug LIKE ''%cam-nang%'' THEN ''Cẩm nang''
             ELSE COALESCE(NULLIF(category, ''''), ''Kinh nghiệm'')
         END,
         tags = CASE
             WHEN slug LIKE ''%visa%'' THEN JSON_ARRAY(''visa'', ''du lịch quốc tế'', ''thủ tục'')
             WHEN slug LIKE ''%am-thuc%'' THEN JSON_ARRAY(''ẩm thực'', ''chợ đêm'', ''bangkok'')
             WHEN slug LIKE ''%san-deal%'' OR slug LIKE ''%san-ve%'' THEN JSON_ARRAY(''khuyến mãi'', ''tiết kiệm'', ''đặt tour'')
             WHEN slug LIKE ''%honeymoon%'' OR slug LIKE ''%trang-mat%'' THEN JSON_ARRAY(''trăng mật'', ''couple'', ''resort'')
             ELSE JSON_ARRAY(''kinh nghiệm'', ''du lịch'', ''viethorizon'')
         END,
         gallery = JSON_ARRAY(
             thumbnail,
             REPLACE(thumbnail, ''w=1200'', ''w=900''),
             REPLACE(thumbnail, ''q=80'', ''q=75'')
         ),
         meta_title = COALESCE(NULLIF(meta_title, ''''), title),
         meta_description = COALESCE(NULLIF(meta_description, ''''), excerpt),
         is_featured = CASE
             WHEN slug IN (
                 ''kinh-nghiem-du-lich-da-nang-tu-tuc-2026'',
                 ''meo-san-ve-may-bay-gia-tot-tour-quoc-te'',
                 ''kinh-nghiem-xin-visa-schengen-lan-dau'',
                 ''huong-dan-san-deal-tour-cuoi-tuan-viet-horizon''
             ) THEN 1
             ELSE 0
         END,
         updated_at = NOW()
     WHERE slug IN (SELECT slug FROM tmp_seed_posts)',
    'SELECT 1'
);
PREPARE stmt FROM @post_meta_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @user_1 = (SELECT id FROM users WHERE email = 'user@viethorizon.vn' LIMIT 1);
SET @user_2 = (SELECT id FROM users WHERE email = 'user2@viethorizon.vn' LIMIT 1);
SET @user_3 = (SELECT id FROM users WHERE email = 'user3@viethorizon.vn' LIMIT 1);
SET @user_4 = (SELECT id FROM users WHERE email = 'user4@viethorizon.vn' LIMIT 1);

SET @tour_dn = (SELECT id FROM tours WHERE slug = 'da-nang-hoi-an-3n2d' LIMIT 1);
SET @tour_pq = (SELECT id FROM tours WHERE slug = 'phu-quoc-nghi-duong-4n3d' LIMIT 1);
SET @tour_hq = (SELECT id FROM tours WHERE slug = 'han-quoc-mua-la-do-6n5d' LIMIT 1);
SET @tour_sp = (SELECT id FROM tours WHERE slug = 'sapa-fansipan-3n2d' LIMIT 1);

INSERT INTO wishlists (user_id, tour_id, created_at)
SELECT @user_1, @tour_pq, NOW()
WHERE @user_1 IS NOT NULL AND @tour_pq IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM wishlists WHERE user_id = @user_1 AND tour_id = @tour_pq);

INSERT INTO wishlists (user_id, tour_id, created_at)
SELECT @user_2, @tour_hq, NOW()
WHERE @user_2 IS NOT NULL AND @tour_hq IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM wishlists WHERE user_id = @user_2 AND tour_id = @tour_hq);

INSERT INTO ratings (user_id, tour_id, score, review, created_at, updated_at)
SELECT @user_1, @tour_dn, 5, 'Lịch trình hợp lý, dịch vụ đúng mô tả và hỗ trợ nhanh.', NOW(), NOW()
WHERE @user_1 IS NOT NULL AND @tour_dn IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ratings WHERE user_id = @user_1 AND tour_id = @tour_dn);

INSERT INTO ratings (user_id, tour_id, score, review, created_at, updated_at)
SELECT @user_3, @tour_sp, 4, 'Tour phù hợp cho chuyến đi ngắn ngày, cảnh đẹp và dễ đi.', NOW(), NOW()
WHERE @user_3 IS NOT NULL AND @tour_sp IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ratings WHERE user_id = @user_3 AND tour_id = @tour_sp);

INSERT INTO comments (user_id, tour_id, content, status, created_at, updated_at)
SELECT @user_2, @tour_dn, 'Đi đúng mùa nắng đẹp, hướng dẫn viên rất chủ động hỗ trợ gia đình có trẻ nhỏ.', 'visible', NOW(), NOW()
WHERE @user_2 IS NOT NULL AND @tour_dn IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM comments WHERE user_id = @user_2 AND tour_id = @tour_dn);

INSERT INTO comments (user_id, tour_id, content, status, created_at, updated_at)
SELECT @user_4, @tour_hq, 'Thủ tục visa rõ ràng, lịch trình đi đúng cam kết.', 'visible', NOW(), NOW()
WHERE @user_4 IS NOT NULL AND @tour_hq IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM comments WHERE user_id = @user_4 AND tour_id = @tour_hq);

SET @promo_summer = (SELECT id FROM promotions WHERE code = 'SUMMER26' LIMIT 1);
SET @promo_korea = (SELECT id FROM promotions WHERE code = 'KOREA8' LIMIT 1);

INSERT INTO bookings (
    booking_code,
    user_id,
    tour_id,
    promotion_id,
    contact_name,
    contact_email,
    contact_phone,
    total_guests,
    adult_count,
    child_count,
    departure_date,
    subtotal,
    discount_amount,
    total_amount,
    note,
    booking_status,
    payment_status,
    created_at,
    updated_at
)
SELECT 'BK26040101',
       @user_1,
       @tour_dn,
       @promo_summer,
       'Nguyễn Văn An',
       'user@viethorizon.vn',
       '0900000003',
       2,
       2,
       0,
       DATE_ADD(CURDATE(), INTERVAL 20 DAY),
       9180000,
       918000,
       8262000,
       'Phòng đôi, ưu tiên tầng cao.',
       'confirmed',
       'paid',
       DATE_SUB(NOW(), INTERVAL 7 DAY),
       DATE_SUB(NOW(), INTERVAL 7 DAY)
WHERE @user_1 IS NOT NULL AND @tour_dn IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE booking_code = 'BK26040101');

INSERT INTO bookings (
    booking_code,
    user_id,
    tour_id,
    promotion_id,
    contact_name,
    contact_email,
    contact_phone,
    total_guests,
    adult_count,
    child_count,
    departure_date,
    subtotal,
    discount_amount,
    total_amount,
    note,
    booking_status,
    payment_status,
    created_at,
    updated_at
)
SELECT 'BK26040102',
       @user_2,
       @tour_hq,
       @promo_korea,
       'Trần Thị Minh',
       'user2@viethorizon.vn',
       '0900000004',
       2,
       2,
       0,
       DATE_ADD(CURDATE(), INTERVAL 45 DAY),
       43980000,
       3518400,
       40461600,
       'Hỗ trợ ghế gần cửa sổ khi bay.',
       'pending',
       'pending',
       DATE_SUB(NOW(), INTERVAL 3 DAY),
       DATE_SUB(NOW(), INTERVAL 3 DAY)
WHERE @user_2 IS NOT NULL AND @tour_hq IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE booking_code = 'BK26040102');

INSERT INTO payments (booking_id, payment_method, transaction_code, amount, payment_status, paid_at, created_at, updated_at)
SELECT b.id,
       'bank_card',
       'TXN-BK26040101',
       b.total_amount,
       'paid',
       DATE_SUB(NOW(), INTERVAL 7 DAY),
       DATE_SUB(NOW(), INTERVAL 7 DAY),
       DATE_SUB(NOW(), INTERVAL 7 DAY)
FROM bookings b
WHERE b.booking_code = 'BK26040101'
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = b.id);

INSERT INTO payments (booking_id, payment_method, transaction_code, amount, payment_status, paid_at, created_at, updated_at)
SELECT b.id,
       'bank_transfer',
       'TXN-BK26040102',
       b.total_amount,
       'pending',
       NULL,
       DATE_SUB(NOW(), INTERVAL 3 DAY),
       DATE_SUB(NOW(), INTERVAL 3 DAY)
FROM bookings b
WHERE b.booking_code = 'BK26040102'
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = b.id);

INSERT INTO invoices (booking_id, invoice_code, issued_at, subtotal, discount_amount, total_amount, payment_status, notes, created_at, updated_at)
SELECT b.id,
       'INV26040101',
       DATE_SUB(NOW(), INTERVAL 7 DAY),
       b.subtotal,
       b.discount_amount,
       b.total_amount,
       b.payment_status,
       'Đã thanh toán qua cổng thẻ nội địa.',
       DATE_SUB(NOW(), INTERVAL 7 DAY),
       DATE_SUB(NOW(), INTERVAL 7 DAY)
FROM bookings b
WHERE b.booking_code = 'BK26040101'
  AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.booking_id = b.id);

INSERT INTO invoices (booking_id, invoice_code, issued_at, subtotal, discount_amount, total_amount, payment_status, notes, created_at, updated_at)
SELECT b.id,
       'INV26040102',
       DATE_SUB(NOW(), INTERVAL 3 DAY),
       b.subtotal,
       b.discount_amount,
       b.total_amount,
       b.payment_status,
       'Đang chờ đối soát chuyển khoản.',
       DATE_SUB(NOW(), INTERVAL 3 DAY),
       DATE_SUB(NOW(), INTERVAL 3 DAY)
FROM bookings b
WHERE b.booking_code = 'BK26040102'
  AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.booking_id = b.id);

UPDATE tours t
LEFT JOIN (
    SELECT tour_id, COUNT(*) AS rating_count, ROUND(AVG(score), 2) AS avg_score
    FROM ratings
    GROUP BY tour_id
) r ON r.tour_id = t.id
LEFT JOIN (
    SELECT tour_id, COUNT(*) AS booking_count
    FROM bookings
    WHERE booking_status <> 'cancelled'
    GROUP BY tour_id
) b ON b.tour_id = t.id
SET t.rating_avg = COALESCE(r.avg_score, 0),
    t.bookings_count = COALESCE(b.booking_count, 0),
    t.updated_at = NOW();

SELECT 'seed_ready' AS job,
       (SELECT COUNT(*) FROM tours) AS total_tours,
       (SELECT COUNT(*) FROM tours WHERE slug IN (SELECT slug FROM tmp_seed_tours)) AS seeded_tours,
       (SELECT COUNT(*) FROM tour_images) AS total_images,
       (SELECT COUNT(*) FROM promotions) AS total_promotions,
       (SELECT COUNT(*) FROM posts) AS total_posts;

-- Tài khoản seed (mật khẩu: 123456)
-- admin@viethorizon.vn
-- provider@viethorizon.vn
-- provider2@viethorizon.vn
-- provider3@viethorizon.vn
-- user@viethorizon.vn
-- user2@viethorizon.vn
-- user3@viethorizon.vn
-- user4@viethorizon.vn
