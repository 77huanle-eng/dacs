ALTER TABLE `payouts` MODIFY COLUMN `status` enum('pending','processing','completed','rejected','failed') NOT NULL DEFAULT 'pending';
