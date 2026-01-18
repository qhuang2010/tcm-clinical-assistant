# 📦 CocoaPods安装指南

请按照以下步骤在终端中手动安装CocoaPods：

## 🔧 安装步骤

### 步骤1: 安装CocoaPods

在终端中运行以下命令（需要输入密码）：

```bash
sudo gem install cocoapods
```

**等待安装完成**（可能需要1-3分钟）

---

### 步骤2: 设置CocoaPods

首次安装后，运行以下命令进行设置：

```bash
pod setup
```

**等待设置完成**（可能需要2-5分钟，首次下载仓库）

---

### 步骤3: 验证安装

运行以下命令验证CocoaPods是否安装成功：

```bash
pod --version
```

**成功标志**：会显示版本号，例如：
```
1.15.2
```

---

## 📋 完整安装脚本

将以下所有命令复制并粘贴到终端：

```bash
# 1. 安装CocoaPods
sudo gem install cocoapods

# 2. 设置CocoaPods
pod setup

# 3. 验证安装
pod --version
```

---

## 🚀 安装后继续

### 4. 安装iOS项目依赖

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios
pod install
```

**等待依赖安装完成**（首次可能需要3-5分钟）

### 5. 打开Xcode项目

```bash
open /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios/Runner.xcworkspace
```

### 6. 在Xcode中运行应用

1. Xcode应该已经打开
2. 在顶部工具栏选择目标设备（如iPhone 17 Pro）
3. 点击左上角的 ▶️ 按钮（或按 ⌘ + R）
4. 等待应用在模拟器中启动

---

## ⏱️ 预期时间

- CocoaPods安装: 1-3分钟
- CocoaPods设置: 2-5分钟
- iOS依赖安装: 3-5分钟
- 首次构建: 5-10分钟

**总计**: 约10-20分钟

---

## ✅ 成功标志

看到以下内容表示安装成功：

1. ✅ `pod --version` 显示版本号
2. ✅ `pod install` 显示 "Pod installation complete!"
3. ✅ Xcode成功构建应用
4. ✅ 应用在模拟器中启动

---

## 🐛 故障排除

### 问题1: gem安装失败

**错误**: `ERROR: Failed to build gem native extension`

**解决方案**:
```bash
# 安装Xcode命令行工具
xcode-select --install

# 然后重新安装
sudo gem install cocoapods
```

### 问题2: pod setup卡住

**症状**: pod setup长时间没有输出

**解决方案**:
```bash
# 取消当前操作（Ctrl+C）
# 更新gem源
sudo gem update --system
# 重新设置
pod setup
```

### 问题3: pod install失败

**错误**: `Unable to find a specification for...`

**解决方案**:
```bash
cd ios
pod deintegrate
pod repo update
pod install
```

### 问题4: 权限错误

**错误**: `Permission denied`

**解决方案**:
```bash
# 确保使用sudo
sudo gem install cocoapods

# 或修复权限
sudo chown -R $(whoami) ~/.gem
```

---

## 💡 快速命令参考

```bash
# 检查CocoaPods状态
pod --version

# 查看Podfile配置
cat Podfile

# 更新所有pod
pod update

# 清理缓存
pod cache clean --all

# 查看可用的pod仓库
pod repo list
```

---

## 📞 需要帮助？

如果遇到问题，请检查：
1. 是否有稳定的网络连接
2. 是否有足够的磁盘空间（至少5GB）
3. Xcode命令行工具是否安装：`xcode-select -p`

---

## 🎯 开始安装

**现在在终端中运行：**

```bash
sudo gem install cocoapods && pod setup && pod --version
```

然后继续：

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios && pod install
```

**完成后在Xcode中点击 ▶️ 运行应用！** 🚀

---

**最后更新**: 2026-01-18
