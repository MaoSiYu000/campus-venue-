/**
 * 给 announcement 表添加 target_role 列。
 * 用法：在 backend 目录下执行  node add-announcement-target-role.js
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

console.log('读取配置: 数据库=' + database + ', 用户=' + user + ', 密码=' + (password ? '***(' + password.length + '字符)' : '(空)'));

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
    } else {
      console.log('\n请确认：1) MySQL 已启动  2) backend/.env 里的配置是否正确');
    }
    process.exit(1);
  }
  try {
    await conn.query('ALTER TABLE `announcement` ADD COLUMN `target_role` VARCHAR(32) NULL DEFAULT NULL AFTER `is_must_read`');
    console.log('  [成功] 添加 target_role 列');
    console.log('\n完成！');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME' || (e.message && e.message.includes('Duplicate column'))) {
      console.log('  [跳过] target_role 列已存在');
    } else {
      console.error('  [失败]', e.message);
      process.exit(1);
    }
  }
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
