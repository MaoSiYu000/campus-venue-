-- 为实体中已定义但数据库表里缺失的字段补列（头像、电话）
--
-- 用户名和数据库名来自后端配置：
--   - 若项目里有 backend/.env，看其中的 DB_USERNAME 和 DB_DATABASE（以及 DB_PASSWORD）
--   - 若没有 .env，默认是：用户名 root，数据库名 campus_venue，密码为空
--
-- 在命令行执行（把 用户名 和 数据库名 换成你的，-p 会提示输入密码）：
--   cd backend
--   mysql -u 用户名 -p 数据库名 < add-avatar-phone-columns.sql
-- 例如默认情况（用户 root、数据库 campus_venue、无密码）：
--   mysql -u root campus_venue < add-avatar-phone-columns.sql
-- 有密码时：
--   mysql -u root -p campus_venue < add-avatar-phone-columns.sql
--
-- 若某列已存在会报 Duplicate column，可忽略该条或注释掉对应一行

-- user 表：缺少 avatar 会报 Unknown column 'User.avatar'
ALTER TABLE `user` ADD COLUMN `avatar` VARCHAR(255) NULL;
-- 若 user 表本来没有 phone，取消下面注释：
-- ALTER TABLE `user` ADD COLUMN `phone` VARCHAR(32) NULL;

-- venue_admin 表
ALTER TABLE `venue_admin` ADD COLUMN `phone` VARCHAR(32) NULL;
ALTER TABLE `venue_admin` ADD COLUMN `avatar` VARCHAR(255) NULL;

-- system_admin 表
ALTER TABLE `system_admin` ADD COLUMN `phone` VARCHAR(32) NULL;
ALTER TABLE `system_admin` ADD COLUMN `avatar` VARCHAR(255) NULL;
