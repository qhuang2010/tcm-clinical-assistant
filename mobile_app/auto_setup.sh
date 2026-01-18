#!/bin/bash

echo "========================================="
echo "自动安装CocoaPods和依赖"
echo "========================================="
echo ""

# 1. 安装CocoaPods
echo "📦 安装CocoaPods..."
if command -v brew &> /dev/null; then
    echo "使用Homebrew安装..."
    brew install cocoapods
elif command -v gem &> /dev/null; then
    echo "使用Ruby gem安装..."
    sudo gem install cocoapods
else
    echo "❌ 既没有Homebrew也没有gem"
    exit 1
fi

# 2. 验证安装
if command -v pod &> /dev/null; then
    POD_VERSION=$(pod --version)
    echo "✅ CocoaPods安装成功: $POD_VERSION"
else
    echo "❌ CocoaPods安装失败"
    exit 1
fi

# 3. 安装依赖
echo ""
echo "📦 安装iOS项目依赖..."
cd /Users/huangm5/Desktop/opencode/zhongyimedic/mobile_app/ios

if [ -d "Pods" ]; then
    echo "⚠️  Pods目录已存在，更新依赖..."
    pod update
else
    echo "📦 首次安装依赖..."
    pod install
fi

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

cd ..

# 4. 检查模拟器
echo ""
echo "📲 检查iOS模拟器..."
SIMULATORS=$(xcrun simctl list devices available 2>/dev/null | grep -c "iPhone" || echo "0")

if [ "$SIMULATORS" -gt 0 ]; then
    echo "✅ 找到 $SIMULATORS 个可用的iPhone模拟器"
    echo ""
    echo "可用的模拟器："
    xcrun simctl list devices available 2>/dev/null | grep "iPhone" | head -5
else
    echo "⚠️  没有找到iOS模拟器，尝试创建..."
    xcrun simctl create "iPhone 15" "iPhone 15" "com.apple.CoreSimulator.SimRuntime.iOS-17-0" 2>/dev/null || \
    xcrun simctl create "iPhone 14" "iPhone 14" "com.apple.CoreSimulator.SimRuntime.iOS-16-0" 2>/dev/null || \
    echo "⚠️  无法自动创建模拟器，请手动创建"
fi

# 5. 启动模拟器
echo ""
echo "📱 启动iOS模拟器..."
open -a Simulator
echo "✅ 模拟器已启动"

# 6. 验证后端
echo ""
echo "🔗 检查后端服务..."
if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo "✅ 后端服务正在运行"
else
    echo "⚠️  后端服务未运行"
fi

# 7. 打开Xcode
echo ""
echo "📱 打开Xcode项目..."
open ios/Runner.xcworkspace
echo "✅ Xcode已打开"

echo ""
echo "========================================="
echo "✅ 设置完成！"
echo "========================================="
echo ""
echo "📋 下一步："
echo "1. 在Xcode中选择目标设备（模拟器）"
echo "2. 点击 ▶️ 按钮运行应用"
echo "3. 或运行: flutter run"
echo ""
echo "🔗 后端API: http://localhost:8000"
echo "📄 API文档: http://localhost:8000/docs"
echo ""
