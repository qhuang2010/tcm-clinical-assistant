#!/bin/bash

# 生成应用图标的辅助脚本

set -e

echo "========================================="
echo "应用图标生成工具"
echo "========================================="
echo ""

# 检查是否安装了ImageMagick
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick未安装"
    echo ""
    echo "安装方法："
    echo "  macOS:   brew install imagemagick"
    echo "  Ubuntu:  sudo apt-get install imagemagick"
    echo "  CentOS:  sudo yum install ImageMagick"
    echo ""
    echo "或者使用在线工具："
    echo "  https://makeappicon.com/"
    echo "  https://appicon.co/"
    exit 1
fi

# 创建输出目录
mkdir -p icons/android/mdpi
mkdir -p icons/android/hdpi
mkdir -p icons/android/xhdpi
mkdir -p icons/android/xxhdpi
mkdir -p icons/android/xxxhdpi
mkdir -p icons/ios
mkdir -p icons/harmonyos

# 使用ImageMagick生成占位符图标
echo "📸 生成占位符图标..."
echo ""

# 主图标颜色和文本
BG_COLOR="#009688"  # Teal
TEXT_COLOR="#FFFFFF"  # White
TEXT="中医"

# 生成不同尺寸的图标
echo "生成Android图标..."

convert -size 512x512 xc:"$BG_COLOR" \
  -font Helvetica -pointsize 200 -fill "$TEXT_COLOR" \
  -gravity center -annotate +0+0 "$TEXT" \
  icons/android/xxxhdpi/ic_launcher.png

convert icons/android/xxxhdpi/ic_launcher.png \
  -resize 192x192 icons/android/xxhdpi/ic_launcher.png

convert icons/android/xxxhdpi/ic_launcher.png \
  -resize 144x144 icons/android/xhdpi/ic_launcher.png

convert icons/android/xxxhdpi/ic_launcher.png \
  -resize 96x96 icons/android/hdpi/ic_launcher.png

convert icons/android/xxxhdpi/ic_launcher.png \
  -resize 48x48 icons/android/mdpi/ic_launcher.png

echo "  ✓ mdpi (48x48)"
echo "  ✓ hdpi (72x72)"
echo "  ✓ xhdpi (96x96)"
echo "  ✓ xxhdpi (144x144)"
echo "  ✓ xxxhdpi (192x192)"
echo ""

echo "生成iOS图标..."

convert -size 1024x1024 xc:"$BG_COLOR" \
  -font Helvetica -pointsize 400 -fill "$TEXT_COLOR" \
  -gravity center -annotate +0+0 "$TEXT" \
  icons/ios/icon_1024.png

convert icons/ios/icon_1024.png \
  -resize 512x512 icons/ios/icon_512.png

convert icons/ios/icon_1024.png \
  -resize 256x256 icons/ios/icon_256.png

convert icons/ios/icon_1024.png \
  -resize 128x128 icons/ios/icon_128.png

convert icons/ios/icon_1024.png \
  -resize 64x64 icons/ios/icon_64.png

echo "  ✓ 64x64"
echo "  ✓ 128x128"
echo "  ✓ 256x256"
echo "  ✓ 512x512"
echo "  ✓ 1024x1024"
echo ""

echo "生成HarmonyOS图标..."

cp icons/android/xxxhdpi/ic_launcher.png icons/harmonyos/app_icon.png

echo "  ✓ 512x512"
echo ""

# 生成空状态占位符图
echo "生成空状态图片..."

convert -size 512x512 xc:#F5F5F5 \
  -font Helvetica -pointsize 60 -fill "#999999" \
  -gravity center -annotate +0-50 "暂无数据" \
  images/empty_state.png

echo "  ✓ 空状态图片"
echo ""

# 生成Logo占位符图
echo "生成Logo图片..."

convert -size 400x200 xc:"$BG_COLOR" \
  -font Helvetica -pointsize 60 -fill "$TEXT_COLOR" \
  -gravity center -annotate +0+0 "中医脉象" \
  images/logo.png

echo "  ✓ Logo图片"
echo ""

echo "========================================="
echo "✅ 图标生成完成！"
echo "========================================="
echo ""

echo "生成的文件："
echo "  - icons/android/ (Android图标)"
echo "  - icons/ios/ (iOS图标)"
echo "  - icons/harmonyos/ (鸿蒙OS图标)"
echo "  - images/empty_state.png (空状态图)"
echo "  - images/logo.png (Logo)"
echo ""

echo "下一步："
echo "1. 复制图标到对应平台目录"
echo "2. （可选）使用设计工具美化图标"
echo "3. 在pubspec.yaml中配置assets"
echo "4. 运行: flutter run"
echo ""
