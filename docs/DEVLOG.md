# FoldLens 开发日志

> 这是跨会话、跨模型的**唯一记忆**。每次工作会话结束前必须追加记录，并更新顶部“当前状态”。  
> 规则见 `AGENTS.md` 第 7 节；只增不改，纠错用新记录。

---

## 当前状态

- **阶段**：M0–M4 完成；T1/T2/T3/EX1/EX2 已合并；发布 `beta`；结构渲染 A+B 与 VIS-A 已合并；**Mol* 5.13.1 已正式替换 3Dmol，功能/性能验收通过，待提交/合并**
- **发布标签**：`beta`（测试完善后的可演示版本；`alpha` 保留）
- **代码**：`frontend/`、`backend/`、`data/`、`scripts/` 均已建；6 个样例与缩略图入库
- **分支**：`dev` 已含 T1（merge `dd8ab88`）、EX1（merge `a80fb22`）、T2（merge `3280875`）、EX2（merge `9876074`）、T3（merge `3473fd8`）、结构渲染 A+B（merge `4a0b891`）与画质实验（merge `69df771`）；`master` 停在 `beta`（`4f1a8e9`），`dev` 领先；`feat/molstar-renderer` 基于 `dev`，未提交、未合并
- **最后验证**：2026-11-17（Mol* 正式替换：typecheck/lint/build/pytest/设计检查/24 URL 矩阵/交互/链显隐/PNG/上传 PDB/离线；生产预览 1CRN≈2.44s、1L2Y≈2.65s、6M0J≈4.49s、4HHB≈5.31s）
- **最后修复**：2026-11-06（T3：Windows 未自动打开浏览器；T2：密集结构穿模；T1：返回按钮偶发卡死/白屏）
- **最后新增**：2026-11-17（Mol* 5.13.1 正式渲染引擎；移除 3Dmol；pooled component + Transparency 链显隐 + 首帧优先；Transparency bundle union 修复）
- **下一步**：用户在真实浏览器复核 Mol* 观感与流畅度；确认后 commit 并合并回 `dev`。若继续优化，优先处理 Mol* chunk 体积与 Vite CommonJS 兼容层
- **平台验证**：Linux 自动化验证通过；Windows 自动打开已由用户实机确认（2026-11-06）；Mol* 渲染路径尚未在 Windows 验证
- **阻塞**：无
- **待用户决定**：
  - 是否 commit 并合并 `feat/molstar-renderer` 回 `dev`
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
| 2026-11-17 | Claude Code (deepseek-flash[1m]) | Mol* 正式替换 3Dmol + 冷启动/链显隐优化 | 未提交（`feat/molstar-renderer`） |
| 2026-11-17 | Claude Code (deepseek-flash[1m]) | Mol* 渲染引擎 spike（方案 B） | 未提交（`spike/molstar-renderer`） |
| 2026-11-16 | Claude Code (deepseek-flash[1m]) | 结构渲染画质实验：3Dmol AO / outline / quality | merge `69df771` |
| 2026-11-16 | Claude Code (deepseek-flash[1m]) | 结构渲染 A+B：选中 overlay 与首屏单次构建 | `d4f9437` / merge `4a0b891` |
| 2026-11-06 | Claude Code (deepseek-flash[1m]) | T3：修复 Windows 未自动打开浏览器 | `0f378f2` / merge `3473fd8` |
| 2026-11-06 | Claude Code (deepseek-flash[1m]) | EX2：跨平台启动器与自动打开浏览器 | `9786283` / merge `9876074` |
| 2026-11-06 | Claude Code (deepseek-flash[1m]) | T2：缩小 3D 模型单位，减轻穿模 | `ba82bb0` / merge `3280875` |
| 2026-11-06 | Claude Code (deepseek-flash[1m]) | EX1：补全残基位置与电荷配色 | `0e2e599` / merge `a80fb22` |
| 2026-11-06 | Claude Code (deepseek-flash[1m]) | T1：修复返回按钮偶发卡死/白屏 | `ee1be9c` + `eac8a28` / merge `dd8ab88` |
| 2026-11-05 | Claude Code (deepseek-flash[1m]) | 修复 dev.sh 在系统 Node 18 下的启动失败 | `master`（见最新提交） |
| 2026-11-05 | Claude Code (deepseek-flash[1m]) | 实现标准版 M1–M4，完成本机验收 | `6eef7ce` / merge `a7b7078` |
| 2026-11-05 | Claude Code (deepseek-flash[1m]) | 更正课程归属：纯生物信息学，移除医学 AI 表述 | `93fc80c` |
| 2026-11-04 | Claude Code (deepseek-flash[1m]) | 需求定稿、环境验证、文档体系建立 | `93fc80c` |

---

## 2026-11-17 · Claude Code (deepseek-flash[1m]) · Mol* 正式替换 3Dmol 与性能优化

### 目标

用户确认“效果还行”后，把 Mol* 从 spike 提升为唯一渲染引擎，移除 3Dmol 双路径，并解决 4HHB 冷启动与链显隐卡顿。

### 最终架构

- 分支：`feat/molstar-renderer`（由 `spike/molstar-renderer` 重命名，未提交）。
- 生产路径只使用 Mol* 5.13.1；`3dmol` 依赖、旧 `style.ts`、`?renderer=molstar` flag 已删除。
- `StructureView.tsx` 直接基于 `PluginContext` + `DefaultPluginSpec` + `Canvas3D`，由 React 外壳负责 UI/i18n/三态/导出。
- **一个 polymer component + 一个 ligand component**：不再按链拆组件；按链拆会让 4HHB 冷启动明显变慢。
- **链显隐用 Transparency layer**：对 polymer/ligand representation 应用 `TransparencyStructureRepresentation3DFromBundle`（value 1），隐藏链不重建几何；点击/hover 通过 `hiddenChainsRef` 过滤隐藏链。
- **首帧优先**：先添加 polymer representation 并结束 loading，再异步添加 ligand representation；ligand 的 ball-and-stick 几何/着色器编译不再阻塞首帧。
- 选中仍使用独立 selection component + accent stick + label；选中变化不触碰 polymer/ligand。
- 相机在组件创建后、representation 之前用 `StructureElement.Loci.all(structure)` 对整结构取景。
- 保留 Vite CommonJS alias（Mol* ESM 命名空间循环依赖）；在 `vite.config.ts` 中注明升级 Mol* 时重新验证。
- Mol* 内置 UI、MVS、视频导出均未引入。

### 改动文件

- `frontend/src/features/structure/StructureView.tsx`：Mol* 视图、组件/representation/Transparency/选中/交互/三态。
- `frontend/src/features/structure/molstar-color-theme.ts`：七种配色的自定义 ColorTheme；颜色上下文从旧 `style.ts` 迁入。
- `frontend/src/features/structure/molstar-style.ts`：viewer 选项、representation 参数、chain/ligand/residue 表达式、hidden-chain bundle、loci 映射。
- `frontend/src/features/workspace/WorkspaceContent.tsx`：移除 3Dmol/`?renderer` 分支，懒加载 `StructureView`，PNG 走统一导出句柄。
- `frontend/package.json` / `package-lock.json`：移除 `3dmol`，保留 `molstar@5.13.1`。
- `frontend/vite.config.ts`：CommonJS alias 注释改为正式兼容层说明。
- 删除 `frontend/src/features/structure/style.ts`。
- 文档：`PRODUCT.md`、`README.md`、`docs/PROJECT.md`、`docs/ARCHITECTURE.md`、`docs/ENVIRONMENT.md`、`docs/ROADMAP.md`、本文件。

### 验证

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
| 前端类型检查 | `npm run typecheck` | 通过 |
| 前端 lint | `npm run lint` | 通过 |
| 前端构建 | `npm run build` | built in 2.05s；主包 398.57 kB / 125.47 kB gzip；`StructureView` 3,788.82 kB / 986.53 kB gzip；**无 3Dmol chunk，无 3Dmol direct-eval 警告** |
| 后端测试 | `backend/.venv/bin/pytest -q` | 22 passed（既有 httpx 弃用 warning） |
| 设计检查（生产预览） | `./scripts/design-check.sh` | 首页 0 FAIL / 1 已知 `still-page` WARN；工作台 0 FAIL / 0 WARN |
| 冷启动（无头 Chromium + SwiftShader，生产预览） | route mount → canvas 就绪 | 1CRN ≈2.44s；1L2Y ≈2.65s；6M0J ≈4.49s；4HHB ≈5.31s |
| 链显隐延迟（4HHB） | 取消/恢复链 A | 隐藏约 45ms，恢复约 5ms；不重建几何 |
| 功能矩阵 | 1CRN × 7 配色 × 3 表示 + 4HHB/6M0J/1L2Y | 24 个 URL 全部成功，0 未捕获异常 / 0 console error |
| 交互 | 点击 / hover / 背景清空 / 序列点击 / URL 恢复 | 残基卡、序列、Ramachandran、3D overlay 同步 |
| 导航 | 返回首页 → 浏览器后退 | 条目、选中、scheme/repr 恢复；0 异常 |
| PNG | UI 点击“PNG 截图” | 生成 166,782 字符 PNG data URI；Toast 正常 |
| 上传 PDB | 上传由 1CRN 转出的 PDB | 进入 `upload-*` 工作台，Mol* 正常渲染 |
| 离线 | CDP Network 收集 | 仅 `127.0.0.1:4173/8000`，无外部 CDN/字体/worker |
| 响应式 | 390 / 768 / 1440 | 3D 视图按容器 resize；上下堆叠正常 |
| 1L2Y 多 model | 打开 1L2Y | 只显示 model 1 |

### 问题 / 风险

- **Vite CommonJS alias**：Mol* 5.13 ESM 在 Vite 8 预打包下会触发 `BuiltInPluginBehaviors` 命名空间未初始化；当前 alias 是正式兼容层，升级 Mol* 时必须重新验证。
- **Mol* chunk 较大**：约 986KB gzip，首页不受影响；工作台冷启动需下载/解析该 chunk。
- **隐藏链仍在几何中**：Transparency 只让链不可见，点击/hover 已在应用层过滤；如果未来需要释放内存或彻底移出 picking，仍需 per-chain component 或重建方案。
- **插入码未单独验证**：Mol* 已暴露 `pdbx_PDB_ins_code`，6 个样例无插入码；新增插入码样例时需补测。
- **真实 GPU 帧率未计量**：冷启动/链显隐数据来自无头 Chromium + SwiftShader；真实集成显卡的旋转帧率需用户实机体验。
- **Windows 未验证**：Mol* 渲染路径尚未在 Windows 实机运行。
- **未提交**：分支和改动均未 commit；`skills-lock.json` 的既有本地修改未动。

### 更正

- 上一条 2026-11-17 spike 记录中的 `spike/molstar-renderer` 分支与 `?renderer=molstar` flag 已不再适用：分支已重命名为 `feat/molstar-renderer`，flag 已移除，3Dmol 依赖已删除。

### 下一步

1. 用户真实浏览器复核 Mol* 观感与旋转/缩放流畅度。
2. 用户确认后 commit 并合并 `feat/molstar-renderer` 回 `dev`。
3. 若继续优化：评估 Mol* 自定义 spec/裁剪以降低 986KB chunk；验证 Windows 与插入码样例。

### 补充（同日）：Transparency 链隐藏 union 修复

- **问题**：首次实现链显隐时，`StructureElement.Loci.fromExpression(structure, MS.struct.modifier.union(hiddenChains.map(chainExpression)))` 在 4HHB 上只返回第一条链的 loci（1224 个原子），而不是 B+C+D 的 3611 个原子；因此隐藏链看起来仍在画布上。
- **修复**：改为逐链 `StructureElement.Loci.fromExpression`，再用 `StructureElement.Loci.union` 累积，最后 `StructureElement.Bundle.fromLoci`。
- **附带修复**：Transparency transform 之前每次调用都会新增一个 child cell；改为先用 `StateSelection.Generators.ofTransformer(...).withTag('foldlens-hidden-chains')` 查找并更新已有 cell，同时删除重复 cell。
- **验证**：生产预览（4173）上 4HHB 只勾选链 A 时，Cartoon / Stick / Sphere 三种表示均只显示链 A；切回“全部”后恢复四链；0 异常。最终 24 URL 矩阵、交互、PNG、上传 PDB、离线、设计检查均通过。
- **最终构建**：`StructureView-CkJ1x-hV.js` 3,788.82 kB / 986.53 kB gzip；主包 398.57 kB / 125.47 kB gzip。

---

## 2026-11-17 · Claude Code (deepseek-flash[1m]) · Mol* 渲染引擎 spike（方案 B）

### 目标

在不改动 3Dmol 生产路径的前提下，用 feature flag 接入 Mol* `5.13.1`，验证它能否提升观感，并量化对 1CRN / 4HHB / 6M0J 的启动与交互性能影响。只做 spike，不合并、不提交。

### 分支与入口

- 分支：`spike/molstar-renderer`（基于 `dev`，未提交）。
- 入口：`/entry/{id}?renderer=molstar`；不带该参数时仍走 3Dmol。
- URL 同步与复制链接会保留 `renderer=molstar`。

### 改动文件

- `frontend/package.json` / `frontend/package-lock.json`：新增并锁定 `molstar@5.13.1`。
- `frontend/vite.config.ts`：临时把 `molstar/lib/*` 别名到 `molstar/lib/commonjs/*`，绕过 Vite 8 预打包下 Mol* ESM 命名空间循环依赖导致的 `BuiltInPluginBehaviors` 未初始化错误。
- `frontend/src/features/structure/MolstarView.tsx`：新的 Mol* 视图；复用现有 props/三态/空态/i18n/hover 文案。
- `frontend/src/features/structure/molstar-color-theme.ts`：把七种配色映射到 FoldLens token 的自定义 `ColorTheme`。
- `frontend/src/features/structure/molstar-style.ts`：Mol* viewer/representation 参数、链/残基 MolScript 表达式、位置映射。
- `frontend/src/features/workspace/WorkspaceContent.tsx`：`?renderer=molstar` 懒加载分支、PNG 句柄、URL/复制链接保留 flag。
- 未改后端、样例数据、设计 token 或 3Dmol 路径。

### 关键决策

1. **不用 Mol* 自带 UI**：只用 `PluginContext` + `Canvas3D` + 现有 React 外壳，避免绕过 i18n/DESIGN token，也避免把完整 viewer/UI 打进 bundle。
2. **显式禁用 Mol* 交互行为**：过滤 `camera-axis-helper`、`camera-focus-loci`、`representation-highlight-loci`、`representation-select-loci`、`representation-focus-loci`、`create-structure-focus-representation`，由 FoldLens 自己处理点击/hover/选中，避免重复标记和相机跳动。
3. **按链建组件**：每条链一个 polymer component + ligand component，链显隐使用 `setSubtreeVisibility`。这保证 4HHB 链显隐可用，但也是 4HHB 冷启动偏慢的主要嫌疑。
4. **配色**：自定义 `foldlens` 主题直接复用 `colors.ts` 的七种 scheme；配体用 `scheme='element'`，不再依赖 Mol* 默认 Jmol 色。
5. **表示映射**：Cartoon → `cartoon`；Stick → `ball-and-stick` 但关闭 element-sphere，只保留 bonds，贴近 3Dmol 的纯 stick；Sphere → `spacefill` sizeFactor 0.22。
6. **水体不渲染**：Mol* 下水的 ball-and-stick 在深色背景上形成明显红点，与 3Dmol 的观感不一致，spike 直接省略 water component。
7. **相机轴**：Mol* 5.13 的 `axes: off` 只改 flag、不清除已创建的 helper mesh；在创建 `Canvas3D` 前把 `DefaultCanvas3DParams.camera.helper.axes.name` 置为 `off`。
8. **软件 WebGL**：允许 `AllowMajorPerformanceCaveat`，否则无头 Chromium（SwiftShader）无法创建 Mol* context；真实 GPU 不受影响。
9. **只解析 model 1**：`createStructure(model, { name: 'model' })`，避免 Mol* 自动应用 biological assembly；1L2Y 的 38 个 NMR model 只显示第一个。

### 验证

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
| 前端类型检查 | `npm run typecheck` | 通过 |
| 前端 lint | `npm run lint` | 通过 |
| 前端构建 | `npm run build` | built in 1.51s；`MolstarView` chunk 3,787.11 kB raw / 986.25 kB gzip；3Dmol chunk 574.06 kB / 164.01 kB；主包 405.44 kB / 127.66 kB |
| 后端测试 | `backend/.venv/bin/pytest -q` | 22 passed（既有 httpx 弃用 warning） |
| 设计检查（Mol*，生产预览） | `inspect.mjs http://127.0.0.1:4173/entry/1CRN?renderer=molstar... --app --allow ...` | 0 FAIL / 0 WARN |
| 设计检查（默认 3Dmol 工作台） | `./scripts/design-check.sh` | 工作台 0 FAIL / 0 WARN；首页 0 FAIL / 1 已知 `still-page` WARN |
| 响应式 | 1440 / 768 / 390 截图 | 3D 视图按容器 resize；390/768 上下堆叠正常 |
| 功能矩阵 | 1CRN × 7 配色 × Cartoon/Stick/Sphere；4HHB Stick | 全部加载成功，0 未捕获异常 / 0 console error |
| 结构范围 | 1CRN / 4HHB / 6M0J / 1L2Y | 全部可加载；1L2Y 只显示 model 1 |
| 联动 | 序列点击 A25、URL `chain=A&res=25` 恢复、背景点击清空 | 残基卡、序列、Ramachandran、3D overlay 同步；URL 正确 |
| hover | 鼠标移动到 CYS 32 | tooltip 显示 `CYS 32 · β-strand` |
| 链显隐 | 4HHB 取消链 A / 全部恢复 | 显隐正确，无异常；选中残基 overlay 独立于链组件 |
| 导航 | 返回首页 → 浏览器后退 | 条目、选中、renderer flag 恢复；0 异常 |
| PNG | `viewportScreenshot.getImageDataUri()` | 返回 `data:image/png;base64,...`，长度 166,782 字符 |
| 离线 | CDP 收集 Network 请求 | 仅 `127.0.0.1:5173/8000`，无外部 CDN/字体/worker 请求 |
| 冷启动（无头 Chromium + SwiftShader） | route mount → canvas 就绪 | 1CRN Mol* 约 2.2s（生产预览） vs 3Dmol 约 4.1s；6M0J Mol* 约 5.7s vs 3Dmol 约 6.6s；**4HHB Mol* 约 14.8s vs 3Dmol 约 7.4s** |

### 问题 / 风险

- **4HHB 冷启动明显退化**：Mol* 约 14.8s，3Dmol 约 7.4s（无头 SwiftShader，真实 GPU 会更快，但趋势需用户确认）。主要嫌疑是按链拆组件导致的多套 cartoon 几何；若继续，应改为单 polymer component + 隐藏链时更新 MolScript 表达式，或做真实 GPU profiler。
- **Vite 兼容层**：当前靠 CommonJS alias 绕开 Mol* 5.13 ESM 命名空间循环依赖；这是 spike 级 workaround，正式采用前应升级/等待上游修复，或改用自定义 Mol* spec + 固定打包方式。
- **Bundle**：Mol* 懒加载 chunk 约 986 kB gzip，是 3Dmol 的约 6 倍；首页不受影响，工作台冷启动会多下载/解析。
- **UI 细节**：Mol* 选中 label 需要用 `sizeFactor: 0.8` 才可读；与 3Dmol 的 11px 标签仍有差异。水体被省略，与 3Dmol 行为不完全一致。
- **真实 GPU 未验证**：无头 Chromium 使用 SwiftShader，4HHB 帧率/启动时间不能直接代表用户机器；需用户在真实浏览器确认。
- **上传 PDB 未单独验证**：Mol* 路径的 `parseTrajectory('pdb')` 已接入，但本轮端到端只覆盖了 6 个内置 mmCIF 样例；上传流程的 PDB 文本需在 spike 后续补测。
- **未提交**：分支和改动均未 commit；`skills-lock.json` 的既有本地修改未动。
- **更正**：上一状态条目写 `exp/render-visual-quality` “未提交、未合并”，但 git 已在 `69df771` 合并入 `dev`；以本次记录为准。

### 下一步

1. 用户在真实浏览器打开 `/entry/1CRN?renderer=molstar`、`/entry/4HHB?renderer=molstar`、`/entry/6M0J?renderer=molstar`，对比观感、4HHB 启动速度、旋转/选中流畅度。
2. 给出 go/no-go：
   - **go**：优先优化 4HHB 冷启动（合并组件/减少 representation）、确定 Vite 兼容方案、清理 spike 调试代码，再进入正式实现。
   - **no-go**：保留 3Dmol，关闭 `spike/molstar-renderer`，后续按 PERF3/PERF4 继续优化。

---

## 2026-11-16 · Claude Code (deepseek-flash[1m]) · 结构渲染画质实验（VIS-A）

### 目标

在 A+B 性能优化已合并进 `dev` 后，探索是否能在不牺牲流畅度的前提下，让 3D 结构更美观、更有体积感和细腻度。先只做可行性实验，再决定默认参数。

### 调研结论

- **3Dmol 2.5.5 不是 Three.js**：它自带 `WebGL.Renderer`、`Scene`、`Camera`、`Light` 和 Lambert 类材质（`3Dmol.js:21718`、`21728`、`32108`）。Three.js 的 `EffectComposer` / `SSAOPass` / PBR / IBL 不能直接接入。
- 3Dmol 已内置：
  - 环境光遮蔽（AO）：`ambientOcclusion: { strength, radius }`。
  - 描边：`outline: { width, color, maxpixels }`。
  - cartoon 细分：`cartoonQuality`（默认 10）。
  - `antialias: true` 时默认 2× 超采样 + FXAA。
- 光照固定为单方向光，材质无 PBR；要获得 Three.js 级别的棚拍光/材质必须替换渲染器（数周级、高风险），当前范围不做。

### 完成内容

- `frontend/src/features/structure/style.ts`
  - 新增 `VIEWER_OPTIONS`：`cartoonQuality: 16`、`ambientOcclusion: { strength: 1.0, radius: 5 }`、`outline: { width: 0.03, color: UI_COLORS.viewportGrid, maxpixels: 1.2 }`。
  - 注释说明参数取舍与 3Dmol 内置能力。
- `frontend/src/features/structure/StructureView.tsx`
  - `createViewer(container, VIEWER_OPTIONS)`。
- `docs/ARCHITECTURE.md` 4.4：记录 viewer 级画质选项与“3Dmol 非 Three.js，不要直接接 EffectComposer”的约束。

### 实验与取舍

| 变体 | 结果 |
|---|---|
| AO 0.7 / 4 | 差异很弱，stick/sphere 几乎不可见（RMSE 0.2–0.6） |
| AO 1.5 / 6 | 体积感明显，但 4HHB 缝隙偏暗、颜色被压重 |
| AO 1.0 / 5 | 深度感与色彩平衡较合适，选为默认 |
| `cartoonQuality` 16 | 丝带转折略顺滑；首屏 CPU 约 +20–40ms（4HHB/6M0J），选为默认 |
| `cartoonQuality` 20 | 视觉收益很小，`setNormals` 成本明显上升（6M0J 86.8ms），不采用 |
| 描边（muted 灰） | 球状表示出现灰色光环，略像插画 |
| 描边（viewportGrid 暗色） | 只做边缘分离，球状表示无光环；选为默认 |
| 3Dmol + Three.js 后处理 | 不可直接接入；2D 包一层无深度、与既有 FXAA 重复，不采用 |

### 验证

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
| 前端 lint | `npm run lint` | 0 error |
| 前端构建 | `npm run build` | built in 811ms |
| 运行时交互 | 4HHB / 6M0J：Cartoon→Stick→Sphere、charge/position/bfactor/ss、隐藏链、改选残基 | 全部正常，0 未捕获异常 / 0 console error |
| 视觉 | 1CRN × Cartoon/Stick/Sphere、4HHB、6M0J | AO 增加缝隙深度；暗色描边分离边缘；选中 accent stick 与 label 仍清晰 |
| 参数成本 | CDP CPU profiler | `cartoonQuality` 16：4HHB `setNormals` 21.8→43.5ms；6M0J 32.1→53.3ms；质量 20 更高且收益小 |

### 问题 / 风险

- 无头 Chromium + 真实 GPU 的连续旋转帧率测量不稳定（基线与 AO 版本都出现 250ms 级抖动），无法给出可信的 fps 对比；AO/描边对集成显卡的实际帧率需用户在真实浏览器确认。
- AO 与描边都是全局渲染效果，会增加每帧开销；若低端机器变卡，优先降低 AO strength / 移除 outline / 回退 cartoonQuality。
- 描边是最主观的一项；默认使用暗色细描边，若认为偏插画，删除 `VIEWER_OPTIONS.outline` 即可。
- 分支 `exp/render-visual-quality` 未提交、未合并；未新增依赖。

### 下一步

用户在真实浏览器查看 4HHB / 6M0J 的旋转与选中效果；确认后提交并合并回 `dev`。若观感或流畅度不满意，按上表调整参数或移除对应效果。

---

## 2026-11-16 · Claude Code (deepseek-flash[1m]) · 结构渲染 A+B：选中 overlay 与首屏单次构建

### 目标

用户反馈蛋白质结构展示渲染很卡。在保持图形质量的前提下优化，先实施方案 A（选中高亮与主模型解耦）与方案 B（首屏单次几何构建、颜色标尺记忆化）。

### 根因

- 3Dmol 的 `GLModel.setStyle` 只要有任何原子变化就执行 `this.molObj = null`，下一次 `render()` 会重建整个模型的几何并 `clone()`。
- 原实现每次选中残基都对全模型执行 `setStyle({}, {})`、`setStyle({}, base)`、配体/隐藏链/选中样式，导致 1 个残基的高亮触发 4HHB/6M0J 全结构重建。
- 首屏先 `addModel → zoomTo → render()`（默认样式），样式 effect 再全量重建一次。
- B-factor 范围与残基位置归一化在每次选中时重复计算。

### 改动文件

- `frontend/src/features/structure/style.ts`
  - 新增 `createColorContext` / `createColorFunc` / `baseStyleFor` / `applyBaseStyles` / `selectionOverlayStyle` / `updateSelectionOverlay` / `updateSelectionLabel`。
  - 删除 `applyStructureStyles`、`StructureStyleOptions`、`selectionKeyString`。
  - `bFactorRange` 改为单次循环，避免展开大数组。
- `frontend/src/features/structure/StructureView.tsx`
  - `ViewerBundle` 持有主模型与空 overlay model。
  - 基础样式 effect（配色/表示/链显隐）与选中 overlay effect 分离；选中变化不再触碰主模型。
  - 首次样式应用后才 `render()`；`zoomTo` 只执行一次。
  - 颜色上下文与 style 用 `useMemo` 记忆化。
- `frontend/src/stores/app-store.ts`
  - `setHiddenChains` 内容不变时不产生新数组，避免无意义重渲染。
- `docs/ARCHITECTURE.md` 4.4：同步主模型/overlay 生命周期与“不重建主模型”约束。

### 关键决策

1. overlay 只画 accent stick：cartoon/sphere 下原选中样式的基础表示与基础样式完全相同，stick 表示下 0.2 的 accent stick 覆盖 0.12 基础 stick，视觉等价。
2. 选中残基所在链被隐藏时，overlay 附带基础表示，保持原实现“选中残基仍可见”的行为。
3. 不降低 `antialias`、不减少几何细分、不改变配色或尺寸；未新增依赖。

### 验证

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
| 前端 lint | `npm run lint` | 0 error |
| 前端构建 | `npm run build` | built in 793ms（仅既有 3Dmol eval/chunk 警告） |
| 后端测试 | `backend/.venv/bin/pytest` | 22 passed, 1 warning（既有 httpx 弃用提示） |
| 视觉 | Chromium 截图：1CRN × Cartoon/Stick/Sphere、4HHB、6M0J | 选中 accent stick 与 label 正常，颜色/粗细/遮挡与原版一致 |
| 隐藏链 | 4HHB 隐藏链 A（选中在 A）；1CRN 全部隐藏 | 与 `dev` 基线截图一致；全部隐藏空态正常 |
| 运行时切换 | Cartoon→Stick→Sphere；charge/position/bfactor/ss；隐藏后再显示链；改为选中另一残基 | 全部正常，0 未捕获异常 |
| 点击路径 profiler（4HHB，6 次选中） | CDP CPU profiler | `setNormals` 92.3→31.5ms；`createMolObj` 28.1→10.7ms；`clone` 31.2→10.7ms；GC 147→51.8ms |
| 点击路径 profiler（6M0J，6 次选中） | CDP CPU profiler | `setNormals` 220.3→29.7ms；`createMolObj` 43.5→11.0ms；GC 203.4→33.0ms |
| 首屏 profiler（6M0J） | CDP CPU profiler | `createMolObj` 15.6→7.6ms；`setNormals` 45.7→24.1ms |
| 首屏 profiler（4HHB） | CDP CPU profiler | `createMolObj` 15.0→8.5ms |
| 控制台 | CDP 收集 exception/console error | 0 |

### 问题 / 风险

- 无头 Chromium 使用 SwiftShader，帧耗时（约 700–1000ms/帧）不代表真实 GPU；因此以 CPU profiler 的几何/法线/GC 时间作为优化依据，未把帧时间当验收指标。
- 首屏 `readyMs` 不能直接对比：基线在第二次全量重设样式前就隐藏 loading，新版在带正确样式首次渲染后才隐藏。
- 侧栏接触图 / Ramachandran 仍会在每次选中时全量重绘，序列仍会重渲染全部残基；这些属于方案 C/D，本次未做。
- 分支 `perf/structure-rendering` 未提交、未合并；`skills-lock.json` 的既有本地修改未动。

### 下一步

用户验收 A+B；确认后合并回 `dev`。若仍感觉卡顿，再决定是否实施 C（侧栏静态层/选中层分离）与 D（hover 降频）。

---

## 2026-11-06 · Claude Code (deepseek-flash[1m]) · T3：修复 Windows 未自动打开浏览器

### 目标

用户报告：Windows 端执行启动脚本后没有自动打开默认浏览器。

### 根因

1. 就绪检测只探测 `http://127.0.0.1:5173/`。Vite 默认绑定 `localhost`，Windows 上可能只解析/绑定到 IPv6 (`::1`)，启动器因此判定前端未就绪，走不到打开浏览器的步骤。
2. Windows 打开方式使用 `windowsVerbatimArguments` 拼接命令，并以 detached + 隐藏控制台启动 `cmd /c start`；部分 Windows 环境下 `start` 会静默不执行。

### 改动文件

- `scripts/dev.mjs`
  - 前端就绪同时探测 `localhost`、`127.0.0.1`、`[::1]`，任一可用即可。
  - Windows 打开改用 Node 正常参数引用：`cmd /c start "" <url>`（空标题作为独立参数），取消 detached。
  - 增加 `rundll32 url.dll,FileProtocolHandler` 与 `explorer.exe` 两级回退。
  - 60 秒未探测到前端时不再关闭服务，保留进程并打印手动访问地址。

### 验证

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
| 语法 | `node --check scripts/dev.mjs` | 通过 |
| Linux 回归 | `./scripts/dev.sh` | 日志 `FoldLens is ready...` → `Opening ...`；服务持续运行 |
| 后端测试 | `backend/.venv/bin/pytest` | 22 passed |
| 前端构建 | `npm run build` | built in 901ms |
| 前端 lint | `npm run lint` | 0 error |
| Windows 实机 | 用户执行 `scripts\dev.cmd` | 确认浏览器自动打开 |

### 问题 / 风险

- Linux 自动打开在无头测试中只会触发 `xdg-open`，实际浏览器行为由用户环境决定。
- 首次修复自测时误用了已改名的 `waitFor`，导致启动器崩溃并遗留子进程；已修复并清理，后续验证通过。
- 分支 `fix/windows-auto-open` 已合并入 `dev`，未删除。

### 下一步

推送 `dev` 到远程；等待用户下一条反馈。

---

## 2026-11-06 · Claude Code (deepseek-flash[1m]) · EX2：跨平台运行与启动自动打开浏览器

### 目标

1. 项目在 Windows 与 Linux 上都能运行。
2. 启动命令执行后自动打开默认浏览器，不再手动输入地址。

### 完成内容

- 新增跨平台 Node 实现（无新增依赖）：
  - `scripts/dev.mjs`：启动后端与 Vite、等待就绪、自动打开浏览器、退出时清理两个进程树。
  - `scripts/setup.mjs`：跨平台定位 uv，执行 `uv sync --locked --extra dev --python 3.12` 与 `npm install`，再校验样例。
  - `scripts/fetch-samples.mjs`：用 Node `fetch` 替代 `curl`，保留已存在文件，支持 `--force`。
- Unix 包装：`setup.sh` / `dev.sh` / `fetch-samples.sh` 改为 source `node-env.sh` 后调用对应 `.mjs`。
- Windows 包装：新增 `setup.cmd` / `dev.cmd` / `fetch-samples.cmd`。
- 平台差异：uvicorn 自动解析 `.venv/bin/uvicorn` 或 `.venv\Scripts\uvicorn.exe`，缺失时退回 `python -m uvicorn`；退出时 Unix 杀进程组、Windows 用 `taskkill /T`。
- Vite 加 `--strictPort`，避免端口漂移导致自动打开错误地址。
- 自动打开：Linux `xdg-open`、macOS `open`、Windows `start`；`FOLDLENS_NO_OPEN=1` 或 `--no-open` 关闭。
- `.gitattributes`：`.sh` 固定 LF，`.cmd` 固定 CRLF。
- 文档同步：README、`docs/ENVIRONMENT.md`（4.4 Windows）、`AGENTS.md`、`PRODUCT.md`、`docs/PROJECT.md`、`docs/ARCHITECTURE.md`、`docs/DEMO.md`。

### 验证（Linux）

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
| 语法 | `node --check scripts/{dev,setup,fetch-samples}.mjs` | 通过 |
| 安装 | `./scripts/setup.sh` | 后端/前端安装成功，6 个样例校验通过 |
| 自动打开 | `./scripts/dev.sh` | 日志 `FoldLens is ready...` → `Opening http://localhost:5173/`；前后端 200 |
| 关闭自动打开 | `FOLDLENS_NO_OPEN=1 ./scripts/dev.sh` | 输出 `Auto-open disabled`，服务正常 |
| 清理 | 停止启动器后检查端口/进程 | 5173/8000 释放，无残留 uvicorn/vite |
| 前端构建 | `npm run build` | built in 874ms |
| 前端 lint | `npm run lint` | 0 error |
| 后端测试 | `backend/.venv/bin/pytest` | 22 passed |

### 问题 / 风险

- Windows 路径按 Node 标准 API 与平台分支实现，但本机为 Linux，**未做 Windows 实机验收**；首次在 Windows 使用需补记结果。
- 5173 或 8000 被占用时启动器会直接失败（`--strictPort` / uvicorn 绑定错误），不会自动换端口；这是为了避免打开错误地址。
- 分支 `feat/cross-platform-launch` 已合并入 `dev`，未删除。

### 下一步

等待用户反馈；若有 Windows 环境，实机验证 `scripts\setup.cmd` 与 `scripts\dev.cmd`。

---

## 2026-11-06 · Claude Code (deepseek-flash[1m]) · T2：缩小模型单位，减轻密集结构穿模

### 目标

用户报告：复杂或紧凑的蛋白质结构中，3D 模型的构成单位（带状、棒、球）相互穿插（穿模），要求适当调小。

### 完成内容

- `frontend/src/features/structure/style.ts`：尺寸集中为命名常量并整体调小。
  - Cartoon 厚度 0.4 → 0.25。
  - Stick 半径 0.16 → 0.12。
  - Sphere 缩放 0.28 → 0.22。
  - 配体 Stick 半径 0.14 → 0.11。
  - 选中残基叠加 Stick：0.22 / 0.20 / 0.28 → 0.16 / 0.16 / 0.20（仍明显粗于基础样式）。

### 关键决策

1. 采用全局缩小而非按结构自适应，保持不同条目的视觉一致性；若后续仍觉穿模，可再改为按残基数/密度自适应。
2. 选中高亮同步缩小但保留与基础样式的明显粗细差，不影响联动识别。

### 验证

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
| 前后截图 | CDP：1CRN、4HHB、6M0J × Cartoon/Stick/Sphere | 密集结构穿插明显减轻，简单结构仍可读 |
| 表示与选中 | 4HHB 三种表示切换 + 选中 45 号残基 | 正常；URL 与 `aria-pressed` 正确 |
| 控制台 | CDP 收集异常 | 0 |
| 前端构建 | `cd frontend && npm run build` | built in 666ms |
| 前端 lint | `cd frontend && npm run lint` | 0 error |
| 后端测试 | `backend/.venv/bin/pytest` | 22 passed |

### 问题 / 风险

- 排障中 Vite 模块缓存出现一次陈旧状态，已重启开发服务器；合并后建议浏览器刷新。
- 分支 `fix/model-unit-size` 已合并入 `dev`，未删除。
- Cartoon 宽度（3Dmol 的 SS 宽度）未改，穿模在极端密集区域只能减轻、无法完全消除。

### 下一步

合并 `dev` → `master` 并打 `beta` 标签；等待用户下一条反馈。

---

## 2026-11-06 · Claude Code (deepseek-flash[1m]) · EX1：补全常见 3D 着色方案

### 目标

按用户给出的常见配色说明，在标准版五种配色基础上补齐缺失方案。

### 完成内容

- 配色扩展为七种：二级结构、链、**残基位置**、疏水性、**电荷**、B-factor、元素。
- **残基位置**：每条链内部按残基顺序 N→C 归一化，颜色蓝 → 青 → 绿 → 金 → 朱红；多链结构每条链各自重新开始。
- **电荷**：ASP/GLU 红（负电）、LYS/ARG 蓝（正电）、其余中性浅灰；HIS 保持中性。
- 原有五种映射不变（`ss`、`chain`、`hydrophobicity`、`bfactor`、`element`）。
- 类型、`SCHEMES`、下拉标签、zh/en 文案、URL 校验收口。
- 文档同步：`PRODUCT.md`、`README.md`、`docs/PROJECT.md`、`docs/ARCHITECTURE.md`（Scheme 类型、4.4 卸载说明、新增 8.12 配色映射表、URL 写入改为 `history.replaceState` 的契约同步）。

### 关键决策

1. `position` 按链归一化，避免多链结构后段链全部落在红色端。
2. HIS 在 `charge` 中不标带电：质子化状态依赖环境，标成带电会过度解读数据。
3. 现有 B-factor 色阶（青 → 金 → 朱红）保持不变；如课程要求蓝色低值 → 红色高值，可再调整。

### 验证

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
| 七种方案切换 | CDP：1CRN 逐项切换并截图 | 7/7 正常；中英文下拉标签完整 |
| 多链渐变 | CDP：4HHB `scheme=position` 截图 | 四条链各自 N→C 渐变 |
| URL 恢复 | `/entry/1CRN?scheme=position&repr=cartoon&chain=A&res=45` | 下拉为 position，45 号残基选中 |
| 控制台 | CDP 收集异常 | 0 |
| 前端构建 | `cd frontend && npm run build` | built in 620ms |
| 前端 lint | `cd frontend && npm run lint` | 0 error |
| 后端测试 | `backend/.venv/bin/pytest` | 22 passed, 1 warning（既有 httpx 弃用提示） |

### 问题 / 风险

- 分支 `feat/color-schemes` 已合并入 `dev`，未删除。
- 3D 截图为开发期验证，未新增文档截图。
- 未做严格的色彩对比度自动检测；七种方案均在深色观察窗上目视检查。

### 下一步

等待用户下一条测试/扩展反馈；每项从 `dev` 开独立分支，用户确认后合并并同步 `ROADMAP` / `DEVLOG`。

---

## 2026-11-06 · Claude Code (deepseek-flash[1m]) · T1：修复返回按钮偶发卡死/白屏

### 目标

用户报告：查看完蛋白质结果后点击左上角返回，有时卡死（页面白屏），需要刷新。定位根因并修复。

### 根因

1. **URL 同步与返回导航竞争**：`WorkspaceContent` 用 `setSearchParams` 写入 scheme/representation/selection，本质是一次 router 导航。操作后立刻点返回时，写参数导航可能压过返回导航——返回无效，或 URL 已到 `/` 而工作台仍挂载。
2. **3D 视图卸载时抛异常**：React passive cleanup 执行前已移除 DOM；`StructureView` 清理调用 `viewer.clear()`，其内部会渲染最后一帧，3Dmol 的 `OffscreenCanvas` 路径抛出 `UnknownError: Failed to create ImageBitmap from OffscreenCanvas`。异常从卸载清理逃逸到 React 卸载提交（dev 日志记录 `An error occurred in the <StructureView> component`）。

### 改动文件

- `frontend/src/features/workspace/WorkspaceContent.tsx`：查询串改用 `window.history.replaceState`（规格本就要求 replaceState），URL 离开 `/entry/` 后跳过写入。
- `frontend/src/features/structure/StructureView.tsx`：`ResizeObserver` 对 detached / 0 尺寸容器跳过 `resize()`；卸载时 `clear()` 包 try/catch，teardown 不再向 React 抛错。
- `docs/ROADMAP.md`、本记录。

### 验证

| 验证 | 命令 / 方法 | 结果 |
|---|---|---|
| 修复前复现 | CDP 脚本：24 轮打开→操作→返回 | 5 轮返回失败；dev 日志出现 OffscreenCanvas 异常与 React 组件错误警告 |
| 修复后压力 | 同上，连续 3 轮 × 24 次 | 72/72 通过；新增客户端错误 0 |
| 快速连点 | 打开后连续点击返回 3 次 × 15 轮 | 15/15 回到首页，无异常 |
| 真实 GPU | 同上，`--use-gl=angle --use-angle=gl`（AMD Radeon Vega 8） | 通过，无客户端错误 |
| 上传后返回 | CIF 上传 1CRN → 返回首页 | 通过 |
| 深链接恢复 | `/entry/1CRN?chain=A&res=45&scheme=ss&repr=cartoon` | 45 号残基选中，URL 不被覆盖 |
| 后端测试 | `backend/.venv/bin/pytest` | 22 passed, 1 warning（Starlette httpx 弃用提示，非本项目） |
| 前端构建 | `cd frontend && npm run build` | built in 760ms（仅 3Dmol 既有 eval/chunk 警告） |
| 前端 lint | `cd frontend && npm run lint` | 0 error |

### 问题 / 风险

- OffscreenCanvas 异常属于 3Dmol 2.5.5 内部行为，本项目只做隔离，不修改第三方依赖。
- 修复分支 `fix/back-navigation-crash` 已合并入 `dev`（未删除分支）。
- 本机开发服务器仍在运行；合并后的代码已由 Vite HMR 生效。

### 下一步

等待用户下一条测试反馈；每项从 `dev` 开独立分支，用户确认后合并并同步 `ROADMAP` / `DEVLOG`。

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
