# 梦境拓扑 (Dream Topology)

这是一个用于捕获、分析和可视化梦境的 Web 应用程序。它通过语音或文本记录梦境，利用 AI 提取梦境中的符号和情绪，并生成潜意识的拓扑图，帮助用户更好地理解自己的潜意识。

## 🌟 核心功能

- **多模态捕获**: 支持语音和文本两种方式记录梦境。
- **AI 梦境解析**: 利用大语言模型分析梦境，提取核心符号、情绪、心理原型（如“阿尼玛”、“阴影”），并提供专业的心理学解释和行动建议。
- **动态拓扑图**: 将梦境元素可视化为美观的拓扑图，展示符号之间的关联。
- **潜意识词典**: 记录并统计用户梦境中出现的高频符号，形成个性化的潜意识词典。
- **响应式设计**: 适配移动端和桌面端，提供流畅的跨设备体验（采用 Apple 风格的毛玻璃和动态光晕设计）。

## 🏗️ 技术栈

### 前端 (Web)
- **框架**: React 19, Vite
- **样式**: Tailwind CSS 4, Framer Motion (用于丝滑的动画)
- **图标**: Lucide React
- **语言**: TypeScript

### 后端 (API)
- **框架**: Hono (轻量级、高性能的 Web 框架)
- **运行环境**: Node.js
- **数据库**: SQLite + Prisma ORM
- **AI 集成**: OpenAI API (用于文本分析和符号提取)
- **语言**: TypeScript

## 🚀 本地运行指南

### 前提条件
- Node.js (推荐 v18 或 v20)
- npm 或 yarn
- 一个有效的 OpenAI API Key（或其他兼容格式的 LLM API Key）

### 1. 克隆项目
```bash
git clone <repository-url>
cd 黑客松
```

### 2. 启动后端服务
```bash
cd dream-topology-backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 OPENAI_API_KEY
# 例如：OPENAI_API_KEY="sk-xxxx"
# 如果使用代理或自定义模型，可以修改 OPENAI_BASE_URL 和 OPENAI_MODEL

# 初始化数据库结构
npm run db:push

# 启动开发服务器 (运行在 http://localhost:3000)
npm run dev
```

### 3. 启动前端服务
打开一个新的终端窗口：
```bash
cd dream-topology-web

# 安装依赖
npm install

# 启动开发服务器 (运行在 http://localhost:5173)
npm run dev
```

现在，你可以在浏览器中访问 `http://localhost:5173` 来体验应用。

## 📦 部署到云服务器

由于之前尝试通过 SSH 自动化部署失败（认证问题），以下是手动的部署步骤。你可以将打包好的文件通过 FTP/SFTP（如 FileZilla、WinSCP）上传到服务器。

### 1. 准备部署文件

我已经为你准备了打包脚本，你可以直接在本地运行以生成部署包。

**打包前端：**
前端代码已经通过 `npm run build` 编译在 `dream-topology-web/dist` 目录下。

**打包后端：**
（如果你在 Windows 上，可以使用我之前写的脚本）
```bash
cd D:\project\黑客松
node zip-backend.js
```
这会在根目录生成一个 `backend.zip` 文件（排除了 `node_modules` 和本地数据库）。

### 2. 在服务器上配置环境 (Ubuntu 示例)

SSH 登录到你的服务器（42.194.162.51），执行以下命令：

```bash
# 更新系统并安装 Nginx 和 Node.js
sudo apt update
sudo apt install nginx -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2 用于守护后端进程
sudo npm install pm2 -g
```

### 3. 部署后端

1. 将 `backend.zip` 上传到服务器的 `/var/www/dream-topology-backend` 目录并解压。
2. 在服务器上进入该目录：
   ```bash
   cd /var/www/dream-topology-backend
   npm install
   
   # 创建并配置 .env 文件
   nano .env # 填入 DATABASE_URL="file:./prisma/dev.db" 和 OPENAI_API_KEY
   
   # 初始化数据库和构建
   npx prisma db push
   npm run build
   
   # 使用 PM2 启动
   pm2 start dist/index.js --name "dream-api"
   pm2 save
   ```

### 4. 部署前端

前端代码的 API 请求地址已经配置为 `http://42.194.162.51:3000/api`。

1. 将前端打包好的 `dream-topology-web/dist` 文件夹内的所有内容上传到服务器的 `/var/www/html/dream-topology` 目录下。
2. 配置 Nginx 代理：
   ```bash
   sudo nano /etc/nginx/sites-available/dream-topology
   ```
   写入以下配置：
   ```nginx
   server {
       listen 80;
       server_name 42.194.162.51; # 你的服务器 IP

       location / {
           root /var/www/html/dream-topology;
           index index.html;
           try_files $uri $uri/ /index.html; 
       }

       location /api/ {
           proxy_pass http://127.0.0.1:3000/; 
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. 启用 Nginx 配置并重启：
   ```bash
   sudo ln -s /etc/nginx/sites-available/dream-topology /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

现在，你可以通过浏览器访问 `http://42.194.162.51` 来使用线上版本的应用了！

## 🤝 贡献与参与

这是一个黑客松项目，欢迎提出 Issue 和 Pull Request 来帮助我们完善功能！

## 📄 许可证

ISC License
