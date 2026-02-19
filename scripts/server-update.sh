#!/bin/bash
# 在服务器上拉取最新代码后执行此脚本：安装依赖、构建、部署前端、重启后端
# 用法：在 ~/software 目录下先 git pull，再 bash scripts/server-update.sh

set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "[1/6] 后端 npm install..."
cd "$ROOT/backend"
npm install

echo "[2/6] 后端构建..."
npm run build

echo "[3/6] 前端 npm install..."
cd "$ROOT/frontend"
npm install

echo "[4/6] 前端构建..."
npm run build

echo "[5/6] 复制前端到网站目录..."
mkdir -p /var/www/campus
cp -r "$ROOT/frontend/dist"/* /var/www/campus/
chown -R caddy:caddy /var/www/campus

echo "[6/6] 重启后端..."
pm2 restart campus-api 2>/dev/null || pm2 start "$ROOT/backend/dist/main.js" --name campus-api

echo "更新完成。"
