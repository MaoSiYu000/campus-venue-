-- 初始数据：超级管理员、示例场地、示例用户
-- 密码均为 BCrypt。应用首次启动时会执行 seed 写入正确哈希。
-- 超级管理员 admin / admin123
-- 测试学生 2024001 / 123456（模拟身份证后六位）
-- 测试场地管理员 va001 / 123456

SET NAMES utf8mb4;

-- 密码 123456 的 BCrypt 哈希（cost 10）
-- 密码 admin123 由后端 seed 写入
INSERT INTO `system_admin` (`username`, `password_hash`) VALUES
('admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW')
ON DUPLICATE KEY UPDATE `username` = `username`;

INSERT INTO `user` (`student_id`, `password_hash`, `name`, `must_change_password`) VALUES
('2024001', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '测试学生', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `venue_admin` (`work_id`, `password_hash`, `name`) VALUES
('va001', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '张管理员')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 示例场地（无唯一键用 INSERT IGNORE 避免重复执行报错可改为先 SELECT 再 INSERT）
INSERT INTO `venue` (`name`, `venue_type`, `capacity`, `location`, `address`, `open_time`, `close_time`, `has_projector`, `has_sound`, `is_available`) VALUES
('第一报告厅', 'report_hall', 200, '教学楼A栋', '教学楼A栋3层301', '08:00:00', '22:00:00', 1, 1, 1),
('第二会议室', 'meeting_room', 30, '行政楼', '行政楼2层201', '09:00:00', '18:00:00', 1, 0, 1),
('学生活动中心', 'activity_center', 500, '校园中心', '校园中心1层', '08:00:00', '22:00:00', 1, 1, 1);

-- 场地管理员 va001 管辖全部三个场地（报告厅、会议室、学生活动中心）
INSERT IGNORE INTO `venue_admin_venue` (`venue_admin_id`, `venue_id`)
SELECT va.id, v.id FROM venue_admin va CROSS JOIN venue v
WHERE va.work_id = 'va001' AND v.id IN (1, 2, 3);
