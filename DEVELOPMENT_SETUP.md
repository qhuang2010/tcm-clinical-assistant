# 开发环境设置指南

本指南详细说明如何在本地开发环境中设置项目。

---

## 前置要求

### 必需软件

1. **Flutter SDK** (3.13.0+)
   - macOS: `brew install --cask flutter`
   - Windows: 从 https://flutter.dev/docs/get-started/install 下载
   - Linux: 下载并添加到 PATH

2. **Android Studio** (开发Android应用）
   - 下载: https://developer.android.com/studio
   - 需要Java JDK 11+

3. **Xcode** (开发iOS应用，仅macOS）
   - 从App Store安装

4. **DevEco Studio** (开发HarmonyOS应用）
   - 下载: https://developer.huawei.com/consumer/cn/deveco-studio/

5. **Git**
   - macOS/Linux: `brew install git`
   - Windows: 从 https://git-scm.com/download/win 下载

---

## 安装步骤

### 步骤1: 安装Flutter SDK

#### macOS
```bash
# 使用Homebrew安装
brew install --cask flutter

# 验证安装
flutter --version

# 检查依赖
flutter doctor
```

#### Windows
```powershell
# 下载Flutter SDK
# https://flutter.dev/docs/get-started/install/windows

# 添加到PATH
# [系统属性] -> [环境变量] -> [Path] -> [编辑]

# 验证安装
flutter --version
```

#### Linux
```bash
# 下载并解压
cd ~/development
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"

# 验证安装
flutter --version
```

### 步骤2: 配置Android开发环境

```bash
# 同意Android许可证
flutter doctor --android-licenses

# 按y同意所有许可证
```

### 步骤3: 配置iOS开发环境（仅macOS）

```bash
# 安装Xcode命令行工具
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license

# 安装CocoaPods
sudo gem install cocoapods

# 验证
flutter doctor -v
```

### 步骤4: 安装DevEco Studio（鸿蒙OS）

```bash
# 下载并安装DevEco Studio
# https://developer.huawei.com/consumer/cn/deveco-studio/

# 配置HarmonyOS SDK
# 在DevEco Studio中: Preferences -> SDK
```

### 步骤5: 克隆项目

```bash
# 克隆仓库
git clone https://github.com/qhuang2010/zhongyimedic.git
cd zhongyimedic

# 进入移动应用目录
cd mobile_app
```

### 步骤6: 安装Flutter依赖

```bash
# 安装依赖包
flutter pub get

# 验证安装
flutter doctor
```

### 步骤7: 生成代码

```bash
# 生成JSON序列化代码
flutter pub run build_runner build --delete-conflicting-outputs

# 这将生成 patient.g.dart 文件
```

---

## 验证安装

运行 `flutter doctor` 确保所有依赖已正确安装：

```bash
flutter doctor
```

期望输出：
```
Flutter x.x.x • channel stable • https://github.com/flutter/flutter.git
Framework • revision xxxxxxx (x days ago) • 2024-xx-xx xx:xx
Engine • revision xxxxxxx
Tools • Dart x.x.x • DevTools x.x.x

Android toolchain - develop for Android devices (Android SDK version 33.0.0)
Android Studio at /Applications/Android Studio.app/Contents
Flutter plugin not installed
Java binary at: /Library/Java/JavaVirtualMachines/.../Contents/Home/bin/java

iOS toolchain - develop for iOS devices (Xcode 14.2, iOS 16.2)
Xcode at /Applications/Xcode.app/Contents/Developer
CocoaPods version 1.12.1
```

---

## 常见问题

### Q1: Flutter命令未找到

**错误**: `command not found: flutter`

**解决方案**:
```bash
# macOS/Linux
export PATH="$PATH:/path/to/flutter/bin"

# 永久添加到 ~/.zshrc 或 ~/.bashrc
echo 'export PATH="$PATH:/path/to/flutter/bin"' >> ~/.zshrc
source ~/.zshrc
```

### Q2: Android设备未识别

**错误**: `No devices found`

**解决方案**:
1. 在手机上启用开发者选项
   - 设置 → 关于手机 → 连续点击"版本号"7次
   - 开发者选项 → 启用USB调试

2. 授权电脑访问
   - 连接手机后，在手机上授权

3. 安装设备驱动（Windows）

### Q3: iOS模拟器无法启动

**错误**: `Unable to boot the iOS Simulator`

**解决方案**:
```bash
# 重置模拟器
xcrun simctl erase all

# 重新启动模拟器
open -a Simulator
```

### Q4: 依赖安装失败

**错误**: `Could not resolve packages`

**解决方案**:
```bash
# 清理缓存
flutter clean

# 升级Flutter
flutter upgrade

# 使用国内镜像（如果在中国）
export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
```

### Q5: build_runner失败

**错误**: `build_runner` 执行失败

**解决方案**:
```bash
# 清理并重新生成
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## 开发工具推荐

### VS Code (推荐）
```bash
# 安装VS Code
# https://code.visualstudio.com/

# 推荐插件
code --install-extension Dart-Code.dart-code
code --install-extension Dart-Code.flutter
code --install-extension eamodio.gitlens
code --install-extension dbaeumer.vscode-eslint
```

### Android Studio
- 适合开发Android
- 内置布局编辑器
- 性能分析工具

### IntelliJ IDEA
- 支持Flutter
- 强大的代码分析
- 适合大型项目

---

## 快速开始

### 启动后端

```bash
# 在项目根目录
cd zhongyimedic

# 安装Python依赖
pip3 install -r requirements.txt

# 初始化数据库
python3 scripts/seed_data.py

# 启动后端服务
python3 web/app.py
```

后端将运行在 `http://localhost:8000`

### 启动移动应用

```bash
# 进入移动应用目录
cd mobile_app

# 检查设备
flutter devices

# 运行应用
flutter run

# 指定设备运行
flutter run -d <device_id>
```

---

## 热重载和热重启

### 热重载 (Hot Reload)
```bash
# 在终端运行时按 'r'
# 或在VS Code中按 Ctrl+S
```

### 热重启 (Hot Restart)
```bash
# 在终端运行时按 'R'
```

### 完全重启
```bash
# 在终端运行时按 'R' 然后按 Enter
# 或运行
flutter run
```

---

## 调试

### VS Code调试

1. 设置断点
2. 按F5启动调试
3. 选择调试配置（Flutter/Chrome）
4. 查看变量和调用堆栈

### Android Studio调试

1. 设置断点
2. 点击Debug按钮
3. 查看Debug面板

### 日志输出

```bash
# 查看详细日志
flutter run --verbose

# 查看特定日志
flutter logs
```

---

## 性能分析

### Flutter DevTools

```bash
# 启动DevTools
flutter pub global activate devtools
flutter pub global run devtools

# 在浏览器中访问
# http://localhost:9100
```

### 性能分析

```bash
# 运行性能分析
flutter run --profile

# 打开DevTools
flutter pub global run devtools
```

---

## 代码格式化

```bash
# 格式化代码
dart format .

# 检查格式
dart format --set-exit-if-changed .
```

---

## 静态分析

```bash
# 分析代码
flutter analyze

# 自动修复问题
dart fix --apply
```

---

## 测试

### 单元测试

```bash
# 运行所有测试
flutter test

# 运行特定测试文件
flutter test test/unit_test.dart

# 运行特定测试
flutter test --name "Patient should serialize"
```

### Widget测试

```bash
# 运行Widget测试
flutter test test/widget_test.dart

# 生成覆盖率报告
flutter test --coverage
```

### 集成测试

```bash
# 运行集成测试
flutter drive --target=test_driver/app.dart
```

---

## 构建发布版本

### Android

```bash
# 构建APK
flutter build apk --release

# 构建App Bundle (Google Play）
flutter build appbundle --release

# 输出位置
# build/app/outputs/flutter-apk/app-release.apk
# build/app/outputs/bundle/release/app-release.aab
```

### iOS

```bash
# 构建iOS
flutter build ios --release

# 在Xcode中打开
open ios/Runner.xcworkspace

# Archive并导出IPA
# Product -> Archive -> Distribute App
```

### HarmonyOS

```bash
# 构建鸿蒙OS
flutter build harmonyos --release

# 在DevEco Studio中打开并打包
```

---

## 部署到生产环境

### 后端部署

详见 `DEPLOYMENT_GUIDE.md` 中的后端部署章节。

### 移动应用部署

1. **Google Play (Android）**
   - 创建开发者账号 ($25)
   - 在Play Console创建应用
   - 上传AAB文件
   - 填写应用信息
   - 提交审核

2. **App Store (iOS）**
   - 注册Apple开发者账号 ($99/年）
   - 在App Store Connect创建应用
   - Archive应用
   - 上传并提交审核

3. **华为应用市场 (HarmonyOS）**
   - 注册华为开发者账号
   - 在AppGallery Connect创建应用
   - 上传HAP包
   - 填写应用信息
   - 提交审核

---

## 团队协作

### Git工作流

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 提交更改
git add .
git commit -m "feat: add new feature"

# 推送到远程
git push origin feature/new-feature

# 创建Pull Request
# 在GitHub上创建PR
```

### 代码审查

- 使用GitHub Pull Request
- 要求至少一人审查
- 通过所有测试
- 通过CI/CD检查

---

## 持续集成/持续部署 (CI/CD)

项目已配置GitHub Actions，将在以下情况自动运行：

- **Push到main/develop分支**: 运行测试和构建
- **Pull Request**: 运行测试和代码分析
- **Release**: 构建所有平台的发布版本

---

## 获取帮助

### 文档
- 快速开始: `QUICK_START.md`
- 部署指南: `DEPLOYMENT_GUIDE.md`
- API文档: `API_DOCUMENTATION.md`

### 社区
- Flutter中文网: https://flutter.cn
- Stack Overflow: [flutter]标签
- GitHub Issues: 项目Issues

---

祝你开发愉快！🚀
