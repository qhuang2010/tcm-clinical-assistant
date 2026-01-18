#!/bin/bash

# 项目构建验证脚本

set -e

echo "========================================="
echo "项目构建验证"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Flutter
echo "1️⃣  检查Flutter安装..."
if command -v flutter &> /dev/null; then
    echo -e "${GREEN}✓${NC} Flutter已安装"
    flutter --version
else
    echo -e "${RED}✗${NC} Flutter未安装"
    echo ""
    echo "请先安装Flutter："
    echo "  macOS:   brew install --cask flutter"
    echo "  Windows: 从 https://flutter.dev/docs/get-started/install 下载"
    echo "  Linux:   git clone https://github.com/flutter/flutter.git"
    exit 1
fi
echo ""

# 检查项目结构
echo "2️⃣  检查项目结构..."
REQUIRED_FILES=(
    "lib/main.dart"
    "lib/models/patient.dart"
    "lib/services/api_service.dart"
    "lib/screens/home_screen.dart"
    "lib/screens/patient_list_screen.dart"
    "lib/screens/patient_detail_screen.dart"
    "lib/screens/pulse_input_screen.dart"
    "lib/screens/settings_screen.dart"
    "pubspec.yaml"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (缺失）"
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ 缺少 ${#MISSING_FILES[@]} 个必要文件${NC}"
    exit 1
fi
echo ""

# 检查依赖安装
echo "3️⃣  检查Flutter依赖..."
if [ -f "pubspec.lock" ]; then
    echo -e "${GREEN}✓${NC} 依赖已安装 (pubspec.lock存在)"
else
    echo -e "${YELLOW}⚠${NC} 依赖未安装"
    echo "运行: flutter pub get"
fi
echo ""

# 检查生成的文件
echo "4️⃣  检查生成的文件..."
if ls lib/models/*.g.dart 1> /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} .g.dart文件已生成"
else
    echo -e "${YELLOW}⚠${NC} .g.dart文件未生成"
    echo "运行: flutter pub run build_runner build --delete-conflicting-outputs"
fi
echo ""

# 代码分析
echo "5️⃣  运行代码分析..."
if command -v flutter &> /dev/null; then
    if flutter analyze; then
        echo -e "${GREEN}✓${NC} 代码分析通过"
    else
        echo -e "${YELLOW}⚠${NC} 代码分析发现问题"
    fi
fi
echo ""

# 代码格式化检查
echo "6️⃣  检查代码格式..."
if command -v flutter &> /dev/null; then
    NEEDS_FORMATTING=$(dart format --set-exit-if-changed . 2>&1 || true)
    if [ -z "$NEEDS_FORMATTING" ]; then
        echo -e "${GREEN}✓${NC} 代码格式正确"
    else
        echo -e "${YELLOW}⚠${NC} 代码需要格式化"
        echo "运行: dart format ."
    fi
fi
echo ""

# 总结
echo "========================================="
echo "✅ 项目验证完成"
echo "========================================="
echo ""

echo "下一步操作："
echo "1. 运行: flutter doctor"
echo "2. 运行: flutter pub get"
echo "3. 运行: flutter pub run build_runner build --delete-conflicting-outputs"
echo "4. 运行: flutter run"
echo "5. 运行: flutter build apk --release"
echo ""

echo "📚 参考文档："
echo "- 开发指南: DEVELOPMENT_SETUP.md"
echo "- 快速开始: QUICK_START.md"
echo "- 部署指南: DEPLOYMENT_GUIDE.md"
echo ""
