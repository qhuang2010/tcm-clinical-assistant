# 📱 在Xcode中运行Flutter项目 - 完整指南

## ✅ 当前状态

### 已完成
- ✅ Flutter项目已创建
- ✅ iOS项目已配置（Runner.xcworkspace）
- ✅ macOS项目已配置（Runner.xcworkspace）
- ✅ Xcode已安装（版本26.2）
- ✅ Xcode项目已打开

### 需要完成的步骤
- ⚠️ 安装CocoaPods
- ⚠️ 安装iOS模拟器或连接真机
- ⚠️ 在Xcode中构建和运行

---

## 📋 安装CocoaPods

CocoaPods是iOS/macOS开发必需的依赖管理工具。

### 方法1: 使用Homebrew安装（推荐）

```bash
# 1. 如果尚未安装Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安装CocoaPods
brew install cocoapods

# 3. 验证安装
pod --version
```

### 方法2: 使用Ruby gem安装

```bash
# 1. 更新Ruby gems
sudo gem update --system

# 2. 安装CocoaPods
sudo gem install cocoapods

# 3. 设置CocoaPods
pod setup

# 4. 验证安装
pod --version
```

### 方法3: 下载并安装（当前已下载）

CocoaPods 1.15.2已经下载到 `/tmp/CocoaPods-1.15.2/`

```bash
# 安装（需要密码）
cd /tmp/CocoaPods-1.15.2
sudo gem install cocoapods-1.15.2.gem

# 设置CocoaPods
pod setup

# 验证安装
pod --version
```

---

## 🔧 配置iOS项目

### 1. 安装CocoaPods依赖

安装CocoaPods后，进入项目目录：

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app

# 进入iOS目录
cd ios

# 安装依赖
pod install

# 应该看到：
# Pod installation complete! ...
```

### 2. 验证项目配置

```bash
# 检查Pods目录是否存在
ls -la Pods/

# 检查workspace文件
ls -la Runner.xcworkspace
```

---

## 📲 安装或配置iOS模拟器

### 选项A: 使用Xcode创建模拟器（推荐）

1. 打开Xcode（应该已经打开）
2. 菜单栏: `Xcode` -> `Open Developer Tool` -> `Simulator`
3. 或按快捷键: `⌘ + ⇧ + 2`
4. 点击左下角的 `+` 按钮添加新模拟器
5. 选择设备类型（推荐iPhone 15或iPhone 14）
6. 点击"Create"

### 选项B: 使用命令行创建

```bash
# 查看可用的运行时
xcrun simctl list runtimes

# 创建iPhone 15模拟器
xcrun simctl create "iPhone 15" "iPhone 15" "com.apple.CoreSimulator.SimRuntime.iOS-17-0"

# 启动模拟器
open -a Simulator
```

### 选项C: 使用真机

1. 连接iPhone到Mac
2. 在iPhone上: `设置` -> `通用` -> `VPN与设备管理` -> `信任此电脑`
3. Mac上: `Xcode` -> `Window` -> `Devices and Simulators`
4. 应该看到你的iPhone设备

---

## 🚀 在Xcode中运行项目

### 方法1: 使用Xcode界面

1. **打开项目**
   - 如果Xcode未打开，运行：
     ```bash
     open /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios/Runner.xcworkspace
     ```

2. **选择目标设备**
   - 点击Xcode顶部工具栏的设备选择器
   - 选择模拟器或真机

3. **选择运行模式**
   - 点击Scheme选择器（项目名称旁边）
   - 选择 `Runner > Runner (Debug)`

4. **构建和运行**
   - 点击左上角的 ▶️ 按钮（Run）
   - 或按 `⌘ + R`

### 方法2: 使用命令行

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app

# 列出可用设备
flutter devices

# 在模拟器上运行
flutter run -d <device_id>

# 例如：
# flutter run -d iPhone 15
```

---

## 📊 项目文件结构

```
zhongyimedic/mobile_app/
├── ios/                        ← iOS项目
│   ├── Runner.xcworkspace      ← Xcode workspace（用这个打开）
│   ├── Runner.xcodeproj       ← Xcode project
│   ├── Pods/                  ← CocoaPods依赖
│   ├── Podfile                ← CocoaPods配置
│   └── Runner/               ← iOS应用代码
│       ├── AppDelegate.swift
│       ├── Info.plist
│       └── ...
├── macos/                     ← macOS项目
│   └── Runner.xcworkspace    ← macOS Xcode workspace
└── lib/                       ← Flutter代码（共享）
    ├── main.dart
    ├── screens/
    ├── models/
    └── ...
```

---

## 🎯 构建类型

### Debug模式（开发用）
- 包含调试信息
- 快速构建
- 支持热重载

```bash
# 命令行
flutter run -d <device_id>

# Xcode: 选择 Debug scheme
```

### Release模式（发布用）
- 优化代码
- 较小文件大小
- 更快性能

```bash
# 命令行
flutter run --release -d <device_id>

# Xcode: 选择 Release scheme
```

---

## 🔍 常见问题

### 问题1: CocoaPods未安装

**错误**: `CocoaPods not installed`

**解决方案**:
```bash
# 使用Homebrew
brew install cocoapods

# 或使用Ruby gem
sudo gem install cocoapods
```

### 问题2: pod install失败

**错误**: `pod install` 命令失败

**解决方案**:
```bash
# 清理缓存
pod cache clean --all

# 重新安装
cd ios
pod deintegrate
pod install

# 如果仍然失败，更新CocoaPods
pod repo update
```

### 问题3: 没有可用的模拟器

**错误**: `No iOS simulators available`

**解决方案**:
1. 打开Xcode
2. `Xcode` -> `Open Developer Tool` -> `Simulator`
3. 点击 `+` 添加新模拟器

### 问题4: 构建失败 - 签名问题

**错误**: Code signing error

**解决方案**:
1. Xcode: `Runner` target -> `Signing & Capabilities`
2. 选择你的Apple ID
3. 或禁用签名（仅用于开发）
   - 取消勾选 `Automatically manage signing`

### 问题5: 应用在模拟器中无法连接到后端

**错误**: 网络请求失败

**解决方案**:
- 使用 `http://localhost:8000`（模拟器）
- 或使用Mac的IP地址: `http://<mac-ip>:8000`

---

## 📝 快速参考命令

```bash
# 检查设备
flutter devices

# 列出模拟器
flutter emulators

# 启动模拟器
open -a Simulator

# 安装依赖
cd ios && pod install

# 运行应用
flutter run

# 在特定设备上运行
flutter run -d <device_id>

# 构建Release版本
flutter build ios --release

# 在Xcode中打开
open ios/Runner.xcworkspace
```

---

## 🎨 Xcode项目配置

### 修改应用图标

1. 打开 `Runner.xcworkspace`
2. 导航到 `Runner/Assets.xcassets/AppIcon.appiconset`
3. 替换图标文件（需要多个尺寸）

### 修改应用名称

1. 打开 `Runner.xcworkspace`
2. `Runner/Info.plist`
3. 修改 `CFBundleName` 或 `CFBundleDisplayName`

### 添加权限

1. `Runner/Info.plist`
2. 添加需要的权限：
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>需要访问相机进行OCR识别</string>
   <key>NSPhotoLibraryUsageDescription</key>
   <string>需要访问相册选择图片</string>
   ```

---

## 🔗 重要链接

- Xcode文档: https://developer.apple.com/xcode/
- CocoaPods指南: https://guides.cocoapods.org/
- iOS模拟器: https://help.apple.com/simulator/mac/
- Flutter iOS: https://flutter.dev/docs/development/ios

---

## ✅ 检查清单

在运行应用前，确保：

- [ ] CocoaPods已安装
- [ ] 运行了 `pod install`
- [ ] 有可用的iOS模拟器或真机
- [ ] 后端服务正在运行（`http://localhost:8000`）
- [ ] 在Xcode中打开了 `Runner.xcworkspace`（不是 `.xcodeproj`）
- [ ] 选择了正确的目标设备
- [ ] 网络连接正常

---

## 🚀 下一步

1. **安装CocoaPods**
   ```bash
   brew install cocoapods
   ```

2. **安装依赖**
   ```bash
   cd ios && pod install
   ```

3. **打开Xcode**
   ```bash
   open ios/Runner.xcworkspace
   ```

4. **启动模拟器**
   ```bash
   open -a Simulator
   ```

5. **运行应用**
   - 在Xcode中点击 ▶️
   - 或 `flutter run`

**祝开发顺利！** 🎉
