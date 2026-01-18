#!/bin/bash

# 中医脉象移动应用构建脚本

set -e

echo "========================================="
echo "中医脉象移动应用构建脚本"
echo "========================================="
echo ""

# 检查Flutter是否安装
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter未安装，请先安装Flutter SDK"
    exit 1
fi

echo "✅ Flutter已安装"
flutter --version
echo ""

# 进入项目目录
cd "$(dirname "$0")/mobile_app"

# 安装依赖
echo "📦 安装依赖..."
flutter pub get

# 生成代码
echo "🔨 生成代码..."
flutter pub run build_runner build --delete-conflicting-outputs

echo ""
echo "请选择要构建的平台："
echo "1) Android APK"
echo "2) Android App Bundle (AAB)"
echo "3) iOS (仅macOS)"
echo "4) HarmonyOS"
echo "5) 全部平台"
echo ""

read -p "请输入选项 (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🔨 构建Android APK..."
        flutter build apk --release
        echo "✅ APK构建完成：build/app/outputs/flutter-apk/app-release.apk"
        ;;
    2)
        echo ""
        echo "🔨 构建Android App Bundle..."
        flutter build appbundle --release
        echo "✅ AAB构建完成：build/app/outputs/bundle/release/app-release.aab"
        ;;
    3)
        if [[ "$OSTYPE" != "darwin"* ]]; then
            echo "❌ iOS构建仅支持macOS"
            exit 1
        fi
        echo ""
        echo "🔨 构建iOS..."
        flutter build ios --release
        echo "✅ iOS构建完成，请在Xcode中打开并导出IPA"
        ;;
    4)
        echo ""
        echo "🔨 构建HarmonyOS..."
        flutter build harmonyos --release
        echo "✅ HarmonyOS构建完成"
        ;;
    5)
        echo ""
        echo "🔨 构建所有平台..."

        echo "构建Android APK..."
        flutter build apk --release
        echo "✅ Android APK完成"

        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "构建iOS..."
            flutter build ios --release
            echo "✅ iOS完成"
        else
            echo "⚠️  跳过iOS（非macOS）"
        fi

        echo "构建HarmonyOS..."
        flutter build harmonyos --release
        echo "✅ HarmonyOS完成"

        echo ""
        echo "✅ 所有平台构建完成"
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "========================================="
echo "构建完成！"
echo "========================================="
