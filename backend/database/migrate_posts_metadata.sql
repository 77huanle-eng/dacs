-- Bổ sung metadata cho bảng posts trên DB cũ (an toàn khi chạy nhiều lần)
SET @schema_name := DATABASE();

SET @has_column := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'category'
);
SET @ddl := IF(@has_column = 0, 'ALTER TABLE posts ADD COLUMN category VARCHAR(120) NULL AFTER excerpt', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_column := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'tags'
);
SET @ddl := IF(@has_column = 0, 'ALTER TABLE posts ADD COLUMN tags TEXT NULL AFTER category', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_column := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'gallery'
);
SET @ddl := IF(@has_column = 0, 'ALTER TABLE posts ADD COLUMN gallery LONGTEXT NULL AFTER tags', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_column := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'meta_title'
);
SET @ddl := IF(@has_column = 0, 'ALTER TABLE posts ADD COLUMN meta_title VARCHAR(255) NULL AFTER content', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_column := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'meta_description'
);
SET @ddl := IF(@has_column = 0, 'ALTER TABLE posts ADD COLUMN meta_description VARCHAR(400) NULL AFTER meta_title', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_column := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'is_featured'
);
SET @ddl := IF(@has_column = 0, 'ALTER TABLE posts ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER meta_description', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_index := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts' AND INDEX_NAME = 'idx_posts_category'
);
SET @ddl := IF(@has_index = 0, 'ALTER TABLE posts ADD INDEX idx_posts_category (category)', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_index := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts' AND INDEX_NAME = 'idx_posts_is_featured'
);
SET @ddl := IF(@has_index = 0, 'ALTER TABLE posts ADD INDEX idx_posts_is_featured (is_featured)', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE posts
SET category = COALESCE(NULLIF(category, ''), 'Cẩm nang'),
    meta_title = COALESCE(NULLIF(meta_title, ''), title),
    meta_description = COALESCE(NULLIF(meta_description, ''), excerpt),
    updated_at = NOW();
