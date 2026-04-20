USE `viet_horizon_travel`;

SET NAMES utf8mb4;

-- Dữ liệu tải lớn để test phân trang, filter, dashboard.
-- Chạy sau schema.sql + seed.sql.

INSERT INTO categories (name, slug, description, status, created_at, updated_at)
VALUES ('Khám phá tổng hợp', 'kham-pha-tong-hop', 'Danh mục mặc định cho dữ liệu kiểm thử tải.', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    status = VALUES(status),
    updated_at = NOW();

SET @provider_id = (
    SELECT id
    FROM providers
    ORDER BY (status = 'active') DESC, id ASC
    LIMIT 1
);

SET @author_id = (
    SELECT id
    FROM users
    ORDER BY id ASC
    LIMIT 1
);

DROP TEMPORARY TABLE IF EXISTS tmp_categories;
CREATE TEMPORARY TABLE tmp_categories AS
SELECT id, ROW_NUMBER() OVER (ORDER BY id ASC) - 1 AS idx
FROM categories
WHERE status = 'active';

SET @category_count = (SELECT COUNT(*) FROM tmp_categories);
SET @category_count = IFNULL(NULLIF(@category_count, 0), 1);

DROP TEMPORARY TABLE IF EXISTS tmp_seq_1000;
CREATE TEMPORARY TABLE tmp_seq_1000 (
    n INT PRIMARY KEY
);

INSERT INTO tmp_seq_1000 (n)
WITH RECURSIVE seq AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 1000
)
SELECT n FROM seq;

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
SELECT
    @provider_id,
    c.id,
    CONCAT('Tour khám phá số ', LPAD(s.n, 4, '0')),
    CONCAT('loadtest-tour-', LPAD(s.n, 4, '0')),
    CASE MOD(s.n, 12)
        WHEN 0 THEN 'Đà Nẵng'
        WHEN 1 THEN 'Phú Quốc'
        WHEN 2 THEN 'Đà Lạt'
        WHEN 3 THEN 'Nha Trang'
        WHEN 4 THEN 'Huế'
        WHEN 5 THEN 'Sapa'
        WHEN 6 THEN 'Seoul'
        WHEN 7 THEN 'Tokyo'
        WHEN 8 THEN 'Bangkok'
        WHEN 9 THEN 'Singapore'
        WHEN 10 THEN 'Bali'
        ELSE 'Kuala Lumpur'
    END,
    CASE MOD(s.n, 5)
        WHEN 0 THEN 'TP. Hồ Chí Minh'
        WHEN 1 THEN 'Hà Nội'
        WHEN 2 THEN 'Đà Nẵng'
        WHEN 3 THEN 'Cần Thơ'
        ELSE 'Hải Phòng'
    END,
    3 + MOD(s.n, 5),
    2 + MOD(s.n, 4),
    3200000 + (s.n * 21000),
    2200000 + (s.n * 13000),
    (3200000 + (s.n * 21000)) - (100000 + MOD(s.n, 8) * 50000),
    CASE MOD(s.n, 10)
        WHEN 0 THEN 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80'
        WHEN 1 THEN 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
        WHEN 2 THEN 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80'
        WHEN 3 THEN 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80'
        WHEN 4 THEN 'https://images.unsplash.com/photo-1538485399081-7c897f5f08f1?auto=format&fit=crop&w=1200&q=80'
        WHEN 5 THEN 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80'
        WHEN 6 THEN 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80'
        WHEN 7 THEN 'https://images.unsplash.com/photo-1577648188599-291bb8b831c3?auto=format&fit=crop&w=1200&q=80'
        WHEN 8 THEN 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1200&q=80'
        ELSE 'https://images.unsplash.com/photo-1513415564515-763d91423bdd?auto=format&fit=crop&w=1200&q=80'
    END,
    CONCAT('Tour kiểm thử dữ liệu thực tế số ', LPAD(s.n, 4, '0'), ' với lịch trình rõ ràng, phù hợp đa dạng nhóm khách.'),
    CONCAT('Nội dung mô tả chi tiết cho tour số ', LPAD(s.n, 4, '0'), '.'),
    'Ngày 1: Khởi hành theo lịch trình.|Ngày 2: Trải nghiệm điểm nhấn địa phương.|Ngày 3: Kết thúc hành trình.',
    'Vé di chuyển; Khách sạn; HDV; Bảo hiểm cơ bản',
    'Chi phí cá nhân; Tip; VAT',
    'Hủy trước 7 ngày hoàn 80%, sau thời hạn áp dụng theo điều kiện cụ thể.',
    30 + MOD(s.n, 35),
    20 + MOD(s.n, 25),
    DATE_ADD(CURDATE(), INTERVAL (MOD(s.n, 180) + 3) DAY),
    DATE_ADD(DATE_ADD(CURDATE(), INTERVAL (MOD(s.n, 180) + 3) DAY), INTERVAL (2 + MOD(s.n, 4)) DAY),
    'active',
    IF(MOD(s.n, 9) = 0, 1, 0),
    80 + MOD(s.n * 7, 1500),
    0,
    0,
    NOW(),
    NOW()
FROM tmp_seq_1000 s
JOIN tmp_categories c ON c.idx = MOD(s.n - 1, @category_count)
WHERE @provider_id IS NOT NULL
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
    views_count = VALUES(views_count),
    updated_at = NOW();

DROP TEMPORARY TABLE IF EXISTS tmp_img_variant;
CREATE TEMPORARY TABLE tmp_img_variant (
    sort_order INT NOT NULL,
    image_url VARCHAR(255) NOT NULL
);

INSERT INTO tmp_img_variant (sort_order, image_url)
VALUES
    (1, 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80'),
    (2, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'),
    (3, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80');

INSERT INTO tour_images (tour_id, image_url, sort_order, created_at, updated_at)
SELECT t.id, iv.image_url, iv.sort_order, NOW(), NOW()
FROM tours t
JOIN tmp_img_variant iv ON 1 = 1
WHERE t.slug LIKE 'loadtest-tour-%'
  AND NOT EXISTS (
      SELECT 1
      FROM tour_images ti
      WHERE ti.tour_id = t.id
        AND ti.sort_order = iv.sort_order
  );

INSERT INTO posts (
    author_id,
    title,
    slug,
    excerpt,
    thumbnail,
    content,
    status,
    published_at,
    created_at,
    updated_at
)
SELECT
    @author_id,
    CONCAT('Cẩm nang du lịch số ', LPAD(s.n, 4, '0')),
    CONCAT('loadtest-post-', LPAD(s.n, 4, '0')),
    CONCAT('Bài viết kiểm thử số ', LPAD(s.n, 4, '0'), ' cho module tin tức du lịch.'),
    CASE MOD(s.n, 6)
        WHEN 0 THEN 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80'
        WHEN 1 THEN 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80'
        WHEN 2 THEN 'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1200&q=80'
        WHEN 3 THEN 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80'
        WHEN 4 THEN 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80'
        ELSE 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80'
    END,
    CONCAT('Nội dung bài viết kiểm thử số ', LPAD(s.n, 4, '0'), '.'),
    'published',
    DATE_SUB(NOW(), INTERVAL s.n DAY),
    NOW(),
    NOW()
FROM tmp_seq_1000 s
WHERE s.n <= 120
  AND @author_id IS NOT NULL
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    excerpt = VALUES(excerpt),
    thumbnail = VALUES(thumbnail),
    content = VALUES(content),
    status = VALUES(status),
    published_at = VALUES(published_at),
    updated_at = NOW();

INSERT INTO promotions (
    provider_id,
    code,
    title,
    description,
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
SELECT
    @provider_id,
    CONCAT('LTP', LPAD(s.n, 4, '0')),
    CONCAT('Khuyến mãi loadtest ', LPAD(s.n, 4, '0')),
    CONCAT('Mã khuyến mãi kiểm thử hệ thống số ', LPAD(s.n, 4, '0')),
    IF(MOD(s.n, 2) = 0, 'percent', 'fixed'),
    IF(MOD(s.n, 2) = 0, 5 + MOD(s.n, 16), 150000 + MOD(s.n, 8) * 50000),
    2000000 + MOD(s.n, 6) * 500000,
    IF(MOD(s.n, 2) = 0, 2000000, NULL),
    DATE_SUB(NOW(), INTERVAL 10 DAY),
    DATE_ADD(NOW(), INTERVAL 120 DAY),
    3000,
    0,
    'active',
    NOW(),
    NOW()
FROM tmp_seq_1000 s
WHERE s.n <= 150
  AND @provider_id IS NOT NULL
ON DUPLICATE KEY UPDATE
    provider_id = VALUES(provider_id),
    title = VALUES(title),
    description = VALUES(description),
    discount_type = VALUES(discount_type),
    discount_value = VALUES(discount_value),
    min_order_value = VALUES(min_order_value),
    max_discount_value = VALUES(max_discount_value),
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    usage_limit = VALUES(usage_limit),
    status = VALUES(status),
    updated_at = NOW();

INSERT IGNORE INTO promotion_tours (promotion_id, tour_id, created_at, updated_at)
SELECT p.id, t.id, NOW(), NOW()
FROM promotions p
JOIN tours t
  ON t.slug = CONCAT('loadtest-tour-', LPAD(CAST(SUBSTRING(p.code, 4) AS UNSIGNED), 4, '0'))
WHERE p.code LIKE 'LTP%';

SELECT
    'seed_1000_ready' AS job,
    (SELECT COUNT(*) FROM tours WHERE slug LIKE 'loadtest-tour-%') AS loadtest_tours,
    (SELECT COUNT(*) FROM tour_images ti INNER JOIN tours t ON t.id = ti.tour_id WHERE t.slug LIKE 'loadtest-tour-%') AS loadtest_images,
    (SELECT COUNT(*) FROM posts WHERE slug LIKE 'loadtest-post-%') AS loadtest_posts,
    (SELECT COUNT(*) FROM promotions WHERE code LIKE 'LTP%') AS loadtest_promotions;
