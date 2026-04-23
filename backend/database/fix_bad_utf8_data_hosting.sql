-- Hosting-safe SQL for shared hosting/cPanel/phpMyAdmin
-- Import this file after selecting the target database in phpMyAdmin.
-- It intentionally removes CREATE DATABASE and USE statements.


SET NAMES utf8mb4;

-- Script làm sạch ký tự lỗi/mã hóa lỗi cơ bản trong dữ liệu text.
-- Chạy an toàn nhiều lần.

UPDATE tours
SET
    title = TRIM(REGEXP_REPLACE(REPLACE(title, '�', ''), '[[:cntrl:]]', ' ')),
    destination = TRIM(REGEXP_REPLACE(REPLACE(destination, '�', ''), '[[:cntrl:]]', ' ')),
    departure_location = TRIM(REGEXP_REPLACE(REPLACE(departure_location, '�', ''), '[[:cntrl:]]', ' ')),
    short_description = NULLIF(TRIM(REGEXP_REPLACE(REPLACE(COALESCE(short_description, ''), '�', ''), '[[:cntrl:]]', ' ')), ''),
    description = NULLIF(TRIM(REGEXP_REPLACE(REPLACE(COALESCE(description, ''), '�', ''), '[[:cntrl:]]', ' ')), ''),
    itinerary = NULLIF(TRIM(REGEXP_REPLACE(REPLACE(COALESCE(itinerary, ''), '�', ''), '[[:cntrl:]]', ' ')), ''),
    included_services = NULLIF(TRIM(REGEXP_REPLACE(REPLACE(COALESCE(included_services, ''), '�', ''), '[[:cntrl:]]', ' ')), ''),
    excluded_services = NULLIF(TRIM(REGEXP_REPLACE(REPLACE(COALESCE(excluded_services, ''), '�', ''), '[[:cntrl:]]', ' ')), ''),
    policy = NULLIF(TRIM(REGEXP_REPLACE(REPLACE(COALESCE(policy, ''), '�', ''), '[[:cntrl:]]', ' ')), ''),
    updated_at = NOW()
WHERE
    title LIKE '%�%' OR destination LIKE '%�%' OR departure_location LIKE '%�%'
    OR short_description LIKE '%�%' OR description LIKE '%�%' OR itinerary LIKE '%�%'
    OR included_services LIKE '%�%' OR excluded_services LIKE '%�%' OR policy LIKE '%�%';

UPDATE posts
SET
    title = TRIM(REGEXP_REPLACE(REPLACE(title, '�', ''), '[[:cntrl:]]', ' ')),
    excerpt = NULLIF(TRIM(REGEXP_REPLACE(REPLACE(COALESCE(excerpt, ''), '�', ''), '[[:cntrl:]]', ' ')), ''),
    content = TRIM(REGEXP_REPLACE(REPLACE(content, '�', ''), '[[:cntrl:]]', ' ')),
    updated_at = NOW()
WHERE title LIKE '%�%' OR excerpt LIKE '%�%' OR content LIKE '%�%';

UPDATE promotions
SET
    title = TRIM(REGEXP_REPLACE(REPLACE(title, '�', ''), '[[:cntrl:]]', ' ')),
    description = NULLIF(TRIM(REGEXP_REPLACE(REPLACE(COALESCE(description, ''), '�', ''), '[[:cntrl:]]', ' ')), ''),
    updated_at = NOW()
WHERE title LIKE '%�%' OR description LIKE '%�%';

UPDATE categories
SET
    name = TRIM(REGEXP_REPLACE(REPLACE(name, '�', ''), '[[:cntrl:]]', ' ')),
    description = NULLIF(TRIM(REGEXP_REPLACE(REPLACE(COALESCE(description, ''), '�', ''), '[[:cntrl:]]', ' ')), ''),
    updated_at = NOW()
WHERE name LIKE '%�%' OR description LIKE '%�%';

UPDATE providers
SET
    company_name = TRIM(REGEXP_REPLACE(REPLACE(company_name, '�', ''), '[[:cntrl:]]', ' ')),
    description = NULLIF(TRIM(REGEXP_REPLACE(REPLACE(COALESCE(description, ''), '�', ''), '[[:cntrl:]]', ' ')), ''),
    support_policy = NULLIF(TRIM(REGEXP_REPLACE(REPLACE(COALESCE(support_policy, ''), '�', ''), '[[:cntrl:]]', ' ')), ''),
    updated_at = NOW()
WHERE company_name LIKE '%�%' OR description LIKE '%�%' OR support_policy LIKE '%�%';

SELECT
    'utf8_fix_done' AS job,
    (SELECT COUNT(*) FROM tours WHERE title LIKE '%�%' OR destination LIKE '%�%') AS remain_bad_tours,
    (SELECT COUNT(*) FROM posts WHERE title LIKE '%�%' OR content LIKE '%�%') AS remain_bad_posts,
    (SELECT COUNT(*) FROM promotions WHERE title LIKE '%�%') AS remain_bad_promotions;
