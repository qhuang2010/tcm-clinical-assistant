# 中医脉象九宫格OCR识别系统

基于DeepSeek-OCR微调的中文医疗图像识别系统，专门用于识别中医脉象九宫格图像并转换为文本信息。

## 项目简介

本项目旨在开发一个本地化的OCR模型，通过微调DeepSeek-OCR模型，实现对中医脉象九宫格图像的智能识别。系统能够将九宫格中的脉象信息（如浮沉、迟数、虚实等）准确提取为结构化文本数据。

## 功能特性

- 🎯 **高精度识别**：基于DeepSeek-OCR微调，专门针对中医脉象九宫格优化
- 📊 **九宫格解析**：智能识别九宫格布局，提取各宫格中的脉象信息
- 🏥 **中医专业**：支持中医脉象专业术语和符号识别
- 🔧 **易于部署**：提供完整的训练、推理和Web界面
- 📈 **数据管理**：支持数据集准备、标注和预处理
- 📱 **跨平台移动应用**：支持Android、iOS和HarmonyOS
- ☁️ **云端AI推理**：基于FastAPI的高性能API服务
- 🔄 **混合架构**：云端分析 + 本地缓存

## 项目结构

```
├── config.yaml                 # 项目配置文件
├── requirements.txt            # Python依赖
├── README.md                   # 项目说明
├── data/                       # 数据目录
│   ├── raw/                    # 原始图像数据
│   ├── processed/              # 预处理后的数据
│   └── annotations/            # 标注文件
├── src/                        # 源代码
│   ├── data_preparation/       # 数据准备模块
│   ├── training/               # 模型训练模块
│   ├── inference/              # 推理服务模块
│   └── utils/                  # 工具函数
├── models/                     # 模型存储目录
│   ├── base/                   # 基础模型
│   └── fine_tuned/             # 微调后的模型
├── web/                        # Web界面
│   ├── static/                 # 静态资源
│   ├── templates/              # HTML模板
│   └── app.py                  # Web应用
├── mobile_app/                 # 移动应用 (Flutter)
│   ├── lib/                    # Flutter源码
│   ├── android/                # Android配置
│   ├── ios/                    # iOS配置
│   ├── harmonyos/              # 鸿蒙OS配置
│   └── pubspec.yaml            # Flutter依赖
├── scripts/                    # 工具脚本
│   └── build_mobile.sh         # 移动应用构建脚本
└── docs/                       # 文档
    ├── QUICK_START.md           # 快速开始指南
    ├── DEPLOYMENT_GUIDE.md      # 部署指南
    └── PROJECT_CONVERSION_SUMMARY.md  # 项目转换总结
└── tests/                      # 测试文件
```

## 快速开始

### 环境要求

- Python 3.8+
- CUDA 11.8+ (推荐，用于GPU加速)
- 至少16GB RAM
- 至少20GB可用磁盘空间

### 安装步骤

1. 克隆项目到本地
2. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

3. 配置项目：
   - 编辑 `config.yaml` 文件，设置相关路径和参数

### 使用流程

1. **数据准备**：
   - 收集中医脉象九宫格图像
   - 使用标注工具进行数据标注
   - 运行数据预处理脚本

2. **模型训练**：
   ```bash
   python src/training/train.py
   ```

3. **启动推理服务**：
   ```bash
   python src/inference/api.py
   ```

4. **使用Web界面**：
    - 访问 `http://localhost:8000`
    - 上传九宫格图像
    - 查看识别结果

### 移动应用

5. **运行移动应用**（Flutter）：
    ```bash
    cd mobile_app
    flutter pub get
    flutter run
    ```
    详见 [移动应用文档](mobile_app/README.md) 和 [快速开始指南](docs/QUICK_START.md)

6. **构建发布版本**：
    ```bash
    # Android
    flutter build apk --release
    # iOS
    flutter build ios --release
    # HarmonyOS
    flutter build harmonyos --release
    ```

## 配置说明

项目配置文件 `config.yaml` 包含以下主要部分：

- **model**: 模型相关配置（基础模型、路径、参数等）
- **training**: 训练参数（批次大小、学习率、训练轮数等）
- **data**: 数据路径和预处理参数
- **service**: 推理服务配置
- **ui**: Web界面配置

## 技术栈

### 后端
- **深度学习框架**: PyTorch, Transformers
- **OCR模型**: DeepSeek-OCR
- **Web框架**: FastAPI
- **Web前端**: HTML/CSS/JavaScript
- **数据处理**: OpenCV, Pillow, Albumentations
- **数据库**: SQLite, SQLAlchemy

### 移动应用 (Flutter)
- **UI框架**: Flutter SDK 3.0+
- **状态管理**: Provider
- **网络请求**: Dio
- **本地存储**: SQLite, SharedPreferences
- **支持平台**: Android, iOS, HarmonyOS

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue或Pull Request。

## 相关文档

- 📱 [移动应用README](mobile_app/README.md) - 移动应用详细文档
- 🚀 [快速开始指南](docs/QUICK_START.md) - 10分钟快速上手
- 📚 [部署指南](docs/DEPLOYMENT_GUIDE.md) - 完整部署文档
- 📝 [项目转换总结](docs/PROJECT_CONVERSION_SUMMARY.md) - Web到移动的转换详情
