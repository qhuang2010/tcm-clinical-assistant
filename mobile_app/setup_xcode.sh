#!/bin/bash

echo "========================================="
echo "Xcode项目设置助手"
echo "========================================="
echo ""

# 检查是否在正确的目录
if [ ! -d "ios/Runner.xcworkspace" ]; then
    echo "❌ 错误: 请在Flutter项目根目录运行此脚本"
    echo "当前目录: $(pwd)"
    exit 1
fi

echo "✅ 在正确的Flutter项目目录"
echo ""

# 1. 检查CocoaPods
echo "📦 检查CocoaPods..."
if command -v pod &> /dev/null; then
    POD_VERSION=$(pod --version)
    echo "✅ CocoaPods已安装: $POD_VERSION"
else
    echo "❌ CocoaPods未安装"
    echo ""
    echo "请选择安装方式："
    echo "1) 使用Homebrew安装（推荐）"
    echo "2) 使用Ruby gem安装"
    echo "3) 跳过（稍后手动安装）"
    echo ""
    read -p "请选择 [1-3]: " choice

    case $choice in
        1)
            echo ""
            echo "📦 使用Homebrew安装CocoaPods..."
            if command -v brew &> /dev/null; then
                brew install cocoapods
                if [ $? -eq 0 ]; then
                    echo "✅ CocoaPods安装成功"
                else
                    echo "❌ CocoaPods安装失败"
                    exit 1
                fi
            else
                echo "❌ Homebrew未安装"
                echo "请先安装Homebrew:"
                echo "/bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                exit 1
            fi
            ;;
        2)
            echo ""
            echo "📦 使用Ruby gem安装CocoaPods..."
            sudo gem install cocoapods
            if [ $? -eq 0 ]; then
                echo "✅ CocoaPods安装成功"
            else
                echo "❌ CocoaPods安装失败"
                exit 1
            fi
            ;;
        3)
            echo "⚠️  跳过CocoaPods安装"
            echo "您需要手动安装CocoaPods才能在Xcode中运行项目"
            echo ""
            exit 0
            ;;
        *)
            echo "❌ 无效选择"
            exit 1
            ;;
    esac
fi
echo ""

# 2. 安装CocoaPods依赖
echo "📦 安装CocoaPods依赖..."
cd ios

if [ -d "Pods" ]; then
    echo "⚠️  Pods目录已存在，更新依赖..."
    pod update
else
    echo "📦 首次安装依赖..."
    pod install
fi

if [ $? -eq 0 ]; then
    echo "✅ CocoaPods依赖安装成功"
else
    echo "❌ CocoaPods依赖安装失败"
    echo "请检查错误信息并手动运行: cd ios && pod install"
    exit 1
fi
echo ""

cd ..

# 3. 检查iOS模拟器
echo "📲 检查iOS模拟器..."
SIMULATORS=$(xcrun simctl list devices available | grep -c "iPhone")
if [ $SIMULATORS -gt 0 ]; then
    echo "✅ 找到 $SIMULATORS 个可用的iPhone模拟器"
    echo ""
    echo "可用的模拟器："
    xcrun simctl list devices available | grep "iPhone" | head -5
else
    echo "⚠️  没有找到iOS模拟器"
    echo ""
    read -p "是否创建新的iPhone模拟器？ [y/N]: " create_sim
    if [[ $create_sim =~ ^[Yy]$ ]]; then
        echo "📱 创建iPhone 15模拟器..."
        xcrun simctl create "iPhone 15" "iPhone 15" "com.apple.CoreSimulator.SimRuntime.iOS-17-0" 2>/dev/null || \
        xcrun simctl create "iPhone 14" "iPhone 14" "com.apple.CoreSimulator.SimRuntime.iOS-16-0"
        echo "✅ 模拟器创建成功"
    fi
fi
echo ""

# 4. 检查后端服务
echo "🔗 检查后端服务..."
if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo "✅ 后端服务正在运行"
    echo "   地址: http://localhost:8000"
else
    echo "⚠️  后端服务未运行"
    echo ""
    read -p "是否启动后端服务？ [y/N]: " start_backend
    if [[ $start_backend =~ ^[Yy]$ ]]; then
        echo "🚀 启动后端服务..."
        cd ../
        nohup python3 web/app.py > /tmp/backend.log 2>&1 &
        echo "✅ 后端服务已启动（后台运行）"
        echo "   查看日志: tail -f /tmp/backend.log"
        cd mobile_app
    fi
fi
echo ""

# 5. 打开Xcode
echo "📱 打开Xcode项目..."
open ios/Runner.xcworkspace
if [ $? -eq 0 ]; then
    echo "✅ Xcode已打开"
else
    echo "❌ Xcode打开失败"
    echo "请手动打开: open ios/Runner.xcworkspace"
fi
echo ""

# 6. 启动模拟器
read -p "是否启动iOS模拟器？ [y/N]: " start_sim
if [[ $start_sim =~ ^[Yy]$ ]]; then
    echo "📱 启动模拟器..."
    open -a Simulator
    echo "✅ 模拟器已启动"
fi
echo ""

# 完成
echo "========================================="
echo "✅ 设置完成！"
echo "========================================="
echo ""
echo "📋 下一步："
echo "1. 在Xcode中选择目标设备（模拟器或真机）"
echo "2. 点击 ▶️ 按钮运行应用"
echo "3. 或使用命令: flutter run"
echo ""
echo "📚 更多信息: 查看 XCODE_SETUP_GUIDE.md"
echo ""
echo "🔗 后端API: http://localhost:8000"
echo "📄 API文档: http://localhost:8000/docs"
echo ""
