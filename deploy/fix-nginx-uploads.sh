#!/bin/bash
# 在服务器 120.26.124.180 上运行此脚本，添加 /uploads/ 代理

set -e

# 查找包含 120.26.124.180 的 nginx 配置
CONF_CANDIDATES=(
  "/www/server/panel/vhost/nginx/120.26.124.180.conf"
  "/www/server/panel/vhost/nginx/default.conf"
  "/etc/nginx/sites-enabled/default"
  "/etc/nginx/conf.d/default.conf"
  "/etc/nginx/nginx.conf"
)

CONF=""
for f in "${CONF_CANDIDATES[@]}"; do
  if [[ -f "$f" ]] && grep -q "120.26.124.180\|server_name" "$f" 2>/dev/null; then
    CONF="$f"
    break
  fi
done

# 若未找到，在常见目录搜索
if [[ -z "$CONF" ]]; then
  for dir in /www/server/panel/vhost/nginx /etc/nginx/sites-enabled /etc/nginx/conf.d; do
    [[ -d "$dir" ]] || continue
    F=$(grep -rl "120.26.124.180" "$dir" 2>/dev/null | head -1)
    [[ -n "$F" ]] && CONF="$F" && break
  done
fi

if [[ -z "$CONF" || ! -f "$CONF" ]]; then
  echo "未找到站点配置，请手动指定: $0 /path/to/site.conf"
  if [[ -n "$1" ]]; then
    CONF="$1"
  else
    echo "常见路径: /www/server/panel/vhost/nginx/ 或 /etc/nginx/sites-enabled/"
    ls -la /www/server/panel/vhost/nginx/ 2>/dev/null || ls -la /etc/nginx/sites-enabled/ 2>/dev/null || true
    exit 1
  fi
fi

echo "使用配置: $CONF"

# 检查是否已有 /uploads/
if grep -q "location /uploads/" "$CONF"; then
  echo "已存在 location /uploads/，无需修改"
  nginx -t && nginx -s reload 2>/dev/null && echo "Nginx 已重载" || true
  exit 0
fi

# 在 "location /" 之前插入
UPLOADS_BLOCK='    location /uploads/ {\n        proxy_pass http://127.0.0.1:3000;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n\n'

# 备份
cp "$CONF" "${CONF}.bak.$(date +%Y%m%d%H%M%S)"

# 插入（在 location / 之前）
if sed -i.bak '/location \/ {/i\    location /uploads/ {\n        proxy_pass http://127.0.0.1:3000;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n' "$CONF" 2>/dev/null; then
  echo "已添加 location /uploads/"
else
  # 备用：在 server { 后插入
  sed -i.bak '/server {/a\    location /uploads/ {\n        proxy_pass http://127.0.0.1:3000;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n' "$CONF"
  echo "已添加 location /uploads/ (备用位置)"
fi

nginx -t && nginx -s reload && echo "Nginx 配置已生效" || { echo "配置有误，已恢复备份"; mv "${CONF}.bak" "$CONF"; exit 1; }
