-- 修正用户、场地管理员姓名的中文显示（若之前导入时编码错误导致显示为问号）
-- 执行方式（PowerShell）：
-- 若在项目根目录：Get-Content .\database\fix_user_admin_names.sql -Encoding UTF8 | mysql -u root -p campus_venue
-- 若在 database 目录：Get-Content .\fix_user_admin_names.sql -Encoding UTF8 | mysql -u root -p campus_venue

SET NAMES utf8mb4;

UPDATE user SET name = '测试学生' WHERE student_id = '2024001' LIMIT 1;
UPDATE venue_admin SET name = '张管理员' WHERE work_id = 'va001' LIMIT 1;
