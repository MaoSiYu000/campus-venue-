-- 修正场地名称和位置的中文显示（若之前导入时编码错误导致显示为问号）
-- 执行方式（PowerShell）：Get-Content .\database\fix_venue_encoding.sql -Encoding UTF8 | mysql -u root -p campus_venue

SET NAMES utf8mb4;

UPDATE venue SET name = '第一报告厅', location = '教学楼A栋', address = '教学楼A栋3层301' WHERE venue_type = 'report_hall' AND capacity = 200 LIMIT 1;
UPDATE venue SET name = '第二会议室', location = '行政楼', address = '行政楼2层201' WHERE venue_type = 'meeting_room' AND capacity = 30 LIMIT 1;
UPDATE venue SET name = '学生活动中心', location = '校园中心', address = '校园中心1层' WHERE venue_type = 'activity_center' AND capacity = 500 LIMIT 1;
