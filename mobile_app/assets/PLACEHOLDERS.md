# Placeholders for Application Assets

此目录包含应用所需的资源文件占位符。

---

## 📸 Images

### 应用内使用的图片

当前需要的图片：

1. **空状态图片**
   - 文件名: `empty_state.png`
   - 用途: 列表为空时的提示图
   - 建议尺寸: 512x512
   - 格式: PNG (支持透明）

2. **Logo图片**
   - 文件名: `logo.png`
   - 用途: 应用内Logo展示
   - 建议尺寸: 200x200
   - 格式: PNG (支持透明）

3. **默认头像**
   - 文件名: `default_avatar.png`
   - 用途: 患者头像
   - 建议尺寸: 200x200
   - 格式: PNG (圆形遮罩)

### 如何添加图片

```bash
# 将图片放到此目录
cp your_image.png assets/images/your_image.png

# 或使用工具创建占位符
# 见下方说明
```

---

## 🎯 Icons

### 应用图标文件

应用图标需要为不同平台准备不同尺寸的图标。

#### Android 应用图标

| 文件名 | 尺寸 | 密度 | 位置 |
|--------|------|------|------|
| mipmap-mdpi/ic_launcher.png | 48x48 | mdpi | android/app/src/main/res/mipmap-mdpi/ |
| mipmap-hdpi/ic_launcher.png | 72x72 | hdpi | android/app/src/main/res/mipmap-hdpi/ |
| mipmap-xhdpi/ic_launcher.png | 96x96 | xhdpi | android/app/src/main/res/mipmap-xhdpi/ |
| mipmap-xxhdpi/ic_launcher.png | 144x144 | xxhdpi | android/app/src/main/res/mipmap-xxhdpi/ |
| mipmap-xxxhdpi/ic_launcher.png | 192x192 | xxxhdpi | android/app/src/main/res/mipmap-xxxhdpi/ |

#### iOS 应用图标

| 文件名 | 尺寸 | 位置 |
|--------|------|------|
| Icon-60@2x.png | 120x120 | ios/Runner/Assets.xcassets/AppIcon.appiconset/ |
| Icon-60@3x.png | 180x180 | ios/Runner/Assets.xcassets/AppIcon.appiconset/ |
| Icon-76.png | 76x76 | ios/Runner/Assets.xcassets/AppIcon.appiconset/ |
| Icon-76@2x.png | 152x152 | ios/Runner/Assets.xcassets/AppIcon.appiconset/ |
| Icon-83.5@2x.png | 167x167 | ios/Runner/Assets.xcassets/AppIcon.appiconset/ |
| Icon-1024.png | 1024x1024 | ios/Runner/Assets.xcassets/AppIcon.appiconset/ |

#### HarmonyOS 应用图标

| 文件名 | 尺寸 | 位置 |
|--------|------|------|
| app_icon.png | 512x512 | harmonyos/entry/src/main/resources/base/media/ |

---

## 🎨 Fonts

### 自定义字体

如果需要使用自定义字体：

1. **添加字体文件**
   ```bash
   cp your_font.ttf assets/fonts/YourFont.ttf
   ```

2. **在pubspec.yaml中配置**
   ```yaml
   flutter:
     fonts:
       - family: YourFont
         fonts:
           - asset: assets/fonts/YourFont.ttf
   ```

3. **在代码中使用**
   ```dart
   Text(
     'Hello',
     style: TextStyle(fontFamily: 'YourFont'),
   )
   ```

---

## 🛠️ 创建占位符资源

### 使用在线工具生成应用图标

推荐工具：

1. **MakeAppIcon**
   - 网址: https://makeappicon.com/
   - 功能: 一次生成所有平台图标
   - 支持格式: Android, iOS, HarmonyOS

2. **AppIcon.co**
   - 网址: https://appicon.co/
   - 功能: 快速生成应用图标
   - 输出: 多种尺寸

3. **IconKitchen**
   - 网址: https://icon.kitchen/
   - 功能: iOS应用图标生成

### 创建占位符图片（macOS）

```bash
# 创建简单的占位符图标
# 需要安装 ImageMagick
brew install imagemagick

# 创建512x512占位符
convert -size 512x512 xc:teal \
  -font Helvetica -pointsize 200 -fill white \
  -gravity center -annotate +0+0 '中医' \
  assets/icons/app_icon_placeholder.png

# 创建256x256占位符
convert -size 256x256 xc:teal \
  -font Helvetica -pointsize 100 -fill white \
  -gravity center -annotate +0+0 '中医' \
  assets/icons/app_icon_small.png

# 创建空状态图
convert -size 512x512 xc:#f5f5f5 \
  -font Helvetica -pointsize 80 -fill #999999 \
  -gravity center -annotate +0-50 '暂无数据' \
  assets/images/empty_state_placeholder.png
```

### 创建占位符图片（使用代码生成）

如果ImageMagick不可用，可以使用在线工具或设计软件：

1. **推荐工具**
   - Figma: https://www.figma.com/
   - Canva: https://www.canva.com/
   - GIMP: https://www.gimp.org/ (免费）

2. **设计建议**
   - 使用中医元素（如脉象图案）
   - 主色调：Teal (#009688)
   - 风格：简洁、专业
   - 尺寸：1024x1024（可以缩放到任何尺寸）

---

## 📋 资源检查清单

在提交代码前，确保：

### 应用图标
- [ ] Android图标已添加（5个尺寸）
- [ ] iOS图标已添加（6个尺寸）
- [ ] HarmonyOS图标已添加（512x512）
- [ ] 图标符合设计规范

### 图片资源
- [ ] 空状态图片已添加
- [ ] Logo图片已添加
- [ ] 默认头像已添加
- [ ] 所有图片已优化（大小和格式）

### 字体
- [ ] 自定义字体已添加（如需要）
- [ ] 字体已在pubspec.yaml中配置
- [ ] 字体文件格式正确（TTF/OTF）

### 配置
- [ ] pubspec.yaml中assets已配置
- [ ] 所有资源路径正确
- [ ] 资源文件已添加到git

---

## 🔧 自动化脚本

### 使用flutter_launcher_icons

如果pubspec.yaml中已配置flutter_launcher_icons：

```bash
# 安装插件
flutter pub add flutter_launcher_icons

# 运行生成
flutter pub run flutter_launcher_icons
```

这将自动生成所有平台的应用图标！

---

## 📦 压缩和优化

### 压缩图片

```bash
# macOS/Linux (使用optipng)
brew install optipng
optipng -o7 assets/images/*.png

# 压缩Android图标
optipng -o7 android/app/src/main/res/mipmap-*/ic_launcher.png

# 压缩iOS图标
optipng -o7 ios/Runner/Assets.xcassets/AppIcon.appiconset/*.png
```

### WebP格式（推荐）

```bash
# 将PNG转换为WebP以减小体积
# 需要安装cwebp
brew install webp

cwebp -q 80 input.png -o output.webp
```

---

## 🎯 设计资源

### 推荐颜色方案

```yaml
主色调: #009688 (Teal)
辅助色: #4DB6AC (Teal Light)
背景色: #FFFFFF (White)
文字色: #333333 (Dark Gray)
禁用色: #BDBDBD (Light Gray)
成功色: #4CAF50 (Green)
错误色: #F44336 (Red)
警告色: #FF9800 (Orange)
```

### 推荐字体

```yaml
主字体: PingFang SC (iOS/macOS), Roboto (Android), HarmonyOS Sans (HarmonyOS)
代码字体: Fira Code, JetBrains Mono
数字字体: SF Mono, Roboto Mono
```

---

## 📚 参考资源

### 设计规范
- [Flutter Material Design](https://m3.material.io/)
- [Human Interface Guidelines (iOS)](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design (Android)](https://m3.material.io/)
- [HarmonyOS Design](https://developer.huawei.com/consumer/cn/design/)

### 图标设计
- [Material Icons](https://m3.material.io/icons/)
- [SF Symbols (iOS)](https://developer.apple.com/sf-symbols/)
- [HarmonyOS Icons](https://developer.huawei.com/consumer/cn/design/harmonyos-icon/)

---

## ❓ 常见问题

### Q1: 资源文件不显示

**解决方案**:
```yaml
# 确保pubspec.yaml中有正确的配置
flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/icons/
```

```bash
# 清理并重新运行
flutter clean
flutter pub get
flutter run
```

### Q2: 图标未更新

**解决方案**:
```bash
# iOS: 清理DerivedData
rm -rf ios/Runner/DerivedData
flutter clean
flutter build ios

# Android: 清理build
flutter clean
flutter build apk
```

### Q3: 字体不显示

**解决方案**:
1. 确保TTF/OTF文件有效
2. 检查pubspec.yaml配置
3. 使用正确的fontFamily名称
4. 重新构建应用

---

## 📝 总结

此目录需要包含：
- 应用图标（Android/iOS/HarmonyOS）
- 应用内图片
- 自定义字体（可选）

所有资源文件应在pubspec.yaml中正确配置！

---

**最后更新**: 2024-01-17
