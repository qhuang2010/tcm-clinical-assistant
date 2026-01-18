# 🚀 在Xcode中运行项目 - 快速开始

## 📋 当前状态

### ✅ 已完成
- Flutter SDK: ✅ 已安装 (3.38.7)
- iOS项目: ✅ 已配置
- macOS项目: ✅ 已配置
- Xcode: ✅ 已安装 (26.2)
- 项目文件: ✅ 已打开
- 安装脚本: ✅ 已创建

### ⚠️ 需要完成
- CocoaPods: ⚠️ 需要安装
- iOS模拟器: ⚠️ 需要创建或启动

---

## 🔥 快速开始（3步）

### 步骤1: 运行设置脚本

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app
./setup_xcode.sh
```

脚本会自动：
- ✅ 检查并安装CocoaPods
- ✅ 安装iOS项目依赖
- ✅ 创建/检查iOS模拟器
- ✅ 启动后端服务
- ✅ 打开Xcode项目
- ✅ 启动iOS模拟器

### 步骤2: 在Xcode中运行

1. **选择设备**
   - 点击Xcode顶部工具栏的设备选择器
   - 选择模拟器（如iPhone 15）

2. **构建和运行**
   - 点击左上角的 ▶️ 按钮
   - 或按 `⌘ + R`

### 步骤3: 使用应用

应用将在iOS模拟器中启动！

---

## 🛠️ 手动设置（如果脚本不可用）

### 1. 安装CocoaPods

**选项A: Homebrew（推荐）**
```bash
brew install cocoapods
```

**选项B: Ruby gem**
```bash
sudo gem install cocoapods
```

### 2. 安装依赖

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios
pod install
```

### 3. 打开Xcode

```bash
open /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios/Runner.xcworkspace
```

### 4. 启动模拟器

```bash
open -a Simulator
```

### 5. 运行应用

- 在Xcode中点击 ▶️
- 或运行: `flutter run`

---

## 📊 项目信息

### 项目位置
```
/Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/
```

### Xcode项目
```
iOS:  ios/Runner.xcworkspace
macOS: macos/Runner.xcworkspace
```

### 后端API
```
地址: http://localhost:8000
文档: http://localhost:8000/docs
```

---

## 🎯 应用功能

### 5个核心页面
1. **患者列表** - 搜索和管理患者
2. **脉象录入** - 九宫格脉象输入（核心功能）
3. **患者详情** - 查看和编辑患者信息
4. **主页** - 导航和连接状态
5. **设置** - API配置和设置

### 核心特性
- ✅ 搜索患者（姓名/电话/拼音）
- ✅ 九宫格脉象录入
- ✅ AI智能分析
- ✅ 处方管理
- ✅ 后端API集成

---

## 🔧 常用命令

```bash
# 运行设置脚本
./setup_xcode.sh

# 查看可用设备
flutter devices

# 列出模拟器
flutter emulators

# 在特定设备上运行
flutter run -d <device_id>

# 构建Release版本
flutter build ios --release

# 查看日志
tail -f /tmp/backend.log

# 停止后端
lsof -ti:8000 | xargs kill -9
```

---

## 🐛 故障排除

### CocoaPods相关

**问题**: `CocoaPods not installed`
```bash
# 解决方案
brew install cocoapods
# 或
sudo gem install cocoapods
```

**问题**: `pod install` 失败
```bash
cd ios
pod deintegrate
pod install
# 或
pod repo update && pod install
```

### 模拟器相关

**问题**: 没有可用的模拟器
```bash
# 打开模拟器应用
open -a Simulator

# 在Xcode中创建模拟器
# Xcode -> Open Developer Tool -> Simulator -> 点击 +
```

### 构建相关

**问题**: 代码签名错误
```bash
# Xcode: Runner target -> Signing & Capabilities
# 选择你的Apple ID或禁用自动签名
```

**问题**: 网络请求失败
```bash
# 确保后端正在运行
curl http://localhost:8000/docs

# 重启后端
cd /Users/huangm5/Desktop/opencode/zhongyimedic
python3 web/app.py
```

---

## 📚 文档

- **XCODE_SETUP_GUIDE.md** - 详细的Xcode设置指南
- **START_DEVELOPMENT.md** - 开发开始指南
- **QUICK_START.md** - 快速开始指南
- **API_DOCUMENTATION.md** - API接口文档

---

## ✅ 检查清单

运行前确保：

- [ ] ✅ Flutter SDK已安装
- [ ] ⚠️ CocoaPods已安装
- [ ] ⚠️ 运行了 `pod install`
- [ ] ⚠️ 有可用的iOS模拟器或真机
- [ ] ✅ 后端服务正在运行
- [ ] ✅ 在Xcode中打开了 `Runner.xcworkspace`
- [ ] ⚠️ 选择了目标设备

---

## 🚀 立即开始

```bash
# 1. 进入项目目录
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app

# 2. 运行自动设置脚本
./setup_xcode.sh

# 3. 等待脚本完成
# 脚本会自动完成所有设置

# 4. 在Xcode中点击 ▶️ 运行应用
```

---

## 💡 提示

- **使用 Runner.xcworkspace** 而不是 Runner.xcodeproj
- **首次构建**可能需要较长时间（下载依赖）
- **热重载**: 在应用运行时按 `r` 快速更新
- **热重启**: 按 `R` 完全重启应用
- **退出**: 按 `q` 退出

---

## 🎉 开始使用！

准备好了吗？运行：

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app
./setup_xcode.sh
```

然后：
1. 在Xcode中选择设备
2. 点击 ▶️ 运行
3. 在模拟器中测试应用

**祝你开发愉快！** 🚀
