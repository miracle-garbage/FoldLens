# FoldLens 环境与启动

> 本文记录**本机已验证**的环境、安装步骤、启动命令与排错方式。  
> 新会话先读 `AGENTS.md`；涉及依赖变更时同步更新本文。

- 快照日期：2026-11-04
- 状态：M0 环境验证完成；`frontend/`、`backend/`、`scripts/` 尚未创建

---

## 1. 版本快照

| 组件 | 版本 | 备注 |
|---|---|---|
| OS | Linux Mint 22.3 (Zena) / x86_64 | Ubuntu 24.04 系 |
| Node.js | 26.13.0 | 满足 Vite 8 |
| npm | 11.20.0 | 默认包管理器 |
| pnpm | 12.17.0 | 可选 |
| Python | 3.12.3 | 系统解释器 |
| uv | 0.13.7 | `~/.local/bin/uv`，**未加入 PATH** |
| Git | 2.43.0 | 仓库分支 `master` |
| Chromium | 136.0.7103.25 | Playwright 缓存，供设计检查器使用 |
| Firefox | 系统安装 | 手动预览 |
| Make | 4.3 | 可选 |

### 关键路径

```text
uv:        /home/fox/.local/bin/uv
Chromium:  /home/fox/.cache/ms-playwright/chromium-1169/chrome-linux/chrome
项目根:    /home/fox/Code/projects/fzu/生物信息学and医学人工智能课设项目/FoldLens
```

> 说明：父目录名“生物信息学and医学人工智能课设项目”只是课程项目的总目录；FoldLens 本身是生物信息学课程设计，与医学人工智能无关。
>
> 系统 `python3 -m venv` 与 `pip` 不可用（缺 `ensurepip`）。  
> **不要尝试修复系统 Python；一律使用 uv 创建虚拟环境。**

---

## 2. 安装 uv（已在本机完成）

如需在新机器重装：

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh -s -- --no-modify-path
# 或
UV_NO_MODIFY_PATH=1 curl -LsSf https://astral.sh/uv/install.sh | sh
```

- 安装到 `~/.local/bin/uv`。
- 不修改 `~/.bashrc` / PATH。
- 后续命令用绝对路径 `~/.local/bin/uv`，或在脚本中设置：

  ```bash
  UV_BIN="${UV_BIN:-$HOME/.local/bin/uv}"
  ```

- 如果希望交互式终端直接使用 `uv`，可自行在 `~/.bashrc` 加：

  ```bash
  export PATH="$HOME/.local/bin:$PATH"
  ```

  这是可选项，不属于项目配置。

验证：

```bash
~/.local/bin/uv --version
# uv 0.13.7 (x86_64-unknown-linux-gnu)
```

---

## 3. 首次安装项目依赖（M1 后生效）

### 3.1 后端

`backend/pyproject.toml` 创建后：

```bash
cd backend
~/.local/bin/uv venv .venv --python 3.12
~/.local/bin/uv pip install --python .venv/bin/python -e ".[dev]"
```

预期安装：

- fastapi 0.162.0
- uvicorn[standard] 0.54.0
- biotite 2.0.0
- numpy 2.5.4
- httpx 0.28.1
- python-multipart
- pytest、ruff（dev）

验证：

```bash
.venv/bin/python -c "import biotite, fastapi; print(biotite.__version__, fastapi.__version__)"
.venv/bin/pytest -q
```

### 3.2 前端

```bash
cd frontend
npm install
```

预期核心依赖：

- react / react-dom 19.3.1
- react-router-dom 7.18.5
- 3dmol 2.5.5
- zustand 5.0.16
- i18next + react-i18next 17.1.12
- tailwindcss 4.3.4 + @tailwindcss/vite
- vite 8.3.5 + @vitejs/plugin-react 6.1.2
- typescript 7.0.2
- lucide-react 1.68.0
- @fontsource-variable/fraunces、@fontsource-variable/instrument-sans、@fontsource/ibm-plex-mono

验证：

```bash
npm run build
npm run lint
```

### 3.3 一键安装脚本

M1 会提供 `scripts/setup.sh`，内部使用上述绝对路径，避免 PATH 依赖：

```bash
./scripts/setup.sh
```

---

## 4. 启动

### 4.1 一键启动（推荐）

```bash
./scripts/dev.sh
```

- 前端：<http://localhost:5173>
- 后端：<http://127.0.0.1:8000>
- Vite 将 `/api` 代理到后端。

### 4.2 分别启动

```bash
# 终端 A
cd backend
.venv/bin/uvicorn app.main:app --reload --port 8000

# 终端 B
cd frontend
npm run dev
```

### 4.3 健康检查

```bash
curl http://127.0.0.1:8000/api/health
# {"status":"ok","version":"0.1.0"}
```

---

## 5. 设计检查

设计 skill 的检查器是零依赖脚本，直接通过 CDP 驱动 Chromium：

```bash
export CHROME_PATH="$HOME/.cache/ms-playwright/chromium-1169/chrome-linux/chrome"

# 首页（营销/入口页）
node .claude/skills/design-taste-frontend/scripts/inspect.mjs \
  http://localhost:5173 --out .taste-skill/inspect

# 工作台（应用界面，必须加 --app）
node .claude/skills/design-taste-frontend/scripts/inspect.mjs \
  http://localhost:5173/entry/1CRN --app --out .taste-skill/inspect
```

- 输出：`desktop-fold.jpg`、`tablet-*.jpg`、`mobile-*.jpg`、`report.json`。
- 用 Read 工具逐张查看截图，修复所有 `FAIL`；每个 `WARN` 给出理由。
- 首屏页面还需运行 `lint.mjs`：

  ```bash
  node .claude/skills/design-taste-frontend/scripts/lint.mjs frontend/src
  ```

- Impeccable 引擎已就位：

  ```bash
  .claude/skills/impeccable/scripts/impeccable --version
  # 4.8.0
  ```

> `.taste-skill/` 是检查产物目录，已被 gitignore。

---

## 6. AI 工具链恢复

`.claude/`、`.agents/`、`.codex/`、`.impeccable/` 不入库（约 50MB，含平台二进制）。  
根目录 `skills-lock.json` 记录来源与版本哈希。

本机恢复命令：

```bash
npx skills experimental_install
```

仅查看将要恢复什么：

```bash
npx skills experimental_install --dry-run
```

已安装技能：

- `impeccable` 4.8.0（含 linux-x64 引擎与 hooks）
- `design-taste-frontend`（含 `inspect.mjs` / `lint.mjs` / `assets.mjs`）
- `frontend-design`
- `web-design-guidelines`

设计 hooks 配置在 `.claude/settings.local.json`（不入库），内容为 SessionStart / PostToolUse / Stop 调用 `impeccable hook`。在新机器上如缺失，需要重新生成或从旧机器复制。

**注意**：技能目录被 gitignore 是为了避免 50MB 二进制入库；不要因为“没看到目录”就重复安装。

---

## 7. 网络与镜像

本机实测：

| 源 | 状态 | 耗时 |
|---|---|---|
| `registry.npmjs.org` | 200 | ~6s |
| `registry.npmmirror.com` | 200 | ~0.1s |
| `pypi.org` | 200 | ~12s |
| `pypi.tuna.tsinghua.edu.cn` | 200 | ~6s |
| `files.rcsb.org` | 200 | 3–5s / 68KB |
| `data.rcsb.org` | 200 | ~6s |
| `fonts.googleapis.com` | 200（CSS 端点） | ~4s |

建议：

```bash
# npm 慢时临时使用
npm install --registry=https://registry.npmmirror.com

# uv / pip 慢时临时使用
~/.local/bin/uv pip install --python .venv/bin/python \
  --index-url https://pypi.tuna.tsinghua.edu.cn/simple ...

# RCSB 单次请求超时 15s，重试 1 次
```

**不要**把镜像地址写死进 `package.json`、`pyproject.toml`、`.npmrc` 或 `uv.toml`，以免换网络后失效。

---

## 8. 常见问题

### Q1: `uv: command not found`

用绝对路径：

```bash
~/.local/bin/uv --version
```

或临时：

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### Q2: `python3 -m venv` 报 `ensurepip is not available`

系统缺 `python3.12-venv`，不要用 `apt` 修（需要 sudo）。用：

```bash
~/.local/bin/uv venv .venv --python 3.12
```

### Q3: `pip` 不存在

不需要 pip。所有 Python 包操作用：

```bash
~/.local/bin/uv pip install --python backend/.venv/bin/python <pkg>
```

### Q4: 设计检查器报 “No Chrome/Edge/Chromium found”

设置 `CHROME_PATH`：

```bash
export CHROME_PATH="$HOME/.cache/ms-playwright/chromium-1169/chrome-linux/chrome"
```

若该路径失效，查找：

```bash
find ~/.cache/ms-playwright -maxdepth 3 -name chrome -type f
```

### Q5: 3Dmol 构建警告 direct eval

3Dmol 2.5.5 内部使用 `eval`，Vite/Rolldown 会警告，但构建成功。  
不要为了消除警告去改 `node_modules`；必要时在构建配置中降低日志级别。

### Q6: 首页加载慢 / 包体大

- 确认 3Dmol 是动态 `import()`，不在首页 chunk。
- 确认只打包了拉丁字体；中文使用系统 CJK 字体。
- 检查 `dist/assets` 中 3Dmol chunk 是否独立。

### Q7: 端口被占用

```bash
ss -ltnp | grep -E '5173|8000'
```

关闭占用进程，或临时改端口；不要同时运行两套 dev server。

### Q8: 断网演示

- 6 个样例在 `data/samples/`，缩略图在 `data/thumbnails/`，不依赖网络。
- 其他条目需要先联网缓存到 `.cache/`。
- 演示前跑一次完整流程预热缓存。

---

## 9. 本次环境验证记录（2026-11-04）

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
| Biotite 解析 | 临时 venv + 1CRN.cif | 327 原子 / 46 残基 / 1 链 |
| SSE | `annotate_sse` | `COIL=24, HELIX=18, STRAND=4` |
| 二面角 | `dihedral_backbone` | 46 个残基，φ ∈ [−2.8, 1.9] rad |
| 接触图 | `CellList.create_adjacency_matrix(8.0)` | 203 对（去对角）/ 114 对（`|i−j|≥3`） |
| 前端构建 | Vite 8 + React 19 + 3Dmol 2.5.5 | 通过，3Dmol chunk 约 778KB |
| Tailwind 4 | `@tailwindcss/vite` | 通过 |
| 设计检查器 | 缓存 Chromium + `inspect.mjs` | 输出 1440/768/390 截图 |
| uv | `~/.local/bin/uv --version` | 0.13.7 |

临时验证目录已清理，未写入项目。
