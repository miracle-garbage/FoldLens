# FoldLens 开发日志

> 这是跨会话、跨模型的**唯一记忆**。每次工作会话结束前必须追加记录，并更新顶部“当前状态”。  
> 规则见 `AGENTS.md` 第 7 节；只增不改，纠错用新记录。

---

## 当前状态

- **阶段**：M0–M4 完成；标准版功能实现并通过本机验收
- **代码**：`frontend/`、`backend/`、`data/`、`scripts/` 均已建；6 个样例与缩略图入库
- **分支**：`dev` 已合并入 `master`（实现 `6eef7ce`，merge `a7b7078`）
- **最后验证**：2026-11-05（pytest 22、ruff、build、lint、设计检查、浏览器端到端 34/34、离线/i18n/reduced-motion 13/13、键盘/PNG/上传 4/4）
- **最后修复**：2026-11-05 02:10（`dev.sh` 在系统 Node 18 下的启动失败；新增 Node 自动解析）
- **最后文档更正**：2026-11-05（课程归属：本项目为生物信息学课程设计，与医学人工智能无关）
- **下一步**：按 `docs/DEMO.md` 做答辩演示；后续维护从 `master` 开始
- **阻塞**：无
- **待用户决定**：
  - 是否将 `~/.local/bin` 加入 PATH（默认不改）
  - 是否保留本机 statusline 辅助脚本（不影响项目仓库）

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
| 2026-11-05 | Claude Code (deepseek-flash[1m]) | 修复 dev.sh 在系统 Node 18 下的启动失败 | `master`（见最新提交） |
| 2026-11-05 | Claude Code (deepseek-flash[1m]) | 实现标准版 M1–M4，完成本机验收 | `6eef7ce` / merge `a7b7078` |
| 2026-11-05 | Claude Code (deepseek-flash[1m]) | 更正课程归属：纯生物信息学，移除医学 AI 表述 | `93fc80c` |
| 2026-11-04 | Claude Code (deepseek-flash[1m]) | 需求定稿、环境验证、文档体系建立 | `93fc80c` |

---

## 2026-11-05 02:10 · Claude Code (deepseek-flash[1m]) · 修复 dev.sh 的 Node 版本解析

### 目标

用户手动运行 `./scripts/dev.sh` 时报：

```text
import { styleText } from "node:util";
SyntaxError: The requested module 'node:util' does not provide an export named 'styleText'
Node.js v18.19.1
```

### 根因

交互式 shell 的 PATH 先解析到 `/usr/bin/node` v18；工具环境中的 nvm Node 26 未被加载。Vite 8 要求 `^20.19.0 || >=22.12.0`，Node 18 不兼容。

### 修复

- 新增 `scripts/node-env.sh`：按 `FOLDLENS_NODE` → 当前 `node` → nvm/fnm/volta 的顺序寻找兼容版本，并把其 `bin` 放到 PATH 前面；找不到时给出明确错误与要求版本。
- `setup.sh`、`dev.sh`、`design-check.sh` 启动时自动 source；`dev.sh` 会打印实际使用的 Node 版本。
- 新增 `.nvmrc`（`26.13.0`）。
- `docs/ENVIRONMENT.md` 增加 Q0 与路径说明；README 快速开始补充提示。

### 验证

| 验证 | 命令 | 结果 |
|---|---|---|
| 受限 PATH 下解析 | `env PATH="/usr/bin:/bin" bash -c 'source scripts/node-env.sh; node -v'` | `v26.13.0`，npm 11.20.0 |
| 受限 PATH 下启动 | `env PATH="/usr/bin:/bin" ./scripts/dev.sh` | 日志 `Node v26.13.0 — .../v26.13.0/bin/node`；`/api/health` 200，前端 5173 返回 200 |
| 收尾 | 杀进程后检查端口 | 5173/8000 均已关闭 |

### 下一步

由用户手动测试全部功能。

---

## 2026-11-05 01:07 · Claude Code (deepseek-flash[1m]) · 实现标准版 M1–M4

### 目标

按 `docs/PROJECT.md` 的标准版范围完成 FoldLens：脚手架、后端管线、四视图联动、图表、档案、导出、i18n、上传、离线演示与文档验收。

### 完成内容

**后端**

- FastAPI：health / samples / entries / structure / thumbnails / uploads；统一错误封套。
- Biotite 2.0：mmCIF 与 PDB 解析（model 1、作者编号）、P-SEA、φ/ψ、B-factor、Kyte–Doolittle、CA 接触（8 Å、|i−j|≥3）、配体、缺失残基、统计。
- 文件缓存：结构 / 分析结果（含元数据）/ 上传；原子写入；上传 24h 清理。
- 测试：1CRN 计数、SSE、φψ 范围、接触、4HHB 配体、缺失区段、非法 ID、404、缓存命中、缩略图、CIF/PDB 上传、非法格式、超限。

**前端**

- Vite 8 + React 19 + TypeScript 6.0.3 + Tailwind 4；设计 token、中英 i18n、Zustand、AbortController API 层。
- 首页：搜索预检、校验/加载/错误、快捷 chips、6 样例画廊、上传入口、语言切换。
- 工作台：3Dmol 懒加载与五种配色/三种表示/链显隐/点击与 hover/选中高亮、序列、残基卡、Ramachandran、接触图、档案、导出、URL 状态、键盘。
- 每个异步区域实现 loading / empty / error；移动端 390px 无横向溢出。

**数据与脚本**

- 6 个 CIF + 6 张 RCSB 缩略图入库。
- `setup.sh` / `dev.sh` / `fetch-samples.sh` / `design-check.sh`。
- `docs/DEMO.md` 三分钟演示脚本；`docs/screenshots/` 三张实际截图。

### 关键决策

1. **TypeScript 6.0.3**：`typescript-eslint` 8.72 的 peer 范围是 `<6.1.0`，TS 7 无法通过 lint 验收；其余依赖按文档。
2. **设计检查 `--allow`**：通用检查器把 DESIGN.md 明确要求的暖白纸面 + 朱红、等宽数据字体、三套字体、hairline 边框、无视频判为 FAIL。脚本显式列出允许项并注明理由，不静默忽略；首页保留 1 个 `still-page` WARN，因为 DESIGN.md 禁止装饰性连续动画。
3. **元数据 CIF 头优先**，保证 6 个样例完全离线；仅当标题/分辨率缺失且非上传条目时才请求 RCSB data API。
4. **3Dmol 插入码**：实测 `atom.icode` 是 `label_alt_id`，不是 `pdbx_PDB_ins_code`；3D 映射使用 `chain + resId` 回退，URL 仍保留 `ins`。现有样例无插入码。
5. **Grid 最小宽度**：4HHB/6M0J 的长序列把 62/38 网格撑到 2670px，3D 列被压成 2px；给两个网格子项加 `min-w-0` 后修复。此问题已由 4HHB 布局测量和截图确认。
6. **PDB 解析**：Biotite 的 `pdb.get_structure` 不接受 `use_author_fields`；移除该参数后 PDB 上传测试通过。

### 验证

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
| 后端测试 | `backend/.venv/bin/pytest` | 22 passed |
| 后端 lint | `backend/.venv/bin/ruff check .` | All checks passed |
| 前端构建 | `cd frontend && npm run build` | 通过；主包 gzip ≈126 KB，3Dmol chunk gzip ≈164 KB |
| 前端 lint | `cd frontend && npm run lint` | 0 error |
| 生产设计检查 | `./scripts/design-check.sh http://127.0.0.1:4173` | 首页 0 FAIL / 1 WARN；工作台 0 FAIL / 0 WARN |
| 浏览器端到端 | CDP 脚本（搜索/样例/3D/序列/Ramachandran/接触图/URL/导出/上传/4HHB/6M0J/移动端） | 34/34 |
| 离线 + i18n + reduced motion | CDP 脚本，阻断 `*rcsb*` | 13/13；6 个样例全部可开；英文无残留中文；动画时长 1e-05s |
| 键盘 / PNG / 上传标识 | CDP 脚本 | 4/4；Enter 打开 1CRN 151 ms；进入可交互 ≈1.04 s |
| API 实测 | curl `/api/samples`、`/api/entries/1CRN` | 6 样例计数正确；1CRN 46 残基 / 114 接触 / SSE 18-4-24 |
| 截图 | 生产预览 1440/768/390 | 已复制到 `docs/screenshots/` |

### 问题 / 风险

- 插入码结构的 3D 精确映射仍是已知限制；当前 6 个样例不受影响。
- 未收录 >3000 残基的真实结构；降采样与性能提示仅由代码路径保证。
- 4HHB 可交互并已截图，但未做严格 fps 计时。
- 设计检查首页 `still-page` WARN 保留，理由见上；通用规则与 DESIGN.md 的冲突已记录。
- 首次打开非样例条目仍需联网访问 RCSB；样例与缩略图完全离线。

### 下一步

1. 在 `dev` 提交，合并回 `master`。
2. 按 `docs/DEMO.md` 进行三分钟演示彩排。
3. 若课程要求扩展，按 `docs/ROADMAP.md` 的 backlog 先获用户批准。

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
