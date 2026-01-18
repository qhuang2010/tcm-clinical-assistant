#!/bin/bash

echo "========================================="
echo "项目快速验证"
echo "========================================="
echo ""

echo "检查项目文件..."

files_ok=true

# 检查Dart文件
for file in lib/main.dart lib/models/patient.dart lib/services/api_service.dart lib/screens/home_screen.dart lib/screens/pulse_input_screen.dart; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (缺失)"
        files_ok=false
    fi
done

echo ""
echo "检查配置文件..."
for file in pubspec.yaml android/app/src/main/AndroidManifest.xml ios/Podfile; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (缺失)"
        files_ok=false
    fi
done

echo ""
echo "检查生成的文件..."
if [ -f "lib/models/patient.g.dart" ]; then
    echo "✓ lib/models/patient.g.dart"
else
    echo "⚠️  lib/models/patient.g.dart (将在flutter pub get后生成)"
fi

echo ""
echo "========================================="
if [ "$files_ok" = true ]; then
    echo "✅ 项目文件检查通过"
    echo ""
    echo "下一步："
    echo "1. 安装Flutter: brew install --cask flutter"
    echo "2. 进入项目: cd mobile_app"
    echo "3. 安装依赖: flutter pub get"
    echo "4. 运行应用: flutter run"
else
    echo "❌ 项目文件检查失败，请补充缺失文件"
fi
echo "========================================="
