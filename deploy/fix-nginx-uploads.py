#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""在服务器上运行，为 Nginx 添加 /uploads/ 代理。用法: python3 fix-nginx-uploads.py [配置文件路径]"""

import os
import re
import sys
from datetime import datetime

UPLOADS_BLOCK = '''    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

'''

def find_config():
    candidates = [
        "/www/server/panel/vhost/nginx/120.26.124.180.conf",
        "/www/server/panel/vhost/nginx/default.conf",
        "/etc/nginx/sites-enabled/default",
        "/etc/nginx/conf.d/default.conf",
    ]
    for p in candidates:
        if os.path.isfile(p):
            with open(p, "r", encoding="utf-8", errors="ignore") as f:
                if "120.26.124.180" in f.read():
                    return p
    for d in ["/www/server/panel/vhost/nginx", "/etc/nginx/sites-enabled", "/etc/nginx/conf.d"]:
        if os.path.isdir(d):
            for f in os.listdir(d):
                path = os.path.join(d, f)
                if os.path.isfile(path) and f.endswith(".conf"):
                    try:
                        with open(path, "r", encoding="utf-8", errors="ignore") as fp:
                            cont = fp.read()
                            if "120.26.124.180" in cont and "server" in cont:
                                return path
                    except Exception:
                        pass
    return None

def main():
    conf = sys.argv[1] if len(sys.argv) > 1 else find_config()
    if not conf or not os.path.isfile(conf):
        print("未找到配置文件。请指定: python3 fix-nginx-uploads.py /path/to/site.conf")
        print("常见: /www/server/panel/vhost/nginx/ 或 /etc/nginx/sites-enabled/")
        sys.exit(1)

    with open(conf, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    if "location /uploads/" in content:
        print("已存在 location /uploads/，无需修改")
        os.system("nginx -t && nginx -s reload")
        return

    # 在 "location /" 之前插入
    pattern = r'(\s+)(location\s+/\s*\{)'
    new_content = re.sub(pattern, UPLOADS_BLOCK + r'\1\2', content, count=1)
    if new_content == content:
        # 在 server { 后插入
        pattern = r'(server\s*\{)'
        new_content = re.sub(pattern, r'\1\n' + UPLOADS_BLOCK, content, count=1)

    if new_content == content:
        print("无法自动插入，请手动添加 location /uploads/ 块")
        sys.exit(1)

    backup = conf + ".bak." + datetime.now().strftime("%Y%m%d%H%M%S")
    with open(backup, "w", encoding="utf-8") as f:
        f.write(content)
    with open(conf, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"已修改 {conf}，备份: {backup}")
    ret = os.system("nginx -t && nginx -s reload")
    if ret != 0:
        print("Nginx 重载失败，已恢复备份")
        with open(conf, "w", encoding="utf-8") as f:
            f.write(content)
        sys.exit(1)
    print("Nginx 已重载，/uploads/ 代理已生效")

if __name__ == "__main__":
    main()
