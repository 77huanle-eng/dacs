ALTER TABLE `payouts` ADD COLUMN IF NOT EXISTS `booking_id` bigint(20) unsigned DEFAULT NULL AFTER `provider_id`;
