# 校园场地预约系统

基于技术规范文档实现的校园场地预约系统，包含学生/老师、场地管理员、系统管理员三个角色模块。

## 技术栈

- **前端**：Vue 3 + TypeScript + Vite + Element Plus + Pinia + Vue Router + Axios
- **后端**：Nest.js + TypeORM + MySQL + JWT
- **数据库**：MySQL 8.0+

## 目录结构

```
software/
├── database/          # 数据库脚本
│   ├── V1__create_tables.sql
│   └── V2__seed_data.sql
├── backend/           # Nest.js 后端
├── frontend/          # Vue 3 前端
└── 校园场地预约系统-技术规范文档.md
```

## 快速开始

### 1. 数据库

创建数据库并执行脚本（按顺序）：

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS campus_venue CHARACTER SET utf8mb4;"
mysql -u root -p campus_venue < database/V1__create_tables.sql
mysql -u root -p campus_venue < database/V2__seed_data.sql
```

### 2. 后端

```bash
cd backend
npm install
# 可选：设置超级管理员密码为 admin123（否则使用种子中的 123456 哈希）
npm run seed
npm run start:dev
```

若已使用旧版数据库，需执行一次迁移以支持个人资料中的学院/专业/班级与头像功能，否则访问个人主页或上传头像可能报 500：

```bash
cd backend
mysql -u root -p campus_venue < scripts/add-user-profile-fields.sql
```

环境变量（可选，在 `backend` 目录下建 `.env`）：

```
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=你的密码
DB_DATABASE=campus_venue
JWT_SECRET=你的密钥
UPLOAD_DIR=uploads
```

后端默认运行在 **http://localhost:3000**，API 前缀为 `/api/v1`。

### 3. 前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 **http://localhost:5173**，开发时已配置代理将 `/api` 和 `/uploads` 转发到后端。

## 测试账号（种子数据）

| 角色         | 账号     | 密码   | 说明 |
|--------------|----------|--------|------|
| 学生/老师    | 2024001  | 123456 | 首次登录需修改密码 |
| 场地管理员   | va001    | 123456 | 管辖前两个场地 |
| 系统管理员   | admin    | 123456 或 admin123 | 执行 `npm run seed` 后为 admin123 |

## 功能概览

- **学生/老师**：登录（含首次改密）、公告确认、场地列表与筛选、场地详情、提交预约（含策划书上传）、我的预约（状态、取消）、退出。
- **场地管理员**：登录、公告确认、待审核列表、通过/驳回（必填理由）、审批记录、场地信息与不可用时段维护、预约总览、退出。
- **系统管理员**：登录、全校预约总览、场地参数修改、用户与场地管理员账号管理、单独发送通知、修改场地管理员管辖范围、发布公告、退出。

## 接口规范

- 基础路径：`/api/v1`
- RESTful 风格，JWT 放在 Header：`Authorization: Bearer <token>`
- 命名与术语遵循《校园场地预约系统-技术规范文档》中的约定。
