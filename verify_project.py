#!/usr/bin/env python3
"""
简化的项目验证脚本
"""
import os
import sys

def check_project():
    """检查项目结构"""
    print("="*60)
    print("项目验证")
    print("="*60)

    # 检查必需文件
    required = {
        'lib/main.dart': '应用入口',
        'lib/models/patient.dart': '数据模型',
        'lib/services/api_service.dart': 'API服务',
        'lib/screens/home_screen.dart': '主页',
        'lib/screens/pulse_input_screen.dart': '脉象录入',
        'pubspec.yaml': '依赖配置',
    }

    print("\n检查文件结构...")
    missing = []
    for filepath, desc in required.items():
        if os.path.exists(filepath):
            print(f"✓ {desc:20s} -> {filepath}")
        else:
            print(f"✗ {desc:20s} -> {filepath} (缺失)")
            missing.append(filepath)

    if missing:
        print(f"\n⚠️  缺少 {len(missing)} 个文件")
        return False

    print("\n✅ 所有必需文件都存在")
    return True

def main():
    print("\n开始验证项目...")
    print(f"当前目录: {os.getcwd()}")

    os.chdir('mobile_app')

    if check_project():
        print("\n✅ 项目验证通过")
        print("\n下一步:")
        print("1. 安装Flutter SDK")
        print("2. 运行: flutter pub get")
        print("3. 运行: flutter run")
        return 0
    else:
        print("\n❌ 项目验证失败")
        return 1

if __name__ == "__main__":
    sys.exit(main())
