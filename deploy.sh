#!/bin/bash
# 元气脉法 - 服务器部署脚本
# 用法: ./deploy.sh your-domain.com your-email@example.com

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "用法: ./deploy.sh <域名> <邮箱>"
    echo "示例: ./deploy.sh tcm.example.com admin@example.com"
    exit 1
fi

echo "=== 元气脉法部署 ==="
echo "域名: $DOMAIN"
echo "邮箱: $EMAIL"

# 1. 替换 nginx 配置中的域名
echo "[1/5] 配置 nginx..."
sed -i "s/YOUR_DOMAIN/$DOMAIN/g" nginx/default.conf

# 2. 更新 CORS 允许的域名
echo "[2/5] 更新 CORS 配置..."
sed -i "s|allow_origins=\[.*\]|allow_origins=[\"https://$DOMAIN\", \"http://localhost:5173\"]|" web/app.py

# 3. 先用 HTTP 模式启动（获取证书前不能用 HTTPS）
echo "[3/5] 首次启动（HTTP模式）..."
# 临时 nginx 配置：只监听80，用于证书验证
cat > nginx/default.conf.tmp << EOF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        proxy_pass http://api:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
cp nginx/default.conf nginx/default.conf.ssl
cp nginx/default.conf.tmp nginx/default.conf

docker compose up -d api nginx

# 4. 申请 SSL 证书
echo "[4/5] 申请 Let's Encrypt 证书..."
sleep 5
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email

# 5. 切换到 HTTPS 配置并重启
echo "[5/5] 启用 HTTPS..."
cp nginx/default.conf.ssl nginx/default.conf
rm nginx/default.conf.tmp nginx/default.conf.ssl
docker compose restart nginx
docker compose up -d certbot

echo ""
echo "=== 部署完成 ==="
echo "Web: https://$DOMAIN"
echo "API: https://$DOMAIN/api/"
echo ""
echo "Android app 需要修改 BASE_URL 为: https://$DOMAIN/"
