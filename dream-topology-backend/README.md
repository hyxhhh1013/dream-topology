# Dream Topology Backend Architecture (SQLite Demo Version)

## 1. 架构与技术选型深度论述 (本地演示版)

为了方便在本地快速启动并演示「Dream Topology（梦境拓扑）」的核心概念，当前后端数据库已被降级替换为 **SQLite** 方案。
SQLite 是一个轻量级的、基于文件的关系型数据库，非常适合无需额外部署依赖的快速原型验证（MVP）和本地 Demo。

**从 PostgreSQL 降级到 SQLite 带来的变化与妥协：**
1. **移除 `pgvector` 依赖**：SQLite 原生不支持向量扩展。在 Demo 版本中，我们将高维 Embedding 转换为 JSON 字符串存储在 `content_embedding` 字段中。相似度检索（Cosine Similarity）由数据库层的 SQL 计算退化为 **Node.js 内存中的 JS 计算**（见 `src/queries.ts`）。
2. **移除原生 `ENUM` 和 `JSONB`**：SQLite 采用动态类型，不支持原生的 Enum 和 JSONB。所有的 Enum 和复杂 JSON 结构（如 `preferences`，`raw_health_data`）都被转换为标准的 `String` 类型，在应用层进行序列化和反序列化。
3. **移除数据库层的 RLS (行级安全)**：SQLite 不支持高级的 Row-Level Security。在 Demo 阶段，数据隔离需要完全依赖于应用层的代码逻辑控制。

## 2. Prisma Schema 设计
详细的 `schema.prisma` 文件已生成于 `prisma/schema.prisma`。
在 SQLite 版本中：
- `provider` 已更改为 `"sqlite"`，数据库文件保存在本地 `./dev.db`。
- 所有 `@db.Uuid`, `@db.JsonB`, `@db.SmallInt` 等特定于 PostgreSQL 的类型修饰符已被移除。
- `Unsupported("vector(1536)")` 已被替换为 `String?`。

## 3. 高频业务查询代码实现 (内存降级版)
核心查询代码已实现于 `src/queries.ts`，涵盖：
1. **相似梦境向量检索 (内存计算)**：不再使用复杂的 `ORDER BY content_embedding <=> ...` SQL 语句。而是将用户的梦境加载到 Node.js 内存中，使用 JavaScript 实现的 `cosineSimilarity` 函数计算并排序。
2. **拓扑图渲染初始化查询**：保持不变，使用 Prisma 的关联查询完美适配 SQLite。
3. **日历热力图聚合查询 (内存聚合)**：由于 SQLite 不支持 `MODE() WITHIN GROUP`，这部分查询逻辑被重写为先获取时间段内的所有原始数据，然后在 Node.js 中通过 `Map` 和 `Reduce` 手动计算每日的梦境数量、平均心率和主导情绪。

## 4. 如何运行此演示
1. 进入目录：`cd dream-topology-backend`
2. 安装依赖：`npm install`
3. 初始化本地 SQLite 数据库：`npx prisma db push`
4. （此时你将在 `prisma` 文件夹下看到生成的 `dev.db` 文件）
5. 使用 Prisma Studio 查看本地数据：`npx prisma studio`

**注意：** 此 SQLite 方案**仅限本地演示与开发使用**。当项目走向生产环境，面对海量用户的向量检索与高并发写入时，请务必切回之前提供的 PostgreSQL + pgvector 架构。
