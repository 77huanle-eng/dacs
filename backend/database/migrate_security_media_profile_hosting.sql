-- Hosting-safe SQL for shared hosting/cPanel/phpMyAdmin
-- Import this file after selecting the target database in phpMyAdmin.
-- It intentionally removes CREATE DATABASE and USE statements.


SET NAMES utf8mb4;

SET @has_users_token_invalid_before := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'token_invalid_before'
);

SET @sql_users_token_invalid_before := IF(
    @has_users_token_invalid_before = 0,
    'ALTER TABLE users ADD COLUMN token_invalid_before DATETIME NULL AFTER email_verified_at',
    'SELECT 1'
);
PREPARE stmt_users_token_invalid_before FROM @sql_users_token_invalid_before;
EXECUTE stmt_users_token_invalid_before;
DEALLOCATE PREPARE stmt_users_token_invalid_before;

SET @has_profiles_city := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user_profiles'
      AND COLUMN_NAME = 'city'
);

SET @sql_profiles_city := IF(
    @has_profiles_city = 0,
    'ALTER TABLE user_profiles ADD COLUMN city VARCHAR(120) NULL AFTER user_id',
    'SELECT 1'
);
PREPARE stmt_profiles_city FROM @sql_profiles_city;
EXECUTE stmt_profiles_city;
DEALLOCATE PREPARE stmt_profiles_city;

SET @has_promotions_image := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'promotions'
      AND COLUMN_NAME = 'image_url'
);

SET @sql_promotions_image := IF(
    @has_promotions_image = 0,
    'ALTER TABLE promotions ADD COLUMN image_url VARCHAR(255) NULL AFTER description',
    'SELECT 1'
);
PREPARE stmt_promotions_image FROM @sql_promotions_image;
EXECUTE stmt_promotions_image;
DEALLOCATE PREPARE stmt_promotions_image;
