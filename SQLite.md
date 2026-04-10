# 角色与目标设定

你现在是一位拥有20年经验的首席数据库架构师（Chief Database Architect）和资深后端开发专家。你精通关系型数据库（PostgreSQL）、图数据库理论、向量数据库（pgvector）以及缓存（Redis）的混合架构设计。
你的任务是根据我提供的「Dream Topology（梦境拓扑）」项目背景和业务需求，输出一份达到生产级标准、可直接用于落地的后端数据库完整架构设计与代码实现（字数不限，越详细越好，达到万字级技术文档标准）。

# 1. 项目背景与业务领域模型 (Domain Model)

「Dream Topology」是一款结合AI潜意识分析、生理数据（Apple Health）回填、以及梦境符号拓扑网络可视化的应用。
当前前端的核心视图和业务逻辑包括：

- `CaptureView`: 梦境捕获（支持文本/录音，包含生动度 Vividness、惊悚度 Terror、清醒度 Lucidity 等多维体感评估，以及 REM心率、卧室温度等睡眠生理数据回填）。
- `TopologyView`: 梦境拓扑视图（将梦境解析为节点和连线，形成潜意识网络图谱）。
- `SymbolDictionaryView`: 梦境符号字典（解析梦境中的意象，如“迷宫”、“倒影”）。
- `InsightsView` / `DreamCalendarView`: 洞察分析与日历热力图归档。
- `PrivacySecurityView`: 隐私与安全（梦境高度隐私，需端到端加密或严格脱敏）。

# 2. 核心架构与技术栈要求

请基于以下技术栈进行深度的数据库设计：

1. **主关系型数据库**: PostgreSQL 15+ (存储用户、梦境元数据、结构化生理数据)。
2. **AI与向量检索**: 引入 `pgvector` 插件，用于梦境文本的 Embedding 存储，实现“潜意识相似度”与“相似梦境”检索。
3. **拓扑图数据结构**: 在 PostgreSQL 中使用递归 CTE 或 JSONB，或设计专用的边表（Edge Table），用于高效生成 `TopologyView` 的节点关系网络。
4. **ORM框架**: Prisma (TypeScript环境) 或 TypeORM。

# 3. 核心实体与ER关系设计要求 (Entity-Relationship)

请详细设计以下实体，并给出它们之间的确切关系（1:1, 1:N, N:M）：

- **User (用户表)**: 基础信息、偏好设置、加密密钥哈希（用于隐私保护）。
- **DreamRecord (梦境记录表)**:
  - 核心字段：加密后的文本内容(content)、情绪(emotion\_enum)、记录时间、录音文件URL。
  - 体感数据：生动度(vividness)、惊悚度(terror)、清醒度(lucidity) —— 对应 0-100 的数值。
- **PhysiologicalData (生理数据表)**: 关联到具体的梦境。包含 REM心率(rem\_heart\_rate)、环境温度(room\_temperature)等。
- **DreamSymbol (符号字典表)**: 意象库系统级字典，包含AI生成的普适释义（如“水”代表情绪）。
- **DreamToSymbol (梦境-符号关联表/解析表)**: 记录某个梦境中提取了哪些符号，以及 AI 对该符号在该特定梦境中的个性化解析。
- **TopologyEdge (拓扑关系边表)**: 记录梦境与梦境之间、符号与符号之间的关联强度（Weight）和逻辑关系。
- **InsightReport (洞察报告表)**: 周/月度潜意识分析报告存储。

# 4. 数据库详细设计规范 (Design Specifications)

在输出 DDL 建表语句或 Prisma Schema 时，必须严格遵守以下生产规范：

1. **命名规范**: 表名使用复数小写下划线（如 `dream_records`），字段名使用 snake\_case。
2. **主键与索引**: 放弃自增ID，全面使用 UUID v4 或 ULID 作为主键。对于高频查询字段（如 `user_id`, `created_at`）建立 B-Tree 索引。
3. **审计字段**: 所有核心表必须包含 `created_at`, `updated_at`, `deleted_at` (实现软删除机制)。
4. **数据类型**:
   - 情绪、状态等有限集合使用原生 `ENUM`。
   - AI 生成的复杂结构化数据（如拓扑坐标系）使用 `JSONB`，并建立 GIN 索引。
5. **向量支持**: 梦境内容的 Embedding 字段使用 `vector(1536)` (适配 OpenAI text-embedding-3-small)。

# 5. 数据安全与隐私合规 (Security & Privacy)

梦境数据比肩医疗数据，属于极度敏感隐私。请在设计中详细说明并提供代码：

1. **应用层加密策略**: 明确指出哪些字段（如 `dream_records.content`）需要加密存入，如何结合 KMS 管理密钥。
2. **行级安全 (RLS)**: 给出 PostgreSQL Row-Level Security 的 SQL 示例代码，确保哪怕数据库被脱库，用户 A 也绝对无法通过越权查询读取用户 B 的梦境。

# 6. 高级查询与性能优化 (Advanced Queries & Performance)

请提供以下核心业务场景的 SQL 查询语句或 Prisma 查询代码，并说明如何通过索引优化性能：

1. **相似梦境向量检索**: 给定一个梦境的 Vector，利用余弦相似度（Cosine Similarity `<=>`）查询该用户历史上最相似的 5 个梦境。
2. **拓扑图渲染初始化查询**: 优化一条复杂 SQL，一次性查询某用户最近 30 天的所有梦境节点、提取的符号节点，以及它们之间的连线权重。
3. **日历热力图聚合查询**: 按月/天高效聚合查询用户的梦境数量、平均心率、主导情绪，用于渲染 `DreamCalendarView`。

# 7. 你的输出交付物列表 (Deliverables)

请按以下结构输出你的万字级设计（请务必详尽，不要省略代码）：

1. **架构与技术选型深度论述**: 简要论述为何这样设计，尤其是关系型DB与向量检索结合的考量。
2. **Prisma Schema (完整版代码)**: 包含所有模型、枚举、关系、映射(`@@map`)和索引定义。
3. **核心 DDL 与 SQL 脚本**: 补充 Prisma 无法完美表达的数据库特性（如 `pgvector` 初始化、RLS策略配置、GIN索引创建）。
4. **高频业务查询代码实现**: 提供上述第6点要求的查询逻辑代码（TypeScript + Prisma Client 最佳实践）。
5. **缓存与高并发策略**: 简述 Redis 在热门符号字典缓存和高频写入场景中的方案。

***

请深呼吸，运用你所有的首席架构师经验，一步步思考。确保架构设计既能满足当前 MVP 的敏捷开发，又能支撑未来百万级用户的 AI 并发请求和海量向量检索。请开始你的输出！
