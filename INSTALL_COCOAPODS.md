# ⚠️ 需要手动安装CocoaPods

## 问题

CocoaPods的安装需要管理员权限（sudo），这需要您在终端中手动输入密码。

## 🔧 解决方案

请在终端中运行以下命令：

### 方法1: 使用Ruby gem安装（推荐）

```bash
# 1. 安装CocoaPods
sudo gem install cocoapods

# 2. 设置CocoaPods（首次需要）
pod setup

# 3. 验证安装
pod --version
```

### 方法2: 使用Homebrew安装

```bash
# 1. 如果尚未安装Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安装CocoaPods
brew install cocoapods

# 3. 验证安装
pod --version
```

---

## 📋 安装后继续

安装CocoaPods后，请继续以下步骤：

### 1. 安装iOS项目依赖

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios
pod install
```

### 2. 打开Xcode

```bash
open /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios/Runner.xcworkspace
```

### 3. 启动模拟器

```bash
open -a Simulator
```

### 4. 运行应用

- 在Xcode中选择设备
- 点击 ▶️ 按钮
- 或运行: `flutter run`

---

## 📊 当前状态

### ✅ 已完成
- Flutter SDK已安装
- Xcode已安装
- iOS项目已配置
- macOS项目已配置
- 后端服务正在运行
- Xcode项目已打开

### ⚠️ 待完成
- **CocoaPods**: 需要手动安装
- iOS模拟器: 需要启动

---

## 🎯 一键完成所有步骤

在安装CocoaPods后，运行：

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios
pod install
cd ..
open -a Simulator
flutter run
```

---

## 📚 详细文档

- `XCODE_SETUP_GUIDE.md` - 完整设置指南
- `XCODE_QUICKSTART.md` - 快速开始
- `XCODE_STATUS.md` - 当前状态

---

## 🚀 现在开始

在终端中运行：

```bash
sudo gem install cocoapods
pod setup
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios
pod install
```

然后：
```bash
open /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios/Runner.xcworkspace
```

在Xcode中点击 ▶️ 运行应用！
