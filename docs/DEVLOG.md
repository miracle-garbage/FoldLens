# FoldLens 开发日志

> 这是跨会话、跨模型的**唯一记忆**。每次工作会话结束前必须追加记录，并更新顶部“当前状态”。  
> 规则见 `AGENTS.md` 第 7 节；只增不改，纠错用新记录。

---

## 当前状态

- **阶段**：M0 已完成（规划 / 文档 / 环境验证）
- **代码**：业务代码尚未开始；`frontend/`、`backend/`、`data/`、`scripts/` 不存在
- **最后验证**：2026-11-04（环境与依赖）
- **最后文档更正**：2026-11-05（课程归属：本项目为生物信息学课程设计，与医学人工智能无关）
- **文档基线提交**：`93fc80c`（`master`）
- **下一步**：等待用户明确说“开始 M1”，然后按 `docs/ROADMAP.md` 的 M1 任务执行
- **阻塞**：无
- **待用户决定**：
  - 是否将 `~/.local/bin` 加入 PATH（默认不改）

---

## 使用规则

1. 每次会话结束**必须**追加一条记录；没有记录视为会话未完成。
2. 记录按时间**倒序**排列，最新在最上面（“当前状态”之后）。
3. 不删除、不改写旧记录；发现错误时追加“更正”记录。
4. “验证”必须写**实际执行过的命令与真实结果**，不能写“应该可以”。
5. 同时更新顶部“当前状态”和 `docs/ROADMAP.md`。
6. 涉及契约、依赖、token、环境变化时，在记录中写明同步了哪个文档。

---

## 会话索引

| 日期 | 模型/工具 | 摘要 | 提交 |
|---|---|---|---|
| 2026-11-05 | Claude Code (deepseek-flash[1m]) | 更正课程归属：纯生物信息学，移除医学 AI 表述 | `93fc80c` |
| 2026-11-04 | Claude Code (deepseek-flash[1m]) | 需求定稿、环境验证、文档体系建立 | `93fc80c` |

---

## 2026-11-05 · Claude Code (deepseek-flash[1m]) · 更正课程归属：纯生物信息学

### 目标

明确 FoldLens 是**生物信息学课程设计**，与医学人工智能无关；医学人工智能属于另一个项目。不写业务代码。

### 完成内容

- `AGENTS.md` / `README.md` / `docs/PROJECT.md` / `PRODUCT.md`：课程名称改为“生物信息学课程设计”
- `PRODUCT.md`：用户描述移除“医学人工智能课程”
- `AGENTS.md` / `CLAUDE.md` / `README.md` / `docs/PROJECT.md` / `PRODUCT.md`：范围与“明确不做”中移除医学 AI 表述；保留“变异致病性预测”作为生物信息学方向的非目标
- `docs/ROADMAP.md`：从扩展 backlog 移除“变异致病性预测面板（医学 AI 加分项）”，并注明医学 AI 属于另一个项目
- `docs/ENVIRONMENT.md`：注明父目录名中的“医学人工智能”只是课程总目录名，与本项目无关
- 本记录：声明 2026-11-04 记录中“医学 AI”相关表述作废
- **提交**：设计文档与本次更正一并提交为 `93fc80c`（`master`）

### 关键决策

- 本项目不包含任何医学 AI 内容。
- 课程归属只写“生物信息学课程设计”。
- 父目录名称不改；它是文件系统路径，不是项目描述。

### 验证

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
| 课程描述 | `grep -rn "医学人工智能" --include='*.md' .` | 仅剩“无关”说明、真实父目录路径与历史记录 |
| 范围描述 | `grep -rn "医学 AI" --include='*.md' .` | 仅剩“不包含医学 AI”说明与 2026-11-04 历史记录 |
| 链接 | Markdown 相对链接检查 | 0 broken |

### 问题 / 风险

- 2026-11-04 的历史记录中仍保留“医学 AI”字样；按“只增不改”规则不删除，由本记录声明作废。
- 2026-11-04 记录中的“尚未 git commit”为当时状态；文档基线现已提交为 `93fc80c`。

### 下一步

文档已提交为基线版本；等待用户在新窗口说“开始 M1”。

---

## 2026-11-04 · Claude Code (deepseek-flash[1m]) · 建立项目设计与长期开发文档

### 目标

把此前的需求讨论固化为可执行的项目总设计，并建立跨 AI 会话、跨对话窗口的接续开发机制；不写业务代码。

### 完成内容

**需求定稿**

- 项目：FoldLens（蛋白质结构探索器）
- 范围：标准版（3D + 序列 + Ramachandran + 接触图 + 档案 + 导出 + i18n）
- 视觉：暖白纸面 + 深色 3D 观察窗
- 语言：中英切换，默认中文，专业术语保留英文
- 技术栈：React 19 + TS 7 + Vite 8；FastAPI 0.162 + Biotite 2.0；本地 localhost
- 明确不做：配体口袋、表面渲染、结构对比、医学 AI、账户、部署

**新增文档**

- `README.md` — 人类入口与快速开始
- `AGENTS.md` — AI 接续总则（第一入口）
- `CLAUDE.md` — Claude Code 薄入口
- `PRODUCT.md` — 产品事实（Impeccable schema）
- `DESIGN.md` — 设计 token 与视觉规范（Seed v0.1）
- `docs/PROJECT.md` — 项目总设计与验收标准
- `docs/ARCHITECTURE.md` — 架构、API 契约、数据模型、算法
- `docs/CONVENTIONS.md` — 代码 / i18n / Git / 测试统一规约
- `docs/ENVIRONMENT.md` — 环境、安装、启动、排错
- `docs/ROADMAP.md` — M0–M4 任务清单
- `docs/DEVLOG.md` — 本文件
- `.gitignore` — 忽略依赖、构建、缓存、本地工具链
- `.editorconfig` — 编码 / 换行 / 缩进统一

**环境处理**

- 系统缺 `pip` / `ensurepip`，`python3 -m venv` 不可用
- 安装 uv 0.13.7 到 `~/.local/bin`，未改 shell 配置
- 用临时 venv 验证后端依赖，验证后已删除临时目录
- 未创建项目级 `backend/.venv`、`node_modules`（按“先别动手”要求）

### 关键决策

1. **文档分层**：`AGENTS.md` 管流程；`PRODUCT.md` 管产品事实；`docs/PROJECT.md` 管范围；`docs/ARCHITECTURE.md` 管契约；`DESIGN.md` 管视觉；`docs/CONVENTIONS.md` 管风格。
2. **API 拆分**：分析 JSON 与原始 CIF 文本分开返回，避免大 JSON 阻塞首屏。
3. **选中状态唯一源**：Zustand 的 `selection`，同步到 URL；四个视图只读。
4. **3Dmol 懒加载**：约 778KB，不进首页 chunk。
5. **Biotite 2.0 实测 API**：`CIFFile`、`annotate_sse` 整数映射、`CellList.create_adjacency_matrix`。
6. **设计工具链不入库**：`.claude/` 等约 50MB；用 `skills-lock.json` + `npx skills experimental_install` 恢复。
7. **中文字体策略**：使用系统 Noto CJK，避免打包 83MB 的 Noto Serif SC。

### 验证

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
| Node / npm | `node -v` / `npm -v` | 26.13.0 / 11.20.0 |
| Python | `python3 --version` | 3.12.3 |
| uv | `~/.local/bin/uv --version` | 0.13.7 |
| 网络 | curl npm / PyPI / RCSB | 均 200 |
| Biotite 解析 1CRN | 临时 venv 脚本 | 327 原子 / 46 残基 / 1 链 |
| SSE | `annotate_sse` | COIL 24 / HELIX 18 / STRAND 4 |
| 二面角 | `dihedral_backbone` | 46 个值，φ ∈ [−2.8, 1.9] rad |
| 接触矩阵 | `create_adjacency_matrix(8.0)` | 203 对（去对角）/ 114 对（`|i−j|≥3`） |
| 前端构建 | Vite 8 + React 19 + 3Dmol 2.5.5 | 通过，3Dmol chunk ≈ 778KB |
| Tailwind 4 | `@tailwindcss/vite` | 通过 |
| 设计检查器 | 缓存 Chromium + `inspect.mjs` | 1440/768/390 截图成功 |
| 缩略图 | RCSB CDN 6 个 ID | 全部 200，26–86KB |

临时验证目录（`/tmp/fl-*`）已清理。

### 问题 / 风险

- 系统 Python 缺 pip/ensurepip：已用 uv 绕过，不影响项目。
- `.claude/` 与 `.agents/` 各约 24–26MB，已 gitignore；换机器需按 `docs/ENVIRONMENT.md` 恢复。
- 尚未 git commit；等待用户决定。
- 3Dmol 的插入码映射是 M1 的首要技术验证点（4HHB / 6M0J）。

### 下一步

1. 用户确认文档后，明确说“开始 M1”。
2. 按 `docs/ROADMAP.md` M1 执行：脚手架 → 样例下载 → 后端管线 → 1CRN 端到端 → 首页。
3. M1 第一天优先验证 3Dmol 点击回调与残基映射。

---

## 记录模板（复制使用）

```markdown
## YYYY-MM-DD HH:MM · <模型/工具名> · <一句话目标>

### 目标

### 完成内容

### 关键决策

### 验证

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
|  |  |  |

### 问题 / 风险

### 下一步
```
