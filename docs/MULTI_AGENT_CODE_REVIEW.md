# 🏥 中医脉象九宫格OCR系统 — 多代理代码审查报告

> **审查日期**: 2026-02-12  
> **项目**: zhongyimedic (中医脉象九宫格OCR识别系统)  
> **审查方法**: 7个专业Agent并行分析  

---

## 📊 总体评分

| Agent | 维度 | 评分 | 状态 |
|-------|------|------|------|
| 🏗️ 架构师 | 系统架构 | 6.5/10 | ⚠️ 需改进 |
| 🔒 安全审计 | 安全性 | 3/10 | 🔴 严重 |
| 📝 代码质量 | 代码规范 | 5.5/10 | ⚠️ 需改进 |
| 🎨 前端 | Web前端 | 5/10 | ⚠️ 需改进 |
| 📱 移动端 | Flutter App | 4.5/10 | ⚠️ 需改进 |
| 🚀 DevOps | 部署运维 | 4/10 | ⚠️ 需改进 |
| 🤖 AI/ML | 模型架构 | 7/10 | ✅ 良好 |

**综合评分: 5.1/10** — 项目有良好的领域设计思路，但存在多个严重的安全隐患和工程质量问题。

---

## 🏗️ Agent 1: 架构师 — 系统架构分析

### ✅ 优点

1. **Offline-First 混合架构**: 本地SQLite + 云端PostgreSQL的双数据库设计理念正确，适合诊所场景（网络不稳定）
2. **Relational Skeleton + JSONB Flesh 模式**: 数据模型将高频查询字段（`complaint`, `diagnosis`）作为关系列，将灵活数据（`pulse_grid`, `medical_record`）存入JSON列，这是一个合理的混合设计
3. **UUID同步策略**: 使用UUID作为跨库同步标识符，支持本地/云端ID不一致的场景
4. **SyncMixin复用**: 通过Mixin为所有模型统一添加同步字段，代码复用合理

### ❌ 问题

#### P0 — 严重

1. **`app.py` 是600行的"上帝文件"（God Object）**
   - 所有API路由（认证、患者、记录、导入、同步、管理员）全部写在一个文件中
   - `import` 语句散落在文件各处（第1行、第224行、第519行、第566行），非常混乱
   - **建议**: 使用 FastAPI `APIRouter` 将路由拆分为 `auth_router`, `patient_router`, `record_router`, `admin_router`, `sync_router`, `import_router`

2. **同步服务的数据一致性风险**
   - `sync_service.py` 第120行: `cloud_db.query(model).filter(model.is_deleted == False).all()` — 每次sync_down都拉取**全部**云端数据，没有增量同步
   - 对于大量数据场景，这会导致严重性能问题
   - 缺少**冲突解决策略**的实际实现（第167-169行只有 `return`，直接跳过冲突）

3. **缺少数据库迁移工具**
   - 代码注释说"In production, use Alembic for migrations"（第25行），但实际没有任何Alembic配置
   - 数据库Schema变更将导致数据丢失

#### P1 — 重要

4. **`record_service.py` 中患者查询逻辑有Bug**（第26-29行）
   ```python
   patient_query = patient_query.filter(
       Patient.gender == patient_info.get("gender"),
       Patient.age == int(patient_info.get("age", 0)) if patient_info.get("age") else None
   )
   ```
   - 当 `age` 为空时，`filter(None)` 的行为是未定义的，可能导致不可预测的查询结果

5. **`search_service.py` 第44行源判断逻辑有误**
   ```python
   "source": "local" if db == SessionLocal else "cloud"
   ```
   - `db` 是 Session 实例，`SessionLocal` 是 sessionmaker 类，两者永远不相等，`source` 将始终为 `"cloud"`

---

## 🔒 Agent 2: 安全审计 — 安全性分析

### 🔴 严重问题（立即修复）

1. **`.env.bak` 文件泄露数据库凭据到Git仓库！**
   - 文件内容: `DATABASE_URL=postgresql://postgres:Ucn?ch3PCVcF*Wg@[2406:da1c:f42:ae0c:...]:5432/postgres?sslmode=require`
   - **含有真实的数据库用户名、密码、IPv6地址**
   - `.gitignore` 只排除了 `.env`，没有排除 `.env.bak`
   - **⚠️ 影响**: 任何能访问此Git仓库的人都可以直接连接到云端PostgreSQL数据库
   - **建议**: 
     1. 立即从Git历史中删除此文件（需要 `git filter-branch` 或 `BFG Repo-Cleaner`）
     2. **立即轮换数据库密码**
     3. 在 `.gitignore` 中添加 `*.bak`, `.env*`

2. **JWT Secret Key 硬编码为弱默认值**
   - `auth_service.py` 第17行: `SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-development-only")`
   - 如果 `.env` 文件丢失或未配置，系统将使用这个众所周知的默认值
   - 攻击者可以伪造任何用户的JWT Token
   - **建议**: 如果环境变量未设置，应**拒绝启动**而非使用默认值

3. **SQL注入风险**
   - `search_service.py` 第111-113行: `Patient.name.ilike(f"%{query_str}%")` 
   - 虽然SQLAlchemy ORM有一定程度的保护，但直接将用户输入嵌入 `ilike` 模式可能导致通配符攻击（如输入 `%` 将匹配所有记录）
   - **建议**: 转义特殊字符 `%` 和 `_`

4. **`sql_app.db` 数据库文件被提交到Git**
   - 虽然 `.gitignore` 有 `*.db`，但文件已在仓库中（168KB），包含真实患者数据
   - **医疗数据泄露**是严重的合规问题
   - **建议**: 使用 `git rm --cached sql_app.db` 移除并确保不再追踪

### ⚠️ 中等风险

5. **密码哈希使用bcrypt但未配置迭代次数**
   - `auth_service.py` 第21行: `CryptContext(schemes=["bcrypt"], deprecated="auto")`
   - 未显式设置 `rounds` 参数，将使用默认的12轮（可接受但建议显式设置）

6. **Token过期时间过长**: 24小时（第19行），对医疗系统来说过长
   - **建议**: 设置为2-4小时，并实现Refresh Token机制

7. **缺少CORS配置**: `app.py` 没有任何CORS中间件
   - 移动端和前端可能无法正常跨域请求
   - **建议**: 添加 `CORSMiddleware` 并限制允许的来源

8. **缺少速率限制**: 登录和注册接口没有任何防暴力破解措施

9. **删除操作无权限验证**: `delete_record` (第501行) 只检查用户是否登录，不检查用户是否有权删除该条记录

---

## 📝 Agent 3: 代码质量 — 代码规范分析

### 问题清单

#### 代码异味（Code Smells）

1. **重复的 `pd.notna()` 模式** — `app.py` 第271-351行
   ```python
   # 同一模式重复了15次以上
   str(row.get('主诉', '')).strip() if pd.notna(row.get('主诉', None)) else ''
   ```
   - **建议**: 提取为工具函数 `safe_get(row, col, default='')`

2. **`import re` 在循环内部** — `app.py` 第324行
   ```python
   for idx, row in df.iterrows():
       ...
       import re  # 在循环的每一轮都import！
   ```
   - 虽然Python会缓存import，但这是极差的代码风格

3. **`datetime` 被重复导入**
   - 第227行: `from datetime import datetime`
   - 第519行: `from datetime import datetime, date`
   - 这说明代码是分阶段"堆砌"上去的，缺乏整体规划

4. **`record_service.py` 中存在过多的 `db.commit()` 调用**
   - 第44行、第49行、第52行分别各有一个commit
   - 应当使用单一事务，在最后统一commit

#### 类型安全

5. **API端点参数类型不安全** — 大量使用 `Dict[str, Any]`
   - `app.py` 第88行: `user_data: Dict[str, Any]`
   - `app.py` 第148行: `data: Dict[str, bool]`
   - **建议**: 使用 Pydantic BaseModel 定义请求体Schema，获得自动验证和文档

#### 测试

6. **没有任何测试文件**
   - `scripts/` 下有 `test_*.py` 文件，但它们是**手动调试脚本**，不是单元测试
   - 没有 `pytest` 配置文件
   - **建议**: 至少为核心服务（`auth_service`, `record_service`, `analysis_service`）编写单元测试

#### 缺少的基础设施

7. **没有 `__init__.py`** — `src/database/` 目录缺少 `__init__.py`，可能导致Python导入问题
8. **没有 `pyproject.toml` 或 `setup.py`** — 项目缺少标准Python打包配置
9. **`requirements.txt` 缺少认证相关依赖** — `python-jose`, `passlib`, `bcrypt`, `pypinyin`, `openpyxl` 未列出

---

## 🎨 Agent 4: 前端 — Web前端分析

### 技术栈

| 项目 | 版本/技术 |
|------|-----------|
| 框架 | React 19.2 + Vite (rolldown-vite 7.2.5) |
| 路由 | react-router-dom 7.12.0 |
| 状态管理 | 无（仅本地state） |
| UI库 | 无（自定义CSS） |

### 问题

1. **`App.jsx` 是20KB的单文件应用**
   - 所有页面逻辑、路由、状态管理、API调用都在一个文件中
   - 缺少全局状态管理（如Context/Redux/Zustand）

2. **`Admin.jsx` 达到30KB** — 单个管理面板组件过于庞大
   - 应拆分为 `UserManagement`, `PractitionerManagement`, `SystemSettings` 等子组件

3. **缺少关键依赖**
   - 没有HTTP客户端库（如axios），API调用方式未知
   - 没有UI组件库，所有样式都是自定义CSS
   - 没有表单验证库

4. **前端与后端耦合**
   - React应用直接挂载在FastAPI的静态文件服务上
   - 开发体验差：每次前端变更需要 `npm run build`

5. **CSS文件** `App.css` (9KB) 和 `index.css` (1.2KB) 缺乏CSS变量系统，可维护性差

---

## 📱 Agent 5: 移动端 — Flutter App分析

### 问题

1. **`main.dart` 中 `_HomeScreenState` 是孤立类**（第62行）
   - `HomeScreen` 在第6行被引用为已导入的widget
   - 但 `_HomeScreenState` 定义在 `main.dart` 中，且没有对应的 `StatefulWidget` 声明
   - 这意味着 `_HomeScreenState` **永远不会被使用**（dead code）
   - 可能是代码重构后的残留

2. **API Service 是 `ChangeNotifier`**（第31行）
   - `ApiService` 不应该是一个 Provider/ChangeNotifier
   - API服务是无状态的工具类，不需要监听变化
   - **建议**: 使用依赖注入或简单的单例模式

3. **缺少离线支持**
   - 移动端声称支持"混合架构"，但实际只有一个 `api_service.dart` 做网络请求
   - 没有本地数据库（SQLite/Hive），没有离线缓存策略
   - 这与项目宣称的"Offline-First"理念矛盾

4. **`patient.g.dart`** 表明使用了 `json_serializable`，但 `pubspec.yaml` 中**未声明** `json_annotation` 和 `build_runner` 依赖

5. **字体依赖**: 使用 `PingFang SC` 字体，这是**Apple专有字体**，在Android上不可用
   - **建议**: 使用 `Noto Sans SC` 或 `Source Han Sans` 等跨平台中文字体

---

## 🚀 Agent 6: DevOps — 部署与运维分析

### 问题

1. **`docker-compose.yml` 语法错误**（第39-40行）
   ```yaml
   volumes:
     flutter-cache:
       android-cache:  # 错误！这不是有效的YAML语法
   ```
   - `android-cache` 被解析为 `flutter-cache` 的子键，而非独立的volume
   - **修复**: 每个volume应独立声明

2. **缺少Dockerfile** — `docker-compose.yml` 引用了 `Dockerfile`，但项目根目录没有此文件
   - （只有 `mobile_app/Dockerfile` 存在）

3. **`sql_app.db` 在docker volume中直接映射**（第13行）
   - `./sql_app.db:/app/sql_app.db` — SQLite文件直接bind mount
   - 多容器访问SQLite会导致锁冲突
   - **建议**: 生产环境应使用PostgreSQL，而非SQLite

4. **缺少CI/CD配置**
   - `.github/` 目录存在但未查看内容
   - 没有自动化测试、构建、部署流程

5. **缺少日志收集和监控**
   - 只有基础的 `logging.basicConfig`
   - 没有结构化日志（JSON格式）
   - 没有健康检查告警机制

6. **`requirements.txt` 依赖版本过于宽松**
   - 如 `torch>=2.0.0` 允许任何2.x版本，可能导致不同环境中依赖不一致
   - **建议**: 使用 `pip freeze` 锁定精确版本，或使用 Poetry/pip-tools

---

## 🤖 Agent 7: AI/ML — 模型架构分析

### ✅ 亮点

1. **`GridViT` 设计理念优秀**
   - 不使用标准ViT的随机patch，而是将九宫格的9个区域作为9个语义token + 1个全局token
   - 位置编码可学习，对应中医的"寸/关/尺 × 浮/中/沉"九个诊断位
   - 使用Transformer Encoder让不同位置的特征交互（如"浮取寸脉+沉取尺脉"判断"真阳外越"）

2. **`MultimodalLLM` 架构设计合理**
   - 采用LLaVA风格的"Visual Encoder → Projector → Frozen LLM"三段式架构
   - LLM冻结参数 + 视觉侧可训练，大幅减少训练成本

3. **`analysis_service.py` 的规则引擎有中医专业深度**
   - 基于《伤寒论》和郑钦安（火神派）理论
   - 实现了"太阳伤寒"、"真寒假热（阳虚外浮）"、"中焦虚损"等辨证逻辑
   - 处方合理性检查（温热药/寒凉药与病机的一致性分析）

### ❌ 问题

1. **模型代码是原型/占位符，无法训练**
   - 没有数据加载器（Dataset/DataLoader）
   - 没有训练脚本 — `README.md` 第86行提到 `python src/training/train.py` 但 `src/training/` 目录**不存在**
   - 没有推理脚本 — `src/inference/` 同样不存在

2. **`GridViT` 使用ResNet18做backbone过于简陋**
   - 第19行: `models.resnet18()` — 对于OCR任务，应至少使用更专业的backbone如 `Swin Transformer` 或 `ConvNeXt`
   - ResNet18的感受野对细粒度文字识别可能不足

3. **`generate()` 方法有已知限制**（第117-122行注释）
   - 标准HuggingFace `generate()` 对 `inputs_embeds` 的支持不完善
   - 需要自定义生成循环或使用特定模型的API

4. **`config.yaml` 配置了不存在的模型**
   - `base_model: "deepseek-ai/DeepSeek-OCR"` — HuggingFace上**不存在**此模型
   - 实际代码中使用 `deepseek-ai/deepseek-llm-7b-chat`

---

## 📋 改进建议优先级列表

### 🔴 P0 — 必须立即修复（安全相关）

| # | 问题 | 文件 | 建议 |
|---|------|------|------|
| 1 | 数据库凭据泄露 | `.env.bak` | 从Git历史删除，轮换密码 |
| 2 | 医疗数据泄露 | `sql_app.db` | `git rm --cached`，从历史中清除 |
| 3 | JWT密钥弱默认值 | `auth_service.py:17` | 未配置时拒绝启动 |
| 4 | 缺少CORS配置 | `app.py` | 添加 `CORSMiddleware` |
| 5 | 删除操作无权限验证 | `app.py:501` | 验证用户是否有权限删除 |

### 🟡 P1 — 近期改进（质量相关）

| # | 问题 | 建议 |
|---|------|------|
| 6 | `app.py` 单文件600行 | 拆分为多个 APIRouter |
| 7 | `requirements.txt` 不完整 | 补充所有实际依赖 |
| 8 | 无单元测试 | 至少覆盖核心服务 |
| 9 | API参数类型不安全 | 使用Pydantic BaseModel |
| 10 | `search_service.py` source判断Bug | 修复比较逻辑 |

### 🟢 P2 — 长期优化

| # | 问题 | 建议 |
|---|------|------|
| 11 | 数据库迁移 | 引入 Alembic |
| 12 | 同步全量拉取 | 实现增量同步（基于last_synced_at） |
| 13 | 移动端离线支持 | 引入Hive/SQLite本地存储 |
| 14 | AI模型完善 | 补充训练/推理Pipeline |
| 15 | CI/CD | 添加GitHub Actions |

---

## 📊 代码统计

| 模块 | 文件数 | 总行数 | 主要语言 |
|------|--------|--------|----------|
| 后端核心 (`src/`) | 12 | ~1,150 | Python |
| Web应用 (`web/app.py`) | 1 | 600 | Python |
| 前端 (`web/frontend/src/`) | 15 | ~3,500+ | React/JSX |
| 移动端 (`mobile_app/lib/`) | 10 | ~2,000+ | Dart/Flutter |
| AI模型 (`src/models/`) | 3 | 230 | Python/PyTorch |
| 脚本 (`scripts/`) | 29 | ~1,500+ | Python |
| 文档 | 15+ | ~5,000+ | Markdown |

---

*报告由7个专业Agent并行生成 — 架构师、安全审计、代码质量、前端、移动端、DevOps、AI/ML*
