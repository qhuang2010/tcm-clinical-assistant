# 快速开始指南

本指南帮助你在10分钟内运行中医脉象移动应用。

---

## 前置要求检查

在开始之前，请确保已安装以下软件：

### 必需软件

- [ ] **Flutter SDK** (3.0+)
  ```bash
  flutter --version
  ```

- [ ] **Python** (3.9+)
  ```bash
  python3 --version
  ```

- [ ] **Git**
  ```bash
  git --version
  ```

### 可选软件（用于特定平台）

- Android Studio (Android开发）
- Xcode (iOS开发，仅macOS）
- DevEco Studio (鸿蒙OS开发）

---

## 快速启动（5步）

### 步骤1: 克隆项目

```bash
# 克隆仓库
git clone https://github.com/qhuang2010/zhongyimedic.git
cd zhongyimedic
```

### 步骤2: 启动后端

```bash
# 安装Python依赖
pip3 install -r requirements.txt

# 初始化数据库
python3 scripts/seed_data.py

# 启动后端服务（在新终端中运行）
python3 web/app.py
```

后端将在 `http://localhost:8000` 运行。

### 步骤3: 进入移动应用目录

```bash
cd mobile_app
```

### 步骤4: 安装Flutter依赖

```bash
# 安装依赖包
flutter pub get

# 生成模型代码
flutter pub run build_runner build --delete-conflicting-outputs
```

### 步骤5: 运行应用

#### 运行在Android

```bash
# 确保已连接Android设备或启动模拟器
flutter devices  # 查看可用设备

# 运行应用
flutter run
```

#### 运行在iOS（仅macOS）

```bash
# 确保已连接iOS设备或启动模拟器
open -a Simulator

# 运行应用
flutter run
```

#### 运行在鸿蒙OS

```bash
# 确保已安装DevEco Studio和鸿蒙OS SDK
flutter run -d harmonyos
```

---

## 首次配置应用

1. **打开应用**

   应用启动后，会显示三个主要页面：
   - **患者**: 患者管理
   - **脉象**: 脉象录入
   - **设置**: 应用配置

2. **配置API地址**

   - 进入"设置"页面
   - 在"API设置"中输入：
     - 本地开发: `http://localhost:8000`
     - 云服务器: `http://your-server.com:8000`
   - 点击"测试连接"
   - 显示"已连接"表示配置成功

3. **开始使用**

   - 在"患者"页面搜索现有患者或新增患者
   - 点击患者卡片查看详情
   - 填写主诉信息
   - 点击"录入脉象"进入脉象九宫格页面
   - 点击单元格选择脉象
   - 填写整体描述和处方
   - 点击"分析"获取智能诊断建议
   - 点击"保存"存储病历

---

## 测试功能

### 测试患者搜索

1. 进入"患者"页面
2. 在搜索框输入：`李`
3. 应该显示包含"李"的患者列表

### 测试脉象录入

1. 选择一个患者
2. 点击"录入脉象"
3. 点击九宫格中的任一单元格
4. 从脉象列表中选择（如：浮、沉、弦等）
5. 填写整体描述
6. 点击"分析"
7. 查看分析结果
8. 点击"保存"

### 测试API连接

1. 进入"设置"页面
2. 修改API地址
3. 点击"测试连接"
4. 检查连接状态是否显示为绿色对勾

---

## 常见问题快速解决

### 问题1: Flutter命令未找到

**错误信息**: `command not found: flutter`

**解决方案**:
```bash
# 添加Flutter到PATH（临时）
export PATH="$PATH:`pwd`/flutter/bin"

# 永久添加到 ~/.zshrc 或 ~/.bashrc
echo 'export PATH="$PATH:/path/to/flutter/bin"' >> ~/.zshrc
source ~/.zshrc
```

### 问题2: 依赖安装失败

**错误信息**: `Could not resolve packages`

**解决方案**:
```bash
# 清理缓存
flutter clean

# 升级Flutter
flutter upgrade

# 重新安装依赖
flutter pub get
```

### 问题3: 后端连接失败

**错误信息**: `Connection refused`

**解决方案**:
1. 确认后端服务正在运行:
   ```bash
   lsof -i :8000
   ```
2. 如果后端未运行，启动它:
   ```bash
   python3 web/app.py
   ```
3. 检查防火墙设置

### 问题4: iOS构建失败（macOS）

**错误信息**: `Code signing error`

**解决方案**:
1. 打开 `ios/Runner.xcworkspace` 在Xcode中
2. 选择项目 → Signing & Capabilities
3. 选择你的Team
4. 修改Bundle Identifier为唯一值

### 问题5: Android设备未识别

**错误信息**: `No devices found`

**解决方案**:
1. 启用开发者选项（在手机设置中）
2. 开启USB调试
3. 连接手机后授权电脑
4. 运行:
   ```bash
   adb devices
   ```
5. 如果仍然未识别，尝试:
   ```bash
   adb kill-server
   adb start-server
   ```

---

## 下一步

完成快速开始后，你可以：

1. **阅读详细文档**
   - [移动应用README](mobile_app/README.md)
   - [部署指南](DEPLOYMENT_GUIDE.md)
   - [项目转换总结](PROJECT_CONVERSION_SUMMARY.md)

2. **学习源代码**
   - API服务: `lib/services/api_service.dart`
   - 状态管理: `lib/services/patient_provider.dart`
   - 页面组件: `lib/screens/`

3. **构建发布版本**
   ```bash
   # Android APK
   flutter build apk --release

   # Android AAB (Google Play）
   flutter build appbundle --release

   # iOS (App Store）
   flutter build ios --release

   # HarmonyOS (华为应用市场）
   flutter build harmonyos --release
   ```

4. **自定义功能**
   - 修改UI颜色主题
   - 添加新的脉象类型
   - 扩展API接口
   - 增加新的页面

---

## 开发工具推荐

### VS Code插件

- **Flutter**
- **Dart**
- **Flutter Widget Snippets**
- **Pubspec Assist**

### Android工具

- **Android Studio**
- **ADB Idea** (ADB快捷操作）
- **Layout Inspector** (UI调试）

### iOS工具（macOS）

- **Xcode**
- **Simulator** (iOS模拟器）
- **Instruments** (性能分析）

---

## 学习资源

### Flutter官方文档
- https://flutter.dev/docs
- https://api.flutter.dev/

### 视频教程
- Flutter官方YouTube频道
- Flutter实战视频课程

### 社区资源
- Flutter中文网: https://flutter.cn
- Stack Overflow: [flutter]标签
- GitHub: flutter/flutter

---

## 获取帮助

如果遇到问题：

1. **查看文档**
   - 本项目README文件
   - Flutter官方文档

2. **搜索问题**
   - Google搜索
   - Stack Overflow
   - GitHub Issues

3. **提问**
   - 在项目Issues提问
   - 加入Flutter中文社区
   - 联系技术支持

---

## 许可证

MIT License

---

祝你使用愉快！🚀
