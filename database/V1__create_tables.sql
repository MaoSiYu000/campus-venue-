-- 校园场地预约系统 - 初始表结构
-- MySQL 8.0+

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 用户（学生/老师）
-- ----------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` varchar(32) NOT NULL COMMENT '学号',
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(64) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT 1 COMMENT '首次登录需改密',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 场地管理员
-- ----------------------------
CREATE TABLE IF NOT EXISTS `venue_admin` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `work_id` varchar(32) NOT NULL COMMENT '工号',
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(64) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_work_id` (`work_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 系统管理员
-- ----------------------------
CREATE TABLE IF NOT EXISTS `system_admin` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 场地
-- ----------------------------
CREATE TABLE IF NOT EXISTS `venue` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `venue_type` varchar(32) NOT NULL COMMENT 'report_hall, meeting_room, etc.',
  `capacity` int unsigned NOT NULL DEFAULT 0,
  `location` varchar(128) DEFAULT NULL COMMENT '楼栋/区域',
  `address` varchar(255) DEFAULT NULL COMMENT '具体地址',
  `open_time` time DEFAULT NULL COMMENT '开放开始时间',
  `close_time` time DEFAULT NULL COMMENT '开放结束时间',
  `has_projector` tinyint(1) NOT NULL DEFAULT 0,
  `has_sound` tinyint(1) NOT NULL DEFAULT 0,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `photos` json DEFAULT NULL COMMENT '照片路径数组',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_venue_type` (`venue_type`),
  KEY `idx_is_available` (`is_available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 场地管理员管辖范围（多对多）
-- ----------------------------
CREATE TABLE IF NOT EXISTS `venue_admin_venue` (
  `venue_admin_id` bigint unsigned NOT NULL,
  `venue_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`venue_admin_id`, `venue_id`),
  KEY `idx_venue_id` (`venue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 场地不可用时段（维护等）
-- ----------------------------
CREATE TABLE IF NOT EXISTS `venue_unavailable_slot` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `venue_id` bigint unsigned NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_venue_time` (`venue_id`, `start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 预约申请
-- ----------------------------
CREATE TABLE IF NOT EXISTS `booking_application` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `venue_id` bigint unsigned NOT NULL,
  `use_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `activity_name` varchar(128) NOT NULL,
  `organizer` varchar(128) NOT NULL COMMENT '主办单位',
  `estimated_people` int unsigned NOT NULL DEFAULT 0,
  `contact_name` varchar(64) NOT NULL,
  `contact_phone` varchar(32) NOT NULL,
  `description` text,
  `proposal_document_path` varchar(512) DEFAULT NULL COMMENT '策划书路径',
  `status` varchar(32) NOT NULL DEFAULT 'pending' COMMENT 'pending,approved,rejected,used,cancelled',
  `reject_reason` varchar(512) DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL COMMENT 'venue_admin id',
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_venue_id` (`venue_id`),
  KEY `idx_status` (`status`),
  KEY `idx_use_date` (`use_date`),
  KEY `idx_venue_date` (`venue_id`, `use_date`, `start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 公告
-- ----------------------------
CREATE TABLE IF NOT EXISTS `announcement` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `is_must_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '登录后必读',
  `created_by` bigint unsigned DEFAULT NULL COMMENT 'system_admin id',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 通知（站内消息）
-- ----------------------------
CREATE TABLE IF NOT EXISTS `notification` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `target_type` varchar(32) NOT NULL COMMENT 'user, venue_admin, system_admin',
  `target_id` bigint unsigned NOT NULL COMMENT '对应用户表主键',
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_target` (`target_type`, `target_id`),
  KEY `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 用户已读公告（登录后确认用）
-- ----------------------------
CREATE TABLE IF NOT EXISTS `user_announcement_read` (
  `user_id` bigint unsigned NOT NULL COMMENT 'user id 或 venue_admin id，由 role 区分',
  `role` varchar(32) NOT NULL COMMENT 'user, venue_admin',
  `announcement_id` bigint unsigned NOT NULL,
  `read_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `role`, `announcement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
