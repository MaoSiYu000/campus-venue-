-- 为 user 表添加学院、专业、班级字段（编辑资料功能需要）
-- 在 backend 目录执行: mysql -u root -p campus_venue < scripts/add-user-profile-fields.sql
-- 或登录 MySQL 后: USE campus_venue; 再粘贴下面三行执行（若已存在会报 Duplicate column，可忽略）

ALTER TABLE `user` ADD COLUMN `college` VARCHAR(64) NULL AFTER `phone`;
ALTER TABLE `user` ADD COLUMN `major` VARCHAR(64) NULL AFTER `college`;
ALTER TABLE `user` ADD COLUMN `class` VARCHAR(32) NULL AFTER `major`;
