# 云端数据库连接指南 (Supabase)

## 问题诊断
根据您提供的截图，您的 Supabase 项目数据库当前配置为 **“Not IPv4 compatible”**（不兼容 IPv4）。
这表示该数据库的直接连接地址 (`db.lddtpexxziuvqkhejukr.supabase.co`) 仅支持 IPv6 网络。

由于您的开发环境（或所在的网络环境/代理）使用的是 IPv4，因此会导致连接超时或无法连接。

## 解决方案
要解决此问题，您需要使用 Supabase 的 **Session Pooler (会话池)** 连接地址，它支持 IPv4。

### 步骤 1: 获取正确的连接字符串
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)。
2. 进入您的项目 (`lddtpexxziuvqkhejukr`)。
3. 点击左侧菜单的 **Database** -> **Connect**。
4. 在连接设置中，点击顶部的 **"Transaction Pooler"** 或 **"Session Pooler"** 选项卡（不要留在 Direct 下）。
5. 复制显示的 **Connection String**。
   - 端口通常是 `6543`。
   - 主机名通常类似 `aws-0-[region].pooler.supabase.com`。

### 步骤 2: 配置项目
在项目根目录下创建一个名为 `.env` 的文件，并填入刚才复制的地址：

```env
# 格式示例 (请替换为您实际复制的内容)
DATABASE_URL="postgresql://postgres.lddtpexxziuvqkhejukr:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

### 步骤 3: 重启后端
保存文件后，重启后端服务：
`python web/app.py`

---

## 当前状态
由于未配置 `.env` 文件，系统已**自动切换至本地模式**：
- **数据库**: SQLite (`./sql_app.db`)
- **状态**: ✅ 正常运行中
- **影响**: 数据保存在本地文件中，不会同步到云端。

您可以直接使用当前环境进行开发和测试，无需立即修复云端连接。
