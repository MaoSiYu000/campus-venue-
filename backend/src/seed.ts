import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function loadEnv() {
  const candidates = [
    join(__dirname, '..', '.env'),
    join(process.cwd(), '.env'),
  ];
  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      readFileSync(envPath, 'utf-8')
        .replace(/\r\n/g, '\n')
        .split('\n')
        .forEach((line) => {
          const m = line.match(/^\s*([^#=]+)=(.*)$/);
          if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
        });
      return;
    }
  }
}
loadEnv();

if (!process.env.DB_PASSWORD && process.env.DB_PASSWORD !== '') {
  console.warn('Warning: DB_PASSWORD not set in .env, MySQL may reject connection.');
}

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'campus_venue',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
  charset: 'utf8mb4',
  extra: { charset: 'utf8mb4' },
});

async function seed() {
  await dataSource.initialize();
  const hash123456 = await bcrypt.hash('123456', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  await dataSource.query(
    `UPDATE user SET password_hash = ? WHERE student_id = '2024001'`,
    [hash123456],
  );
  await dataSource.query(
    `UPDATE venue_admin SET password_hash = ? WHERE work_id = 'va001'`,
    [hash123456],
  );
  await dataSource.query(
    `INSERT INTO system_admin (username, password_hash) VALUES ('admin', ?) ON DUPLICATE KEY UPDATE password_hash = ?`,
    [adminHash, adminHash],
  );

  // 修正场地名称和位置的中文（避免问号乱码）
  await dataSource.query(
    `UPDATE venue SET name = ?, location = ?, address = ? WHERE venue_type = 'report_hall' LIMIT 1`,
    ['第一报告厅', '教学楼A栋', '教学楼A栋3层301'],
  );
  await dataSource.query(
    `UPDATE venue SET name = ?, location = ?, address = ? WHERE venue_type = 'meeting_room' LIMIT 1`,
    ['第二会议室', '行政楼', '行政楼2层201'],
  );
  await dataSource.query(
    `UPDATE venue SET name = ?, location = ?, address = ? WHERE venue_type = 'activity_center' LIMIT 1`,
    ['学生活动中心', '校园中心', '校园中心1层'],
  );

  // 修正用户、场地管理员姓名的中文（避免问号乱码）
  await dataSource.query(
    `UPDATE user SET name = ? WHERE student_id = '2024001' LIMIT 1`,
    ['测试学生'],
  );
  await dataSource.query(
    `UPDATE venue_admin SET name = ? WHERE work_id = 'va001' LIMIT 1`,
    ['张管理员'],
  );

  console.log('Seed done: 密码已重置，场地/用户/管理员名称已修正为中文');
  await dataSource.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
