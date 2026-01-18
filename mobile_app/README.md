# 中医脉象九宫格移动应用

基于Flutter开发的跨平台移动应用，支持Android、iOS和鸿蒙OS。

## 项目结构

```
lib/
├── main.dart                    # 应用入口
├── models/
│   └── patient.dart           # 数据模型
├── services/
│   ├── api_service.dart       # API服务
│   └── patient_provider.dart  # 状态管理
├── screens/
│   ├── home_screen.dart       # 主页
│   ├── patient_list_screen.dart  # 患者列表
│   ├── patient_detail_screen.dart  # 患者详情
│   ├── pulse_input_screen.dart   # 脉象录入
│   └── settings_screen.dart      # 设置
├── utils/
│   └── common_utils.dart     # 工具函数
└── widgets/
    └── common_widgets.dart    # UI组件
```

## 快速开始

### 安装Flutter

```bash
# macOS
brew install --cask flutter

# 验证安装
flutter doctor
```

### 安装依赖

```bash
cd mobile_app
flutter pub get
```

### 运行应用

```bash
flutter run
```

### 构建发布版本

```bash
# Android
flutter build apk --release

# iOS
flutter build ios --release

# HarmonyOS
flutter build harmonyos --release
```

## 功能特性

- 患者管理
- 脉象九宫格录入
- 智能分析
- 病历管理
- 设置功能

## 支持平台

- Android 10+
- iOS 14+
- HarmonyOS 3.0+
