# 🚀 快速开始 - 中医脉象移动应用

## 📋 目录

1. [环境准备](#环境准备)
2. [安装依赖](#安装依赖)
3. [运行应用](#运行应用)
4. [开发指南](#开发指南)

---

## 环境准备

### 检查Flutter安装

```bash
# 检查Flutter是否安装
flutter --version

# 如果未安装，请安装Flutter：
# macOS
brew install --cask flutter

# 验证安装
flutter doctor
```

### 检查项目文件

```bash
# 进入项目目录
cd mobile_app

# 检查项目结构
ls -la

# 检查必需的文件是否存在
find lib -name "*.dart" | head -10
```

**必需的文件：**
- ✅ lib/main.dart
- ✅ lib/models/patient.dart
- ✅ lib/models/patient.g.dart
- ✅ lib/services/api_service.dart
- ✅ lib/services/patient_provider.dart
- ✅ lib/screens/home_screen.dart
- ✅ lib/screens/patient_list_screen.dart
 ✅ lib/screens/patient_detail_screen.dart
- ✅ lib/screens/pulse_input_screen.dart
- ✅ lib/screens/settings_screen.dart
- ✅ lib/utils/common_utils.dart
- ✅ lib/widgets/common_widgets.dart
- ✅ pubspec.yaml

---

## 安装依赖

### 步骤1: 进入项目目录

```bash
cd mobile_app
```

### 步骤2: 安装Flutter依赖

```bash
# 安装依赖包
flutter pub get

# 清理缓存（如果需要）
flutter clean

# 重新安装
flutter pub get
```

### 步骤3: 生成代码

```bash
# 生成JSON序列化代码
flutter pub run build_runner build --delete-conflicting-outputs
```

### 步骤4: 验证安装

```bash
# 验证Flutter环境
flutter doctor

# 分析代码
flutter analyze

# 格式化代码
dart format .

# 运行测试
flutter test
```

---

## 运行应用

### 方式1: 在浏览器中运行（Web）

```bash
# 启动Web应用
flutter run -d chrome

# 或在默认浏览器中运行
flutter run
```

### 方式2: 在设备上运行

```bash
# 列出可用设备
flutter devices

# 在特定设备上运行
flutter run -d <device_id>

# 运行到Android设备
flutter run -d android

# 运行到iOS设备
flutter run -d ios

# 运行到HarmonyOS设备
flutter run -d harmonyos
```

### 方式3: 构建并运行

```bash
# 构建debug版本
flutter build apk --debug

# 构建release版本
flutter build apk --release

# 运行构建的APK
flutter install --release
```

---

## 开发指南

### 热重载开发

```bash
# 按 'r' 热重载
# 或在VS Code中按 Ctrl+S
# 或在终端中按 'R' 热重启
```

### 调试应用

#### 在VS Code中调试

1. 设置断点
2. 按 F5 启动调试
3. 在Debug面板查看变量
4. 使用Flutter DevTools

#### 命令行调试

```bash
# 查看日志
flutter logs

# 查看详细信息
flutter logs -v
```

### 查看平台信息

```bash
# 查看设备信息
flutter devices -v

# 查看Flutter版本
flutter --version
```

---

## 📱 功能概览

### 患者管理
- 搜索患者（姓名/拼音/电话）
- 按日期筛选患者
- 查看患者详情
- 新增患者

### 脉象九宫格录入
- 左右手九宫格输入
- 15种脉象类型
- 整体描述
- 处方输入
- 智能分析（AI诊断建议）
- 保存病历

### 设置功能
- API地址配置
- 连接测试
- 应用信息查看
- 设备信息显示

---

## 📊 项目结构

```
mobile_app/
├── lib/
│   ├── main.dart                    # 应用入口
│   ├── models/
│   │   ├── patient.dart           # 数据模型
│   │   └── patient.g.dart        # 生成的代码
│   ├── services/
│   │   ├── api_service.dart       # API服务
│   │   └── patient_provider.dart  # 状态管理
│   ├── screens/
│   │   ├── home_screen.dart       # 主页（包含3个底部导航页面）
│   │   ├── patient_list_screen.dart  # 患者列表
│   │   ├── patient_detail_screen.dart  # 患者详情
│   │   ├── pulse_input_screen.dart   # 脉象录入
│   │   └── settings_screen.dart      # 设置
│   ├── utils/
│   │   └── common_utils.dart       # 工具函数
│   └── widgets/
│       └── common_widgets.dart    # 可重用组件
├── android/                       # Android配置
├── ios/                          # iOS配置
├── harmonyos/                     # 鸿蒙OS配置
├── test/                         # 测试代码
├── assets/                       # 资源目录
├── pubspec.yaml                   # 依赖配置
└── README.md                     # 移动端文档
```

---

## 🔧 常用命令

### 项目验证

```bash
# 检查Flutter环境
flutter doctor

# 验证项目
flutter analyze

# 运行测试
flutter test

# 代码格式化
dart format .

# 清理构建
flutter clean
```

### 构建命令

```bash
# Debug构建
flutter build apk --debug

# Release构建
flutter build apk --release

# 构建App Bundle（Google Play）
flutter build appbundle --release

# iOS构建
flutter build ios --release

# HarmonyOS构建
flutter build harmonyos --release
```

### 运行命令

```bash
# 运行应用
flutter run

# 指定设备运行
flutter run -d <device_id>

# 指定平台运行
flutter run -d android
flutter run -d ios
flutter run -d harmonyos

# Web运行
flutter run -d chrome
```

---

## 🐛 常见问题

### Flutter环境问题

**问题**: Flutter命令未找到

**解决方案**:
```bash
# macOS/Linux
export PATH="$PATH:/path/to/flutter/bin"

# macOS使用Homebrew
brew install --cask flutter
```

**问题**: Android设备未识别

**解决方案**:
```bash
# 在手机上启用开发者选项
# 设置 → 关于手机 → 连续点击"版本号"7次
# 开发者选项 → 启用USB调试

# 信任计算机
# 手机连接后，在手机上授权
```

**问题**: iOS构建失败

**解决方案**:
```bash
# 清理DerivedData
rm -rf ios/Runner/DerivedData

# 重新构建
flutter clean
flutter build ios --release
```

### 依赖问题

**问题**: 依赖安装失败

**解决方案**:
```bash
# 清理缓存
flutter clean

# 升级Flutter
flutter upgrade

# 删除lock文件
rm pubspec.lock
flutter pub get

# 使用国内镜像（如果在中国）
export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
```

---

## 📖 相关文档

- **DEVELOPMENT_SETUP.md** - 详细开发环境设置
- **API_DOCUMENTATION.md** - API接口文档
- **mobile_app/README.md** - 移动端文档
- **DEPLOYMENT_GUIDE.md** - 部署指南

---

## 🚀 开发技巧

### 1. 热重载开发

```bash
# 在终端运行时按 'r'
# 或在VS Code按 Ctrl+S
```

### 2. 热重启应用

```bash
# 在终端运行时按 'R'
# 或在VS Code按 Ctrl+Shift+F5
```

### 3. 查看日志

```bash
# 查看详细日志
flutter logs -v

# 查看平台信息
flutter devices
```

### 4. 性能分析

```bash
# 启动DevTools
flutter pub global activate devtools
flutter pub global run devtools

# 运行性能分析
flutter run --profile
```

---

## 📱 支持和帮助

### 文档
- Flutter中文网: https://flutter.cn
- Stack Overflow: [flutter]标签
- GitHub Issues: 项目Issues

### 社区
- Flutter中文网
- Flutter中文开发者社区
- Flutter开发者社区

---

## ✅ 检查清单

在开始开发前，请确认：

- [ ] Flutter SDK已安装
- [ ] 可以运行 `flutter --version`
- [ ] `flutter doctor` 没有严重错误
- [ ] 已切换到mobile_app目录
- [ ] 所有必需文件都存在
- [ ] 已运行 `flutter pub get`
- - [] 已运行 `flutter pub run build_runner build`

---

## 🎯 开始你的开发之旅！

```bash
# 1. 进入项目
cd mobile_app

# 2. 安装依赖
flutter pub get

# 3. 生成代码
flutter pub run build_runner build --delete-conflicting-outputs

# 4. 运行应用
flutter run
```

祝你开发愉快！🚀
