/**
 * 给数据库补上 avatar、phone 等缺失的列。
 * 用法：在 backend 目录下执行  node run-add-columns.js
 * 会读取 .env 里的 DB_* 配置（没有则用默认：root / campus_venue / 无密码）
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// 读取 .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.substring(0, idx).trim();
      let val = line.substring(idx + 1).trim();
      // 去掉引号
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '3306', 10);
const user = process.env.DB_USERNAME || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_DATABASE || 'campus_venue';

// 调试：显示读取到的配置（密码只显示长度）
console.log('读取配置: 数据库=' + database + ', 用户=' + user + ', 密码=' + (password ? '***(' + password.length + '字符)' : '(空)'));

const sqls = [
  { name: 'user.avatar', sql: 'ALTER TABLE `user` ADD COLUMN `avatar` VARCHAR(255) NULL' },
  { name: 'venue_admin.phone', sql: 'ALTER TABLE `venue_admin` ADD COLUMN `phone` VARCHAR(32) NULL' },
  { name: 'venue_admin.avatar', sql: 'ALTER TABLE `venue_admin` ADD COLUMN `avatar` VARCHAR(255) NULL' },
  { name: 'system_admin.phone', sql: 'ALTER TABLE `system_admin` ADD COLUMN `phone` VARCHAR(32) NULL' },
  { name: 'system_admin.avatar', sql: 'ALTER TABLE `system_admin` ADD COLUMN `avatar` VARCHAR(255) NULL' },
];

async function main() {
  console.log('\n正在连接数据库:', database, '(用户:', user + ')');
  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user, password, database });
    console.log('连接成功！\n');
  } catch (e) {
    console.error('\n连接失败:', e.message);
    if (e.code === 'ER_ACCESS_DENIED_ERROR' || e.message.includes('Access denied')) {
      console.log('\n提示：密码验证失败。');
      console.log('请检查 backend/.env 文件里的 DB_PASSWORD 是否正确。');
      console.log('当前读取到的密码长度:', password ? password.length : 0);
    } else {
      console.log('\n请确认：1) MySQL 已启动  2) backend/.env 里的配置是否正确');
    }
    process.exit(1);
  }
  let ok = 0;
  let skip = 0;
  for (const { name, sql } of sqls) {
    try {
      await conn.query(sql);
      console.log('  [成功]', name);
      ok++;
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || (e.message && e.message.includes('Duplicate column'))) {
        console.log('  [跳过]', name, '(列已存在)');
        skip++;
      } else {
        console.error('  [失败]', name, e.message);
      }
    }
  }
  await conn.end();
  console.log('\n完成。成功:', ok, '跳过:', skip);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
