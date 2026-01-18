# 移动应用部署指南

本文档详细介绍如何将中医脉象九宫格OCR识别系统部署到Android、iOS和HarmonyOS平台。

## 目录

1. [环境准备](#环境准备)
2. [开发环境搭建](#开发环境搭建)
3. [后端部署](#后端部署)
4. [移动应用部署](#移动应用部署)
5. [各平台详细部署步骤](#各平台详细部署步骤)
6. [常见问题](#常见问题)

---

## 环境准备

### 必需软件

#### 通用
- **Git**: 版本控制
- **Python**: 3.9+
- **Flutter**: 3.0+
- **Node.js**: 16+ (可选，用于Web前端)

#### 后端
- **SQLite**: 数据库
- **FastAPI**: Python Web框架

#### Android
- **Android Studio**: Android开发
- **Java JDK**: 11+
- **Android SDK**: API 21+

#### iOS (仅macOS)
- **Xcode**: 14+
- **CocoaPods**: 依赖管理
- **MacOS**: Monterey+

#### HarmonyOS
- **DevEco Studio**: 鸿蒙开发IDE
- **HarmonyOS SDK**: 3.0+

---

## 开发环境搭建

### 1. 安装Flutter

```bash
# macOS
brew install --cask flutter

# Linux
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"

# 验证安装
flutter doctor
```

### 2. 配置Flutter

```bash
# 同意Android许可证
flutter doctor --android-licenses

# 验证所有环境
flutter doctor -v
```

### 3. 克隆项目

```bash
git clone https://github.com/qhuang2010/zhongyimedic.git
cd zhongyimedic
```

---

## 后端部署

### 方式1: 本地开发环境

```bash
# 进入项目目录
cd zhongyimedic

# 安装Python依赖
pip3 install -r requirements.txt

# 初始化数据库
python3 scripts/seed_data.py

# 启动后端服务
python3 web/app.py
```

后端将在 `http://localhost:8000` 运行。

### 方式2: Docker部署

创建 `Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python3", "web/app.py"]

EXPOSE 8000
```

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - ./sql_app.db:/app/sql_app.db
    environment:
      - PYTHONUNBUFFERED=1
```

启动服务:

```bash
docker-compose up -d
```

### 方式3: 云服务器部署

#### 部署到阿里云/腾讯云/AWS

1. **购买云服务器**
   - 配置: 2核4GB或更高
   - 操作系统: Ubuntu 20.04 LTS

2. **安装环境**

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Python
sudo apt install python3 python3-pip -y

# 安装Git
sudo apt install git -y

# 克隆项目
git clone https://github.com/qhuang2010/zhongyimedic.git
cd zhongyimedic

# 安装依赖
pip3 install -r requirements.txt

# 安装Nginx（反向代理）
sudo apt install nginx -y
```

3. **配置Nginx**

编辑 `/etc/nginx/sites-available/zhongyi_medic`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置:

```bash
sudo ln -s /etc/nginx/sites-available/zhongyi_medic /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **使用systemd管理服务**

创建 `/etc/systemd/system/zhongyi_medic.service`:

```ini
[Unit]
Description=中医脉象后端API服务
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/user/zhongyimedic
ExecStart=/usr/bin/python3 /home/user/zhongyimedic/web/app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务:

```bash
sudo systemctl daemon-reload
sudo systemctl enable zhongyi_medic
sudo systemctl start zhongyi_medic
sudo systemctl status zhongyi_medic
```

5. **配置HTTPS（可选）**

使用Let's Encrypt免费证书:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 移动应用部署

### 构建脚本

项目提供了自动化构建脚本:

```bash
# 使用构建脚本
./build_mobile.sh
```

或手动构建:

```bash
cd mobile_app

# 安装依赖
flutter pub get

# 生成模型代码
flutter pub run build_runner build --delete-conflicting-outputs

# 构建对应平台
flutter build apk          # Android APK
flutter build appbundle     # Android App Bundle
flutter build ios          # iOS
flutter build harmonyos    # HarmonyOS
```

---

## 各平台详细部署步骤

### Android部署

#### 1. 准备工作

```bash
# 安装Android Studio
# 下载地址: https://developer.android.com/studio

# 配置环境变量
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### 2. 配置应用签名

生成签名密钥:

```bash
keytool -genkey -v -keystore ~/zhongyi_medic.keystore -alias zhongyi_medic -keyalg RSA -keysize 2048 -validity 10000
```

配置 `android/key.properties`:

```properties
storePassword=your_password
keyPassword=your_password
keyAlias=zhongyi_medic
storeFile=/home/your_username/zhongyi_medic.keystore
```

#### 3. 构建发布版本

```bash
# APK版本
flutter build apk --release

# App Bundle版本（推荐用于Google Play）
flutter build appbundle --release
```

#### 4. 上架Google Play

1. 创建Google Play开发者账号（$25一次性费用）
2. 在Google Play Console创建应用
3. 上传AAB文件
4. 填写应用信息、截图等
5. 提交审核

#### 5. 分发APK

直接分发APK文件，用户可以下载安装:

```bash
# APK文件位置
mobile_app/build/app/outputs/flutter-apk/app-release.apk
```

---

### iOS部署

#### 1. 前置要求

- macOS系统
- Xcode 14+
- Apple Developer账号（$99/年）

#### 2. 配置签名

```bash
cd mobile_app/ios
pod install
```

在Xcode中:
1. 打开 `ios/Runner.xcworkspace`
2. 选择项目 → Signing & Capabilities
3. 选择Team（你的Apple Developer Team）
4. Bundle Identifier改为唯一标识符

#### 3. 构建应用

```bash
# Release版本
flutter build ios --release

# 在Xcode中打开
open ios/Runner.xcworkspace
```

#### 4. 上架App Store

1. 在App Store Connect创建应用
2. 在Xcode中: Product → Archive
3. 分发App → Upload to App Store
4. 填写应用信息、截图等
5. 提交审核

#### 5. TestFlight测试

1. 在App Store Connect添加测试员
2. 分发到TestFlight
3. 测试员下载测试版

---

### HarmonyOS部署

#### 1. 安装DevEco Studio

```bash
# 下载地址
https://developer.huawei.com/consumer/cn/deveco-studio/

# 选择Mac或Windows版本
# 安装HarmonyOS SDK
```

#### 2. 配置Flutter for HarmonyOS

```bash
# 安装Flutter鸿蒙OS支持
flutter pub global activate flutter_for_harmonyos

# 添加鸿蒙OS到Flutter
export PATH="$PATH":"$HOME/.pub-cache/git/flutter_for_harmonyos-*/bin"

# 验证
flutter doctor
```

#### 3. 配置项目

```bash
# 进入项目目录
cd mobile_app

# 创建鸿蒙OS项目
flutter_for_harmonyos create

# 配置签名
# 在DevEco Studio中配置自动签名
```

#### 4. 构建应用

```bash
# 连接鸿蒙设备或模拟器
flutter devices

# 运行应用
flutter run -d harmonyos

# 构建发布版本
flutter build harmonyos --release
```

#### 5. 上架华为应用市场

1. 注册华为开发者账号
2. 在AppGallery Connect创建应用
3. 上传HAP包
4. 填写应用信息
5. 提交审核

---

## 常见问题

### Flutter相关

**Q: flutter doctor报错**
A: 根据提示安装缺失的依赖，如Android SDK、Xcode等。

**Q: 构建失败，提示依赖冲突**
A: 运行 `flutter clean` 然后重新 `flutter pub get`。

**Q: iOS构建失败**
A: 确保在macOS上，并且Xcode和Command Line Tools已正确安装。

### Android相关

**Q: APK安装失败**
A: 检查是否开启"允许未知来源应用安装"。

**Q: 签名错误**
A: 检查 `key.properties` 配置，确保密码和密钥文件路径正确。

### iOS相关

**Q: Code Signing错误**
A: 在Xcode中重新配置签名，确保Team已选择。

**Q: Provisioning Profile过期**
A: 下载新的Provisioning Profile并安装。

### HarmonyOS相关

**Q: DevEco Studio无法启动**
A: 检查Java版本，DevEco Studio需要JDK 11。

**Q: 鸿蒙OS编译失败**
A: 确保HarmonyOS SDK版本与Flutter插件版本匹配。

### 后端相关

**Q: API连接失败**
A: 检查网络设置，确保后端服务正常运行。

**Q: 数据库错误**
A: 删除 `sql_app.db` 并重新运行 `seed_data.py`。

---

## 性能优化

### 应用优化

1. **减少APK大小**
```bash
# 按架构拆分
flutter build apk --split-per-abi
```

2. **启用混淆**
在 `android/app/build.gradle` 中:
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

3. **优化图片资源**
   - 使用WebP格式
   - 适配不同分辨率

### 后端优化

1. **使用Gunicorn部署**
```bash
pip install gunicorn
gunicorn web.app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

2. **启用缓存**
   - Redis缓存热点数据
   - CDN加速静态资源

---

## 监控与日志

### 应用监控

1. **Firebase Analytics**
2. **华为分析**
3. **自定义埋点**

### 日志收集

1. **Sentry** - 错误监控
2. **Bugly** - 腾讯
3. **友盟** - 数据统计

---

## 安全建议

1. **API安全**
   - 使用HTTPS
   - 实现Token认证
   - 数据加密传输

2. **数据安全**
   - 敏感数据加密存储
   - 定期备份数据
   - 访问权限控制

3. **应用安全**
   - 代码混淆
   - 防止逆向
   - 安全扫描

---

## 联系方式

如有问题，请：
- 提交GitHub Issue
- 发送邮件到: support@example.com
- 加入技术交流群

---

## 许可证

MIT License
