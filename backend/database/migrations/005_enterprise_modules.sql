-- Enterprise Module: Login History
CREATE TABLE IF NOT EXISTS `login_histories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `device_type` varchar(20) DEFAULT NULL,
  `browser` varchar(50) DEFAULT NULL,
  `os` varchar(50) DEFAULT NULL,
  `status` enum('success','failed','lockout') NOT NULL DEFAULT 'success',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_lh_user` (`user_id`),
  KEY `idx_lh_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enterprise Module: Booking Holds (10-minute seat lock)
CREATE TABLE IF NOT EXISTS `booking_holds` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `tour_id` bigint(20) unsigned NOT NULL,
  `departure_id` bigint(20) unsigned NOT NULL,
  `guests` int NOT NULL DEFAULT 1,
  `status` enum('active','released','expired','converted') NOT NULL DEFAULT 'active',
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_bh_user` (`user_id`),
  KEY `idx_bh_status` (`status`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enterprise Module: Loyalty Points
CREATE TABLE IF NOT EXISTS `loyalty_points` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `points` int NOT NULL,
  `type` enum('earn','redeem') NOT NULL,
  `source_type` varchar(50) DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_lp_user` (`user_id`),
  KEY `idx_lp_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enterprise Module: Membership Tiers
CREATE TABLE IF NOT EXISTS `membership_tiers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `min_points` int NOT NULL DEFAULT 0,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `benefits` text DEFAULT NULL,
  `icon` varchar(10) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `membership_tiers` (`name`, `min_points`, `discount_percent`, `benefits`, `icon`) VALUES
('Silver', 0, 0.00, 'Tích điểm cơ bản, nhận thông báo ưu đãi', '🥈'),
('Gold', 500, 3.00, 'Giảm 3% mọi tour, ưu tiên giữ chỗ, hỗ trợ nhanh', '🥇'),
('Platinum', 2000, 5.00, 'Giảm 5%, upgrade phòng, concierge riêng', '💎'),
('Diamond', 5000, 8.00, 'Giảm 8%, VIP lounge, personal travel advisor', '👑');

-- Add loyalty columns to users if not exist
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `loyalty_points` int NOT NULL DEFAULT 0;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `membership_tier` varchar(20) NOT NULL DEFAULT 'Silver';
