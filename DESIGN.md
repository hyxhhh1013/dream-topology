## Meta Store Inspired DESIGN.md

本项目 UI 以 Meta Store（硬件零售风格）为参考：摄影/内容优先、二元浅色/深色分区、克制的层级、圆角胶囊 CTA、充足留白、8px 网格节律。

### 1) 氛围与结构
- 视觉主角是内容（梦境文本、符号、拓扑与卡片），UI 只做秩序与引导
- 主要采用浅色干净画布；深色用于“沉浸段落”（例如解析报告/拓扑区域的重点模块）
- 页面以 8px 栅格组织；优先用留白而不是分割线堆叠

### 2) 颜色（角色与用法）
#### 品牌/交互
- Meta Blue: `#0064E0`（主 CTA 背景、关键链接、主交互）
- Hover: `#0143B5`
- Pressed: `#004BB9`
- On dark surfaces（浅蓝 CTA）: `#47A5FA`
- Legacy Facebook Blue（次要强调）: `#1877F2`

#### 画布与分区
- White: `#FFFFFF`（主画布、卡片表面）
- Soft Gray: `#F1F4F7`（次级背景/分区底）
- Warm Gray: `#F7F8FA`（轻卡片底色）
- Web Wash: `#F0F2F5`（弱化背景区域）
- Baby Blue: `#E8F3FF`（信息提示底）
- Near Black: `#1C1E21`（深色沉浸分区底）
- Overlay: `rgba(0,0,0,0.6)`（弹层遮罩）

#### 文本/边框
- Primary text: `#050505`
- Dolly text primary: `#1C2B33`
- Secondary text: `#65676B`
- Divider: `#CED0D4`

#### 语义色
- Success: `#31A24C`
- Error: `#E41E3F`
- Warning: `#F7B928`

### 3) 字体与排版
- 字体优先级：`Optimistic`（若可用）> system-ui
- 标题短、直接；正文以可扫描为先（行高略大，段间距明确）
- 重要信息：用字号/粗细/留白做层级；减少过度渐变与过强阴影

### 4) 组件规范
#### 按钮（Pill）
- Primary: 背景 `#0064E0`，文字白色，完全圆角（pill），padding 10px 22px
- Hover: 背景变深 `#0143B5`
- Pressed: `#004BB9`（可配合轻微缩放）

#### 卡片/面板
- 浅色卡片：白底或 `#F7F8FA`，边框 `#CED0D4` 的低不透明度，阴影克制
- 深色卡片：深底 + 轻边框（白色低不透明度），阴影减少

#### 表单
- 输入框在浅色底用轻边框与淡底色区分；聚焦用蓝色 ring

### 5) 动效
- 动效以“反馈”而不是“装饰”为主：hover/pressed/切换过渡 150–250ms
- 避免大范围持续的背景动画抢注意力
