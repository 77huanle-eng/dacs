-- ============================================================
-- Migration 006: Complete All Enterprise Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS `blog_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `name` varchar(100) NOT NULL, `slug` varchar(120) NOT NULL, `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`), UNIQUE KEY `uk_bc_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `name` varchar(100) NOT NULL, `description` varchar(255) DEFAULT NULL, PRIMARY KEY (`id`), UNIQUE KEY `uk_perm_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `role_id` bigint unsigned NOT NULL, `permission_id` bigint unsigned NOT NULL, PRIMARY KEY (`id`), UNIQUE KEY `uk_rp` (`role_id`,`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `address` text, `city` varchar(100), `star_rating` tinyint DEFAULT 3, `phone` varchar(20), `email` varchar(100), `status` enum('active','inactive') DEFAULT 'active', `created_at` datetime DEFAULT CURRENT_TIMESTAMP, `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_rooms` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `hotel_id` bigint unsigned NOT NULL, `room_type` varchar(100) NOT NULL, `price_per_night` decimal(15,2) NOT NULL, `max_guests` int DEFAULT 2, `amenities` text, `status` enum('available','occupied','maintenance') DEFAULT 'available', PRIMARY KEY (`id`), KEY `idx_hr_hotel` (`hotel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `room_bookings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `room_id` bigint unsigned NOT NULL, `booking_id` bigint unsigned DEFAULT NULL, `check_in` date NOT NULL, `check_out` date NOT NULL, `guests` int DEFAULT 1, `status` enum('confirmed','cancelled','completed') DEFAULT 'confirmed', `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `type` enum('bus','car','airplane','train','boat') NOT NULL, `company` varchar(255), `route` varchar(500), `price` decimal(15,2), `status` enum('active','inactive') DEFAULT 'active', `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `airline_partners` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `code` varchar(10) NOT NULL, `country` varchar(100), `logo_url` varchar(500), `status` enum('active','inactive') DEFAULT 'active', PRIMARY KEY (`id`), UNIQUE KEY `uk_ap_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `flight_bookings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `booking_id` bigint unsigned DEFAULT NULL, `airline_id` bigint unsigned DEFAULT NULL, `flight_number` varchar(20), `departure_airport` varchar(10), `arrival_airport` varchar(10), `departure_time` datetime, `arrival_time` datetime, `seat_class` enum('economy','business','first') DEFAULT 'economy', `pnr` varchar(20), `status` enum('confirmed','cancelled') DEFAULT 'confirmed', `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `affiliates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `user_id` bigint unsigned NOT NULL, `code` varchar(50) NOT NULL, `commission_rate` decimal(5,2) DEFAULT 5.00, `total_earnings` decimal(15,2) DEFAULT 0, `status` enum('active','inactive','suspended') DEFAULT 'active', `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`), UNIQUE KEY `uk_aff_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `affiliate_commissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `affiliate_id` bigint unsigned NOT NULL, `booking_id` bigint unsigned NOT NULL, `amount` decimal(15,2) NOT NULL, `status` enum('pending','approved','paid') DEFAULT 'pending', `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tour_costs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `tour_id` bigint unsigned NOT NULL, `cost_type` varchar(100) NOT NULL, `amount` decimal(15,2) NOT NULL, `notes` text, `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`), KEY `idx_tc_tour` (`tour_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `itinerary_places` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `itinerary_id` bigint unsigned NOT NULL, `place_name` varchar(255) NOT NULL, `description` text, `latitude` decimal(10,7), `longitude` decimal(10,7), `visit_duration` int DEFAULT 60, `sort_order` int DEFAULT 0, PRIMARY KEY (`id`), KEY `idx_ip_itin` (`itinerary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_campaigns` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `title` varchar(255) NOT NULL, `subject` varchar(255) NOT NULL, `body` text, `status` enum('draft','scheduled','sent','cancelled') DEFAULT 'draft', `scheduled_at` datetime, `sent_at` datetime, `total_recipients` int DEFAULT 0, `opened_count` int DEFAULT 0, `clicked_count` int DEFAULT 0, `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `push_campaigns` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `title` varchar(255) NOT NULL, `message` text, `target_segment` varchar(100) DEFAULT 'all', `status` enum('draft','sent','cancelled') DEFAULT 'draft', `sent_at` datetime, `total_sent` int DEFAULT 0, `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `abandoned_bookings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `user_id` bigint unsigned, `tour_id` bigint unsigned NOT NULL, `step` varchar(50) DEFAULT 'cart', `total_amount` decimal(15,2), `recovered` tinyint(1) DEFAULT 0, `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `languages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `code` varchar(5) NOT NULL, `name` varchar(50) NOT NULL, `native_name` varchar(50), `is_default` tinyint(1) DEFAULT 0, `status` tinyint(1) DEFAULT 1, PRIMARY KEY (`id`), UNIQUE KEY `uk_lang_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `languages` (`code`,`name`,`native_name`,`is_default`) VALUES ('vi','Vietnamese','Tiếng Việt',1),('en','English','English',0),('zh','Chinese','中文',0),('ja','Japanese','日本語',0),('ko','Korean','한국어',0);

CREATE TABLE IF NOT EXISTS `translations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `language_code` varchar(5) NOT NULL, `entity_type` varchar(50) NOT NULL, `entity_id` bigint unsigned NOT NULL, `field` varchar(50) NOT NULL, `value` text, PRIMARY KEY (`id`), UNIQUE KEY `uk_trans` (`language_code`,`entity_type`,`entity_id`,`field`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `exchange_rates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `currency_code` varchar(3) NOT NULL, `currency_name` varchar(50), `rate_to_vnd` decimal(15,4) NOT NULL, `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`id`), UNIQUE KEY `uk_er_code` (`currency_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `exchange_rates` (`currency_code`,`currency_name`,`rate_to_vnd`) VALUES ('USD','US Dollar',25400),('EUR','Euro',27500),('JPY','Japanese Yen',170),('KRW','Korean Won',19),('CNY','Chinese Yuan',3500),('THB','Thai Baht',720);

CREATE TABLE IF NOT EXISTS `device_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `user_id` bigint unsigned NOT NULL, `device_fingerprint` varchar(255), `device_name` varchar(100), `last_ip` varchar(45), `last_active` datetime, `is_trusted` tinyint(1) DEFAULT 0, `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`), KEY `idx_ds_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `suspicious_activities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `user_id` bigint unsigned, `type` varchar(50) NOT NULL, `description` text, `ip_address` varchar(45), `severity` enum('low','medium','high','critical') DEFAULT 'medium', `resolved` tinyint(1) DEFAULT 0, `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_library` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `filename` varchar(255) NOT NULL, `original_name` varchar(255), `mime_type` varchar(100), `size` bigint DEFAULT 0, `path` varchar(500) NOT NULL, `folder` varchar(100) DEFAULT 'general', `uploaded_by` bigint unsigned, `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `job_queues` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `queue` varchar(50) DEFAULT 'default', `payload` text NOT NULL, `attempts` int DEFAULT 0, `max_attempts` int DEFAULT 3, `status` enum('pending','processing','completed','failed') DEFAULT 'pending', `scheduled_at` datetime DEFAULT CURRENT_TIMESTAMP, `started_at` datetime, `completed_at` datetime, `error` text, `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`), KEY `idx_jq_status` (`status`,`scheduled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_behaviors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `user_id` bigint unsigned, `session_id` varchar(100), `event_type` varchar(50) NOT NULL, `page_url` varchar(500), `metadata` json, `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`), KEY `idx_ub_user` (`user_id`), KEY `idx_ub_event` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pricing_rules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `type` enum('seasonal','demand','early_bird','last_minute','holiday','group') NOT NULL, `adjustment_type` enum('percentage','fixed') DEFAULT 'percentage', `adjustment_value` decimal(10,2) NOT NULL, `conditions` json, `priority` int DEFAULT 0, `status` tinyint(1) DEFAULT 1, `start_date` date, `end_date` date, `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vendors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `type` enum('hotel','transport','restaurant','activity','guide') NOT NULL, `contact_person` varchar(100), `phone` varchar(20), `email` varchar(100), `commission_rate` decimal(5,2) DEFAULT 10.00, `status` enum('active','inactive','suspended') DEFAULT 'active', `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vendor_wallets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `vendor_id` bigint unsigned NOT NULL, `balance` decimal(15,2) DEFAULT 0, `total_earned` decimal(15,2) DEFAULT 0, `total_withdrawn` decimal(15,2) DEFAULT 0, `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`id`), UNIQUE KEY `uk_vw_vendor` (`vendor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `accounting_transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `type` enum('income','expense','refund','commission','payout','fee') NOT NULL, `amount` decimal(15,2) NOT NULL, `description` varchar(500), `reference_type` varchar(50), `reference_id` bigint unsigned, `booking_id` bigint unsigned, `user_id` bigint unsigned, `vendor_id` bigint unsigned, `created_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`), KEY `idx_at_type` (`type`), KEY `idx_at_booking` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promotion_usages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT, `promotion_id` bigint unsigned NOT NULL, `user_id` bigint unsigned NOT NULL, `booking_id` bigint unsigned, `discount_amount` decimal(15,2) DEFAULT 0, `used_at` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`), KEY `idx_pu_promo` (`promotion_id`), KEY `idx_pu_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed permissions
INSERT IGNORE INTO `permissions` (`name`, `description`) VALUES
('users.view','Xem danh sách người dùng'),('users.create','Tạo người dùng'),('users.edit','Sửa người dùng'),('users.delete','Xóa người dùng'),
('tours.view','Xem tours'),('tours.create','Tạo tour'),('tours.edit','Sửa tour'),('tours.delete','Xóa tour'),
('bookings.view','Xem bookings'),('bookings.edit','Sửa booking'),
('payments.view','Xem payments'),('payments.edit','Sửa payment'),
('reports.view','Xem báo cáo'),('settings.manage','Quản lý cài đặt'),
('providers.manage','Quản lý providers'),('refunds.manage','Quản lý hoàn tiền'),
('promotions.manage','Quản lý khuyến mãi'),('posts.manage','Quản lý bài viết'),
('support.manage','Quản lý support tickets'),('audit.view','Xem audit logs');
