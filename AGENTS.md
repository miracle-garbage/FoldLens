# AGENTS.md — FoldLens 接续开发总则

> 本文件是任何 AI 模型、任何对话窗口接手本项目时的**第一入口**。
> 不要依赖上一个会话的记忆；以仓库中的文档、代码、开发日志和 git 历史为准。

---

## 0. 项目一句话

**FoldLens（蛋白质结构探索器）**：本地运行的 Web 工具。输入 PDB ID 或上传结构文件，在 3D 结构、序列、Ramachandran 图、残基接触图之间联动选中同一个残基。React + TypeScript + Vite 前端，FastAPI + Biotite 本地后端。

课程：生物信息学课程设计（本项目与医学人工智能无关）。范围：**标准版**（见 `docs/PROJECT.md`）。

---

## 1. 新会话开场顺序（必须按序）

```bash
# 1) 读过程与规则
cat AGENTS.md

# 2) 读产品与范围
cat PRODUCT.md
cat docs/PROJECT.md

# 3) 读当前进度
cat docs/ROADMAP.md
sed -n '1,160p' docs/DEVLOG.md          # 当前状态 + 最近 2 条记录

# 4) 核对工作区
git status
git log --oneline -5
```

完成以上步骤后，用 3–5 行向用户复述：当前阶段、上次做到哪、下一步是什么、有无阻塞。**不要直接开始写代码。**

---

## 2. 当前状态快照

- 日期：2026-11-04
- 阶段：**M0 已完成**（规划、文档、环境验证）；**业务代码尚未开始**。
- 已确认：范围=标准版；视觉=暖白纸面 + 深色观察窗；语言=中英切换（默认中文）；技术栈见上。
- 下一步：等待用户明确说“开始 M1”后，初始化 `frontend/`、`backend/`、`data/`、`scripts/`。
- 权威进度以 `docs/ROADMAP.md` 和 `docs/DEVLOG.md` 为准；本节只是快照，若与二者冲突，以二者为准。

---

## 3. 不可协商的约束

1. **范围锁定为标准版。** 配体口袋、表面渲染、结构对比等未列在标准版中的功能都属于未批准的扩展，不得擅自实现。
2. **纯本地。** 不部署公网、不做鉴权、不接数据库、不引入云服务。
3. **离线可演示。** 6 个样例结构必须随项目打包；断网时仍能完成全部核心交互。
4. **数据诚实。** 只展示算法真实算出的值；近似值必须标注；不得编造统计、用户评价或科研结论。
5. **所有 UI 文案走 i18n。** 组件内不得写死中文或英文句子；术语在两种语言中都保留英文。
6. **颜色只用 token。** 组件中不得出现未登记的十六进制颜色；3D 结构配色集中在 `features/structure/colors.ts`。
7. **每个异步区域必须有加载 / 空 / 错误三态。**
8. **不擅自扩大依赖。** 新增运行时依赖前必须向用户说明理由并获同意，然后更新 `docs/ENVIRONMENT.md`。
9. **不擅自提交 git。** 只有用户明确要求时才 commit；不 force push，不改写历史。
10. **不删除或重写历史开发日志。** 纠错通过追加新记录完成。

---

## 4. 环境事实（本机，2026-11-04 实测）

| 项 | 值 |
|---|---|
| Node.js | 26.13.0 |
| npm / pnpm | 11.20.0 / 12.17.0（默认 npm） |
| Python | 3.12.3 |
| uv | 0.13.7，位于 `~/.local/bin/uv`，**未加入 PATH** |
| Git | 2.43.0，分支 `master` |
| Chromium | 136.0.7103.25，位于 `~/.cache/ms-playwright/chromium-1169/chrome-linux/chrome` |
| 设计检查器 | `.claude/skills/design-taste-frontend/scripts/inspect.mjs` |
| Impeccable | 4.8.0，二进制已就位 |

**已知环境坑**

- 系统 `python3 -m venv` / `pip` 不可用（缺 ensurepip）。**一律使用 `~/.local/bin/uv`**。
- npm 官方源较慢；需要时临时加 `--registry=https://registry.npmmirror.com`，不要写死进项目配置。
- PyPI 官方源较慢；需要时临时加 `--index-url https://pypi.tuna.tsinghua.edu.cn/simple`，不要写死。
- `.claude/`、`.agents/`、`.codex/`、`.impeccable/` 已被 gitignore（约 50MB 本地工具）；版本清单在 `skills-lock.json`。恢复方式见 `docs/ENVIRONMENT.md`。

详细安装、启动、排错见 **`docs/ENVIRONMENT.md`**。

---

## 5. 常用命令（M1 脚手架完成后生效）

```bash
# 一次性安装
./scripts/setup.sh

# 同时启动前后端（推荐）
./scripts/dev.sh

# 分别启动
cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev            # http://localhost:5173

# 前端检查
cd frontend && npm run build
cd frontend && npm run lint

# 后端检查
cd backend && .venv/bin/pytest
cd backend && .venv/bin/ruff check .

# 设计检查（app 模式，三档宽度）
CHROME_PATH="$HOME/.cache/ms-playwright/chromium-1169/chrome-linux/chrome" \
  node .claude/skills/design-taste-frontend/scripts/inspect.mjs \
  http://localhost:5173 --app --out .taste-skill/inspect
```

> 在 M1 完成前，上述命令中的 `frontend/`、`backend/`、`scripts/` 尚不存在。

---

## 6. 工作流程

### 开始一个任务前

1. 确认任务属于当前里程碑，且在 `docs/ROADMAP.md` 中有对应条目；没有就先补条目或询问用户。
2. 涉及 UI 时，先调用 `impeccable` skill，按它的要求运行 `context` 并阅读 `craft-floor.md`。
3. 涉及 API 时，先读 `docs/ARCHITECTURE.md` 的契约，不要临时发明字段。
4. 涉及数据结构时，先确认 Biotite 2.0 的实际 API（本机已验证的版本），不要照抄旧版 Biotite 文档。

### 实现时

- 小步提交式推进：一个可验证的功能点完成后再做下一个。
- 先让后端返回真实数据，再接前端；不要用假数据把界面“撑起来”后忘记替换。
- 前端每个异步视图同时实现 loading / empty / error。
- 每加一个 UI 文案，同时补 `zh` 与 `en`。
- 每加一个颜色，先加到 `DESIGN.md` 的 token 或 `features/structure/colors.ts`，再使用。

### 结束一个任务前

1. 跑对应的验证命令（build / lint / pytest / 设计检查），把**实际输出**写进开发日志。
2. 更新 `docs/ROADMAP.md` 的勾选状态与“当前焦点”。
3. 在 `docs/DEVLOG.md` 追加一条记录（见下）。
4. 若改变了架构、契约、依赖或设计 token，同步更新对应文档。

---

## 7. 开发日志（强制）

**文件**：`docs/DEVLOG.md`

**规则**

- 每次工作会话结束前**必须**追加一条记录；没有记录视为会话未完成。
- 记录**只增不改**；发现旧记录有误，追加一条“更正”记录，不删除原文。
- 同时更新文件顶部的 `## 当前状态`：阶段、最后验证时间、下一件事。
- 记录中的“验证”必须写命令与真实结果，不能写“应该没问题”。

**模板**

```markdown
### YYYY-MM-DD HH:MM · <模型/工具名> · <一句话目标>

- 目标：
- 改动文件：
- 关键决策：
- 验证：
  - `命令` → 结果
- 问题 / 风险：
- 下一步：
```

---

## 8. 会话交接清单

结束前逐项确认：

- [ ] `git status` 中没有意外文件；该忽略的已忽略
- [ ] 代码可构建 / 可运行（或明确记录未完成）
- [ ] `docs/ROADMAP.md` 状态已更新
- [ ] `docs/DEVLOG.md` 已追加本次记录
- [ ] 新增依赖、契约、token、环境变化已同步到对应文档
- [ ] 下一步足够具体，新的 AI 不需要读本次对话也能继续

---

## 9. 文件地图

| 路径 | 作用 | 是否入库 |
|---|---|---|
| `AGENTS.md` | AI 接续总则（本文件） | ✅ |
| `CLAUDE.md` | Claude Code 的薄入口，指向本文件 | ✅ |
| `PRODUCT.md` | 产品事实、用户、范围、原则 | ✅ |
| `DESIGN.md` | 设计 token 与视觉规范 | ✅ |
| `docs/PROJECT.md` | 项目总设计（功能、交互、验收） | ✅ |
| `docs/ARCHITECTURE.md` | 架构、API 契约、数据模型、算法 | ✅ |
| `docs/CONVENTIONS.md` | 代码、命名、i18n、Git 统一规约 | ✅ |
| `docs/ENVIRONMENT.md` | 环境、安装、启动、排错 | ✅ |
| `docs/ROADMAP.md` | 里程碑与任务清单 | ✅ |
| `docs/DEVLOG.md` | 开发日志与当前状态 | ✅ |
| `frontend/` | React 应用 | ✅（`node_modules` 除外） |
| `backend/` | FastAPI 服务 | ✅（`.venv` 除外） |
| `data/samples/` | 6 个内置 mmCIF | ✅ |
| `data/thumbnails/` | 6 张样例缩略图 | ✅ |
| `.cache/` | 运行时下载缓存 | ❌ |
| `.claude/` 等 | 本地 AI 工具链 | ❌（见 `skills-lock.json`） |

---

## 10. UI / 设计工作流

1. 调用 `impeccable` skill（本项目已安装 4.8.0 与 hooks）。
2. 先读 `PRODUCT.md`、`DESIGN.md`，再读 `docs/PROJECT.md` 的交互规格。
3. 任何 UI 编辑前，按 skill 要求读 `reference/craft-floor.md`。
4. 构建后用设计检查器在 1440 / 768 / 390 三档截图；app 页面加 `--app`。
5. 打开截图逐张检查，不只看代码；修复所有 `FAIL`，对每个 `WARN` 给出理由。
6. 设计 token 有变化时，同步更新 `DESIGN.md`。

**视觉底线**：暖白纸面 + 深色观察窗；朱红只做强调；无渐变、无玻璃、无 emoji 图标、无通用 SaaS 仪表盘。

---

## 11. 测试与验收

- **后端**：`pytest`。至少覆盖：1CRN 解析计数、SSE 映射、φ/ψ 范围、接触对、非法 PDB ID、缓存命中、上传格式错误。
- **前端**：`npm run build` + `npm run lint` 必须通过；核心交互用手动清单验证。
- **视觉**：设计检查器无 `FAIL`；对比度 AA；`prefers-reduced-motion` 生效。
- **端到端手动清单**：首页搜索 → 打开 1CRN → 点击残基 → 四视图同步 → 切换配色 → 切英文 → 复制链接 → 刷新恢复状态 → 导出。
- 具体验收标准见 `docs/PROJECT.md` 第 12 节与 `docs/ROADMAP.md`。

---

## 12. 禁止事项

- 禁止把示例数据硬编码进组件来“演示通过”。
- 禁止在前端直接请求 RCSB（必须经本地后端，便于缓存与离线）。
- 禁止使用 `any` 绕过类型检查；确需边界断言时写注释说明。
- 禁止未经批准新增页面、路由、功能模块或第三方 UI 框架。
- 禁止提交 `.env`、缓存、`node_modules`、`.venv`、设计检查截图。
- 禁止在未运行验证的情况下宣称“完成”。
- 禁止删除 `docs/DEVLOG.md` 的历史条目。

---

## 13. 不确定时怎么办

1. 先查文档：`PRODUCT.md` → `docs/PROJECT.md` → `docs/ARCHITECTURE.md` → `docs/CONVENTIONS.md`。
2. 文档没有答案时，**停下来问用户**，并在开发日志记录“待决问题”。
3. 不要用一个看似合理的默认值悄悄替用户做产品决策。
4. 文档之间冲突时，优先级：**用户当前指令 > AGENTS.md（流程） > PRODUCT.md（产品事实） > docs/PROJECT.md（范围） > docs/ARCHITECTURE.md（技术契约） > DESIGN.md（视觉） > docs/CONVENTIONS.md（风格） > ROADMAP/DEVLOG（状态）**。冲突必须记录并请用户裁决。
