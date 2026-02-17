# 元气脉法 - 云服务器部署清单

## 前置条件（人工完成）
1. 云服务器已购买（推荐 Ubuntu 22.04，2核4G）
2. 域名已注册，A记录已指向服务器IP
3. 服务器安全组/防火墙已开放 80 和 443 端口
4. 项目代码已传到服务器（建议放在 /opt/chinamed/）

## Claude 需要执行的任务

### 第一步：安装 Docker
在服务器上安装 Docker 和 Docker Compose（如果还没装的话）。

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh
# 启动 Docker
systemctl enable docker && systemctl start docker
# 验证
docker --version && docker compose version
```

### 第二步：配置域名和 CORS
项目目录：/opt/chinamed/（或实际路径）

1. 编辑 `nginx/default.conf`，将所有 `YOUR_DOMAIN` 替换为实际域名
2. 编辑 `web/app.py`，在 CORS 的 `allow_origins` 列表中添加 `"https://实际域名"`

### 第三步：检查 .env 文件
确认 `/opt/chinamed/.env` 存在且包含：
```
SECRET_KEY=（一个随机字符串，可用 openssl rand -hex 32 生成）
LLM_PROVIDER=openai
LLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
LLM_API_KEY=（智谱AI的API Key）
LLM_MODEL=glm-5
```

### 第四步：首次部署（获取SSL证书）

因为 HTTPS 证书需要先通过 HTTP 验证域名，所以分两步：

**4a. 创建临时 HTTP-only nginx 配置**
将 `nginx/default.conf` 临时替换为只监听 80 端口的版本：
```nginx
server {
    listen 80;
    server_name 实际域名;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        proxy_pass http://api:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**4b. 启动 api 和 nginx**
```bash
docker compose up -d api nginx
```

**4c. 申请 Let's Encrypt 证书**
```bash
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    -d "实际域名" \
    --email "管理员邮箱" \
    --agree-tos \
    --no-eff-email
```

**4d. 恢复完整 HTTPS nginx 配置**
将 `nginx/default.conf` 恢复为包含 443 SSL 的完整版本（确保域名已替换），然后：
```bash
docker compose restart nginx
docker compose up -d certbot
```

### 第五步：验证部署
```bash
# 检查所有容器运行状态
docker compose ps

# 测试 HTTPS 是否正常
curl -I https://实际域名/

# 测试 API
curl https://实际域名/api/system/health
```

### 第六步：创建管理员账号
```bash
docker compose exec api python -c "
from src.database.connection import SessionLocal
from src.database.models import User
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=['bcrypt'])
db = SessionLocal()
user = User(username='admin', hashed_password=pwd_context.hash('设置一个密码'), role='admin', full_name='管理员')
db.add(user)
db.commit()
print('管理员账号创建成功')
db.close()
"
```

## 项目结构说明
```
chinamed/
├── Dockerfile              # 后端容器构建
├── docker-compose.yml      # 编排：api + nginx + certbot
├── requirements-deploy.txt # 部署用Python依赖（轻量，无torch）
├── nginx/default.conf      # nginx 反向代理 + SSL 配置
├── deploy.sh               # 一键部署脚本（可选）
├── .env                    # 环境变量（密钥、API Key）
├── web/                    # FastAPI 后端 + 前端构建产物
│   ├── app.py              # FastAPI 入口
│   ├── routers/            # API 路由
│   └── frontend/dist/      # Vite 构建的前端静态文件
├── src/                    # 业务逻辑
│   ├── database/           # SQLAlchemy 模型和连接
│   └── services/           # OCR、LLM、分析等服务
└── data/                   # 上传文件存储目录
```

## 部署后还需要做的事
- 修改 Android app 的 BASE_URL 为 `https://实际域名/`
  文件：android/app/build.gradle.kts 第21行
  改为：buildConfigField("String", "BASE_URL", "\"https://实际域名/\"")
- 重新构建 APK 并分发给测试用户
