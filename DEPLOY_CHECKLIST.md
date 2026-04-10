# Dream Topology 体验版部署清单

## 1. 代码准备
- 把仓库推到 GitHub（或你的 Git 服务）。
- 确认前后端都能本地构建通过：
  - `dream-topology-backend`: `npm run build`
  - `dream-topology-web`: `npm run build`

## 2. 后端环境变量
在 `dream-topology-backend` 目录创建 `.env.production`（可从 `.env.example` 复制）：

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="file:./dev.db"

OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=https://api.deepseek.com/v1

ZHIPU_API_KEY=your_zhipu_key
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4

# 推荐填你前端域名，避免跨域问题
FRONTEND_ORIGIN=https://dream.your-domain.com
# 或者用多域名：
# CORS_ORIGINS=https://dream.your-domain.com,https://www.your-domain.com
```

## 3. 前端环境变量
在 `dream-topology-web` 目录创建 `.env.production`（可从 `.env.example` 复制）：

```env
VITE_API_BASE_URL=https://api-dream.your-domain.com/api
```

## 4. 服务器启动顺序（建议）
1. 启动后端：
   - `cd dream-topology-backend`
   - `npm install`
   - `npm run db:push`
   - `npm run build`
   - `npm run start`
2. 启动前端（静态站）：
   - `cd dream-topology-web`
   - `npm install`
   - `npm run build`
   - 将 `dist` 用 Nginx/静态服务托管

## 5. 必测接口
- `GET /` 返回 `Dream Topology API is running!`
- `GET /api/health/user/stats` 返回 `success: true`
- `POST /api/ai/analyze` 可返回梦境解析 JSON
- `POST /api/tarot/draw` 可返回三张牌解读

## 6. 上线后立即验收
- 前端首页可打开，无跨域报错。
- 输入梦境可生成拓扑解析。
- 洞察页可看到梦境记录。
- 塔罗抽牌可用，分享图可导出。
