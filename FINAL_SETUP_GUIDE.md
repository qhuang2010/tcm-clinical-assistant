# 🚀 完整的Xcode设置指南

## ⚠️ 重要提示

由于安装CocoaPods需要管理员权限（sudo），请**打开终端**并手动运行以下命令。

---

## 📋 第一步：安装CocoaPods

### 在终端中运行：

```bash
sudo gem install cocoapods
```

**等待安装完成**（1-3分钟）

---

## 📋 第二步：设置CocoaPods

首次安装后，运行：

```bash
pod setup
```

**等待设置完成**（2-5分钟，首次需要下载仓库）

---

## 📋 第三步：验证安装

```bash
pod --version
```

**成功标志**：显示版本号（如 1.15.2）

---

## 📋 第四步：安装iOS项目依赖

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios
pod install
```

**等待依赖安装完成**（3-5分钟）

**成功标志**：显示 "Pod installation complete!"

---

## 📋 第五步：打开Xcode

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app
open ios/Runner.xcworkspace
```

---

## 📋 第六步：运行应用

### 方法A: 在Xcode中运行

1. **选择设备**
   - 点击Xcode顶部工具栏的设备选择器
   - 选择模拟器（如iPhone 17 Pro）

2. **运行应用**
   - 点击左上角的 ▶️ 按钮
   - 或按快捷键 ⌘ + R

3. **等待构建**
   - 首次构建可能需要5-10分钟
   - 应用会在模拟器中启动

### 方法B: 使用命令行运行

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app
flutter run -d <device_id>
```

查看可用设备：
```bash
flutter devices
```

---

## ✅ 一键复制粘贴

复制以下所有命令到终端：

```bash
# 安装CocoaPods
sudo gem install cocoapods

# 设置CocoaPods
pod setup

# 验证安装
pod --version

# 安装iOS依赖
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios
pod install

# 返回项目根目录
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app

# 打开Xcode
open ios/Runner.xcworkspace
```

**然后在Xcode中点击 ▶️ 运行应用！**

---

## 🎯 验证清单

完成以下检查确保设置成功：

- [ ] `pod --version` 显示版本号
- [ ] `pod install` 显示 "Pod installation complete!"
- [ ] Xcode成功打开 `Runner.xcworkspace`
- [ ] 在Xcode中可以看到iOS设备
- [ ] 点击 ▶️ 后应用开始构建
- [ ] 应用在模拟器中成功启动
- [ ] 应用可以连接到后端API

---

## 📊 当前环境状态

### ✅ 已就绪
- Flutter SDK: 3.38.7
- Xcode: 26.2
- iOS项目: 已配置
- macOS项目: 已配置
- 后端服务: 运行中 (http://localhost:8000)
- iOS模拟器: 已启动

### ⚠️ 需要配置
- CocoaPods: 需要手动安装
- iOS依赖: 需要运行 `pod install`

---

## 🐛 常见问题

### 问题1: gem安装失败

**错误**: `ERROR: Failed to build gem native extension`

**解决方案**:
```bash
# 安装Xcode命令行工具
xcode-select --install

# 重新安装CocoaPods
sudo gem install cocoapods
```

### 问题2: pod setup卡住

**症状**: 长时间无响应

**解决方案**:
```bash
# 取消当前操作（Ctrl+C）
# 更新Ruby gems
sudo gem update --system

# 重新设置
pod setup
```

### 问题3: pod install失败

**错误**: `Unable to find a specification for...`

**解决方案**:
```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios
pod deintegrate
pod repo update
pod install
```

### 问题4: Xcode构建错误

**错误**: Code signing error

**解决方案**:
1. 在Xcode中选择项目
2. 选择 `Runner` target
3. 点击 `Signing & Capabilities` 标签
4. 勾选 `Automatically manage signing`
5. 选择你的Team（或个人Apple ID）

### 问题5: 应用无法连接后端

**症状**: 网络请求失败

**解决方案**:
```bash
# 检查后端是否运行
curl http://localhost:8000/docs

# 重启后端
cd /Users/huangm5/Desktop/opencode/zhongyimedic
python3 web/app.py
```

---

## ⏱️ 预期时间

| 步骤 | 时间 | 说明 |
|------|------|------|
| CocoaPods安装 | 1-3分钟 | 首次安装 |
| CocoaPods设置 | 2-5分钟 | 首次下载仓库 |
| iOS依赖安装 | 3-5分钟 | 首次pod install |
| 首次构建 | 5-10分钟 | 编译Flutter和iOS |
| 后续构建 | 1-3分钟 | 增量编译 |

**总计**: 约15-25分钟（首次）

---

## 💡 开发技巧

### 热重载（快速开发）

应用运行时：
- 按 `r` - 热重载（快速更新UI）
- 按 `R` - 热重启（完全重启应用）
- 按 `q` - 退出应用

### 查看日志

```bash
# 查看后端日志
tail -f /tmp/backend.log

# 重启后端
cd /Users/huangm5/Desktop/opencode/zhongyimedic
python3 web/app.py
```

### 常用Flutter命令

```bash
# 查看可用设备
flutter devices

# 查看模拟器
flutter emulators

# 启动模拟器
open -a Simulator

# 清理构建缓存
flutter clean

# 重新获取依赖
flutter pub get
```

---

## 📱 应用功能

运行后，您将看到：

### 5个核心页面

1. **患者列表** (底部第1个标签)
   - 搜索患者
   - 按日期筛选
   - 查看患者详情

2. **脉象录入** (底部第2个标签) ⭐
   - 左右手九宫格
   - 16种脉象类型
   - AI智能分析
   - 保存记录

3. **设置** (底部第3个标签)
   - 配置API地址
   - 测试连接
   - 查看设备信息

### API集成

应用已连接到后端：
- **地址**: http://localhost:8000
- **文档**: http://localhost:8000/docs
- **状态**: 运行中

---

## 🎉 开始使用

**现在打开终端，复制以下命令：**

```bash
sudo gem install cocoapods && pod setup && pod --version
```

等待安装完成后，运行：

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios && pod install && cd .. && open ios/Runner.xcworkspace
```

**然后在Xcode中选择设备，点击 ▶️ 运行应用！**

---

## 📞 需要帮助？

- **详细安装指南**: `INSTALL_GUIDE.md`
- **快速开始**: `XCODE_QUICKSTART.md`
- **API文档**: http://localhost:8000/docs
- **Flutter文档**: https://docs.flutter.dev

---

**准备好开始了吗？现在打开终端，运行上面的命令！** 🚀

---

*最后更新: 2026-01-18*
*项目: 中医脉象九宫格OCR识别系统移动应用*
