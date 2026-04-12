# 梦境拓扑 (Dream Topology)

这是一个专为探索潜意识而设计的 Web 应用程序。它通过多维度的梦境记录与 AI 深度解析，将抽象的梦境转化为具象的“拓扑网络”，帮助用户洞察内心深处的心理原型与情感脉络。

## 🌟 核心功能

- **多模态捕获 (Signal Capture)**:
  - **语音捕捉**: 灵动的波纹动效，支持 Web Speech API 实时转写梦境。
  - **文字记录**: 极简的笔记模式，适配移动端单手操作。
- **AI 深度解析 (Deep Insight)**:
  - **符号提取**: 自动识别梦境中的核心符号，并关联荣格心理学原型（如“阴影”、“阿尼玛”）。
  - **拓扑网络**: 将梦境元素可视化为美观的拓扑图，展示符号间的能量连接。
  - **体感映射**: 根据文本自动计算梦境的清晰度、惊悚感和控制力。
- **梦境塔罗 (Dream Tarot)**:
  - **三张牌阵**: 结合梦境提问，抽取过去、现在、未来的三张塔罗牌。
  - **3D 交互**: 丝滑的 3D 翻牌动画与 iOS 风格的滑动交互。
  - **AI 启示**: 基于塔罗牌义与梦境语境提供深度行动建议。
- **自愈指南 (Healing Guide)**: 根据梦境情绪状态，动态推送冥想、自愈建议或心理百科。
- **响应式设计 (Apple Style UI)**:
  - 全面适配移动端，采用高级毛玻璃 (Backdrop Blur)、流体背景与动态光晕设计。
  - 沉浸式深色模式适配，提供极佳的夜间记录体验。

## 🏗️ 技术栈

### 前端 (Web)
- **核心框架**: React 19, Vite
- **动效库**: Framer Motion (3D 翻转、物理弹簧、滑动控制器)
- **样式**: Tailwind CSS 4 (响应式、Grid 布局、自定义工具类)
- **图标**: Lucide React
- **语言**: TypeScript

### 后端 (API)
- **框架**: Hono (轻量级、边缘端优化的 Web 框架)
- **运行环境**: Node.js
- **数据库**: **MySQL (腾讯云 CynosDB)** + Prisma ORM
- **AI 集成**: 
  - **DeepSeek**: 负责核心梦境解析、符号提取与塔罗解读。
  - **智谱 AI / OpenAI**: 用于文本嵌入 (Embedding) 与图像生成。
- **用户隔离**: 基于 `x-user-id` 和匿名 ID 的双通道数据隔离机制。

## 🚀 本地运行指南

### 前提条件
- Node.js (v18+)
- MySQL 数据库环境
- 有效的 AI 服务 API Key (DeepSeek / 智谱 AI / OpenAI)

### 1. 克隆与安装
```bash
git clone <repository-url>
cd 黑客松
npm install # 在根目录安装或分别进入子目录
```

### 2. 后端配置 (dream-topology-backend)
1. 进入目录：`cd dream-topology-backend`
2. 复制环境变量：`cp .env.example .env`
3. 配置 `.env` 文件：
   ```env
   DATABASE_URL="mysql://user:password@host:port/database"
   DEEPSEEK_API_KEY="your-key"
   ZHIPU_API_KEY="your-key"
   ```
4. 同步数据库：`npx prisma db push`
5. 启动开发：`npm run dev` (默认端口 3000)

### 3. 前端配置 (dream-topology-web)
1. 进入目录：`cd dream-topology-web`
2. 安装依赖：`npm install`
3. 启动开发：`npm run dev` (默认端口 5173)

## 📦 部署架构

项目已适配主流云环境部署：
- **数据库**: 采用腾讯云 CynosDB (MySQL) 确保高可用性。
- **后端**: 推荐使用 PM2 守护进程运行在 Node.js 环境下。
- **前端**: `npm run build` 后通过 Nginx 进行静态托管。
- **反向代理**: Nginx 配置 `/api/` 转发至后端服务，并处理跨域与 HTTPS 证书。

## 🤝 贡献与参与

这是一个黑客松项目，旨在探索技术与心理学的边界。欢迎提交 Issue 或 Pull Request 来共同完善这个潜意识实验室！

## 📄 许可证

ISC License
