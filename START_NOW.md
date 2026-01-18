# 🎯 立即开始 - CocoaPods安装

## 📋 在终端中运行以下命令

### ⚡ 快速安装（一键复制粘贴）

```bash
sudo gem install cocoapods && pod setup && pod --version && cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios && pod install && cd .. && open ios/Runner.xcworkspace
```

---

## 📝 逐步说明

### 1️⃣ 安装CocoaPods

```bash
sudo gem install cocoapods
```

**等待1-3分钟**，输入您的macOS密码。

---

### 2️⃣ 设置CocoaPods

```bash
pod setup
```

**等待2-5分钟**，首次需要下载仓库。

---

### 3️⃣ 验证安装

```bash
pod --version
```

应该看到版本号（如：`1.15.2`）。

---

### 4️⃣ 安装iOS依赖

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios
pod install
```

**等待3-5分钟**，看到 "Pod installation complete!" 即成功。

---

### 5️⃣ 打开Xcode

```bash
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app
open ios/Runner.xcworkspace
```

---

### 6️⃣ 在Xcode中运行应用

1. Xcode会自动打开
2. 在顶部工具栏选择设备（iPhone 17 Pro等）
3. 点击左上角 ▶️ 按钮
4. **等待5-10分钟**（首次构建）
5. 应用会在模拟器中启动！

---

## ✅ 当前状态

### 🟢 已就绪
- Flutter SDK: ✅ 3.38.7
- Xcode: ✅ 26.2
- iOS项目: ✅ 已配置
- 后端服务: ✅ 运行中 (http://localhost:8000)
- iOS模拟器: ✅ 已启动
- 文档: ✅ 已创建

### 🟡 需要手动操作
- CocoaPods: ⚠️ 需要在终端中安装

---

## 🎯 预期时间

| 步骤 | 时间 |
|------|------|
| CocoaPods安装 | 1-3分钟 |
| CocoaPods设置 | 2-5分钟 |
| iOS依赖安装 | 3-5分钟 |
| 首次构建 | 5-10分钟 |

**总计**: 约15-25分钟

---

## 📱 您将看到的应用

### 5个核心页面

1. **患者** - 搜索和管理患者
2. **脉象** - 九宫格脉象录入（核心功能）
3. **设置** - API配置和设置

### 核心功能

- ✅ 搜索患者（姓名/电话/拼音）
- ✅ 九宫格脉象输入
- ✅ AI智能分析
- ✅ 处方管理
- ✅ 后端API集成

---

## 🔗 重要链接

- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **详细指南**: `FINAL_SETUP_GUIDE.md`

---

## 💡 提示

1. **必须使用 Runner.xcworkspace**
   - 打开 `.xcworkspace` 而不是 `.xcodeproj`
   - 因为项目使用了CocoaPods

2. **首次构建时间较长**
   - 正常现象，请耐心等待
   - 后续构建会快很多

3. **热重载**
   - 应用运行时按 `r` 快速更新
   - 按 `R` 完全重启

4. **后端已运行**
   - 进程ID: 53281
   - 地址: http://localhost:8000
   - 日志: `/tmp/backend.log`

---

## 🐛 遇到问题？

### CocoaPods安装失败
```bash
# 安装Xcode命令行工具
xcode-select --install

# 重新安装
sudo gem install cocoapods
```

### pod install失败
```bash
cd ios
pod deintegrate
pod repo update
pod install
```

### 构建失败
- 检查代码签名设置
- 确保选择了正确的设备
- 查看 Xcode 错误提示

---

## 🎉 开始吧！

**现在打开终端，复制以下命令：**

```bash
sudo gem install cocoapods && pod setup && pod --version && cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios && pod install && cd .. && open ios/Runner.xcworkspace
```

**然后在Xcode中选择设备，点击 ▶️ 运行应用！**

---

**祝你开发愉快！** 🚀
