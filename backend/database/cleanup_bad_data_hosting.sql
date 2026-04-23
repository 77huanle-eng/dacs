-- Hosting-safe SQL for shared hosting/cPanel/phpMyAdmin
-- Import this file after selecting the target database in phpMyAdmin.
-- It intentionally removes CREATE DATABASE and USE statements.


SET NAMES utf8mb4;

-- Dọn dữ liệu test tải lớn + dữ liệu mẫu lỗi rõ ràng.

DELETE pt
FROM promotion_tours pt
INNER JOIN promotions p ON p.id = pt.promotion_id
WHERE p.code LIKE 'LTP%';

DELETE ti
FROM tour_images ti
INNER JOIN tours t ON t.id = ti.tour_id
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

DELETE FROM tours WHERE slug LIKE 'loadtest-tour-%';
DELETE FROM promotions WHERE code LIKE 'LTP%';
DELETE FROM posts WHERE slug LIKE 'loadtest-post-%';
DELETE FROM categories
WHERE slug = 'kham-pha-tong-hop'
  AND NOT EXISTS (
      SELECT 1
      FROM tours t
      WHERE t.category_id = categories.id
  );

-- Dọn dữ liệu bị lỗi cấu trúc cơ bản.
DELETE FROM posts
WHERE title IS NULL
   OR TRIM(title) = ''
   OR (status = 'published' AND (content IS NULL OR TRIM(content) = ''));

DELETE FROM promotions
WHERE code IS NULL
   OR TRIM(code) = ''
   OR end_date < start_date;

DELETE FROM tours
WHERE title IS NULL
   OR TRIM(title) = ''
   OR destination IS NULL
   OR TRIM(destination) = ''
   OR price_adult <= 0;

SELECT
    'cleanup_done' AS job,
    (SELECT COUNT(*) FROM tours WHERE slug LIKE 'loadtest-tour-%') AS remain_loadtest_tours,
    (SELECT COUNT(*) FROM posts WHERE slug LIKE 'loadtest-post-%') AS remain_loadtest_posts,
    (SELECT COUNT(*) FROM promotions WHERE code LIKE 'LTP%') AS remain_loadtest_promotions;
