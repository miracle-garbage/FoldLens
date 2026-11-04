# FoldLens 路线图与任务清单

> 本文是**进度权威**。每次会话结束必须更新勾选状态与“当前焦点”。  
> 需求范围见 `docs/PROJECT.md`；完成定义见 `docs/CONVENTIONS.md` 第 14 节。

- 更新日期：2026-11-04
- 当前焦点：**M0 已完成，等待用户指示进入 M1**
- 状态标记：`[ ]` 待办 · `[~]` 进行中 · `[x]` 完成 · `[!]` 阻塞

## 参考工期（课余时间，非硬性）

| 里程碑 | 参考工期 | 主要产出 |
|---|---|---|
| M1 | 5–7 天 | 可运行的骨架：首页、样例画廊、1CRN 3D 端到端 |
| M2 | 4–6 天 | 3D ↔ 序列 ↔ 残基卡联动、五种配色、URL 状态 |
| M3 | 5–7 天 | Ramachandran、接触图、档案、导出、四视图联动 |
| M4 | 4–6 天 | i18n 补全、视觉打磨、离线、文档、演示 |

总计约 3–4 周。若截止日期更紧，优先保证 M1–M3 的功能完整，再压缩 M4 的打磨。

---

## M0 · 规划、文档与环境验证 ✅

- [x] 确定项目方向：蛋白质结构探索器（FoldLens）
- [x] 确定范围：标准版
- [x] 确定视觉：暖白纸面 + 深色观察窗
- [x] 确定语言：中英切换，默认中文
- [x] 确定技术栈：React 19 + TS 7 + Vite 8；FastAPI + Biotite 2
- [x] 检查 Node / npm / Python / Git / 浏览器
- [x] 安装 uv 0.13.7（`~/.local/bin/uv`）
- [x] 验证后端依赖：1CRN 解析 / SSE / φψ / 接触矩阵
- [x] 验证前端构建：Vite 8 + React 19 + 3Dmol 2.5.5 + Tailwind 4
- [x] 验证设计检查器：缓存 Chromium + 三档截图
- [x] 编写 `PRODUCT.md` / `DESIGN.md` / `AGENTS.md` / `CLAUDE.md`
- [x] 编写 `docs/PROJECT.md` / `ARCHITECTURE.md` / `CONVENTIONS.md` / `ENVIRONMENT.md`
- [x] 编写 `docs/ROADMAP.md` / `DEVLOG.md`
- [x] 编写 `.gitignore` / `.editorconfig`
- [ ] 初始脚手架 commit（**等待用户明确要求**）

**M0 出口条件**：文档齐备、依赖清单通过、无业务代码。→ 已满足。

---

## M1 · 脚手架 + 后端管线 + 1CRN 端到端 + 首页骨架

### M1.1 工程脚手架

- [ ] 创建目录：`frontend/`、`backend/`、`data/samples/`、`data/thumbnails/`、`scripts/`
- [ ] 前端：Vite `react-ts` 模板，安装约定依赖
- [ ] 前端：配置 `@/` 别名、Tailwind 4、`tokens.css`、全局样式
- [ ] 前端：React Router 两个路由（Home / Workspace 占位）
- [ ] 后端：`pyproject.toml`（fastapi、uvicorn、biotite、numpy、httpx、python-multipart、pytest、ruff）
- [ ] 后端：`app/main.py`、`core/config.py`、`core/errors.py`、`core/logging.py`
- [ ] 后端：`GET /api/health`
- [ ] 脚本：`scripts/setup.sh`（uv venv + 依赖 + npm install）
- [ ] 脚本：`scripts/dev.sh`（并行启动前后端）
- [ ] 脚本：`scripts/fetch-samples.sh`（下载 6 个 CIF 与缩略图）
- [ ] 脚本：`scripts/design-check.sh`（设置 CHROME_PATH 并跑 inspect）

### M1.2 数据与后端管线

- [ ] 下载 6 个样例 CIF 到 `data/samples/`：1CRN、1UBQ、1LYZ、4HHB、6M0J、1L2Y
- [ ] 下载 6 张缩略图到 `data/thumbnails/`
- [ ] `services/rcsb.py`：样例优先 → 缓存 → RCSB；超时 15s、重试 1 次
- [ ] `services/cache.py`：原子写入、路径约定、上传清理
- [ ] `services/structure.py`：mmCIF/PDB 解析（model 1）
- [ ] `services/analysis.py`：SSE / φψ / B-factor / 疏水性 / 接触 / 配体 / 缺失残基 / 统计
- [ ] `models/schemas.py`：camelCase 输出，字段与 `ARCHITECTURE.md` 一致
- [ ] `GET /api/entries/{entryId}`
- [ ] `GET /api/entries/{entryId}/structure`
- [ ] `GET /api/samples`
- [ ] `GET /api/thumbnails/{pdbId}`
- [ ] 错误封套与错误码
- [ ] 后端测试：1CRN 计数、SSE、φψ 范围、接触、非法 ID、缓存命中

### M1.3 前端第一屏

- [ ] 设计 token 落地（颜色、字体、间距、圆角）
- [ ] 顶部栏、按钮、输入框、卡片等基础组件
- [ ] 首页：搜索（校验 / loading / error）
- [ ] 首页：样例画廊对接真实 `/api/samples`
- [ ] 工作台壳：顶部栏 + 62/38 布局 + 面板占位
- [ ] 3Dmol 动态 import + 加载 1CRN CIF + 默认 cartoon
- [ ] 基础 i18n：语言切换与首页/工作台框架文案
- [ ] 加载 / 空 / 错误三态（首页与工作台）

### M1 验收

- [ ] `./scripts/setup.sh` 在干净环境可完成安装
- [ ] `./scripts/dev.sh` 同时拉起 5173 与 8000
- [ ] 首页展示 6 个样例，数据来自后端
- [ ] 搜索 `1CRN` 能进入工作台并渲染 3D
- [ ] `GET /api/entries/1CRN` 返回 46 个残基，SSE 为 18/4/24
- [ ] `pytest` 通过
- [ ] `npm run build` 通过
- [ ] 首页与工作台壳设计检查无 `FAIL`

---

## M2 · 联动视图 + 配色 + 序列 + 残基卡

### M2.1 状态与 3D

- [ ] Zustand store：selection / scheme / representation / hiddenChains / language
- [ ] 3D 点击与 hover 回调
- [ ] `atom.index → residue key` 映射（含插入码处理）
- [ ] 用 4HHB 与 6M0J 验证映射一致性
- [ ] 五种配色：SS / 链 / 疏水性 / B-factor / 元素
- [ ] 按链显隐
- [ ] 选中高亮（stick + label），不重建 viewer
- [ ] `ResizeObserver` + 卸载清理

### M2.2 序列与残基卡

- [ ] 序列面板：按链分组、单字母、序号刻度
- [ ] 序列点击选中 + 自动滚动到可视区
- [ ] 缺失残基占位显示
- [ ] 残基卡：φψ / SSE / B-factor / 疏水性 / null 显示 `—`
- [ ] 配体残基卡片（无 φψ 时显示不适用）
- [ ] 未选中提示与“示例残基”入口
- [ ] 键盘：Esc 清空，←/→ 移动残基

### M2.3 URL 与 i18n

- [ ] URL 读写：`pdb/chain/res/ins/scheme/repr`
- [ ] 刷新恢复选中与视图状态
- [ ] 非法参数静默回退
- [ ] i18n：工作台与残基卡文案补全
- [ ] `<html lang>` 与 `document.title` 随语言更新

### M2 验收

- [ ] 3D ↔ 序列 ↔ 残基卡 三处同步
- [ ] 五种配色切换正确
- [ ] 4HHB 四链显隐正常
- [ ] 复制链接后新窗口恢复状态
- [ ] `npm run build` / `lint` 通过
- [ ] 工作台设计检查无 `FAIL`

---

## M3 · Ramachandran + 接触图 + 档案 + 导出

### M3.1 图表

- [ ] Ramachandran Canvas：坐标轴、允许区轮廓、散点、异常点
- [ ] Ramachandran 命中测试与点击选中
- [ ] 当前残基高亮 + 自动定位
- [ ] 接触图 Canvas：矩阵、当前十字线、图例
- [ ] 接触图命中测试与点击选中
- [ ] >3000 残基降采样与提示

### M3.2 档案与导出

- [ ] 档案 tab：方法 / 分辨率 / R-free / 日期 / 计数
- [ ] 配体列表
- [ ] 缺失残基范围
- [ ] 导出 PNG（3D 当前帧）
- [ ] 导出 CSV（完整列）
- [ ] 复制链接 + Toast
- [ ] 全部异步错误态与重试

### M3.3 四视图联动

- [ ] Ramachandran ↔ store
- [ ] 接触图 ↔ store
- [ ] 四处同步的一致性测试（1CRN / 4HHB）
- [ ] 选中残基不在某视图时的“不适用”处理

### M3 验收

- [ ] 四处联动完整可用
- [ ] 4HHB / 6M0J 可流畅交互
- [ ] CSV 列与 `ARCHITECTURE.md` 一致
- [ ] 后端新增配体/缺失残基测试通过
- [ ] 设计检查无 `FAIL`

---

## M4 · i18n 补全 + 视觉打磨 + 离线 + 文档 + 演示

- [ ] 全部文案 zh/en 覆盖，无硬编码
- [ ] 视觉打磨：字体、间距、图表、状态页
- [ ] `impeccable polish` / 设计检查三轮以内收敛
- [ ] 可访问性审查：键盘、焦点、对比度、reduced motion
- [ ] 性能核对：首页 chunk、3Dmol 懒加载、4HHB 帧率
- [ ] 断网演示验证（关闭网络，打开 6 个样例）
- [ ] 上传流程验证（CIF/PDB、非法文件、超限）
- [ ] README 增加截图与最终启动说明
- [ ] `docs/PROJECT.md` 验收清单逐项打勾
- [ ] 最终 `DEVLOG` 与演示脚本

### M4 验收

- [ ] `docs/PROJECT.md` 第 10 节全部通过
- [ ] 设计检查 1440/768/390 无 `FAIL`
- [ ] 断网可完成 3 分钟演示
- [ ] 构建、lint、pytest 全绿

---

## 扩展 backlog（未批准，不得擅自开工）

- [ ] 配体结合口袋分析（4 Å 内残基 + 表面渲染）
- [ ] 双结构叠合 / RMSD
- [ ] PWA / 安装到桌面
- [ ] Vitest + React Testing Library
- [ ] 多 model / NMR ensemble 切换
- [ ] 核酸结构支持

> 任何扩展必须先获得用户批准，再写入本文件并调整里程碑。
> 本项目为纯生物信息学课程设计，不包含医学 AI 内容；相关方向属于另一个项目。

---

## 变更控制

1. 范围变化 → 用户明确同意 → 更新 `docs/PROJECT.md` 与本文 → 在 `docs/DEVLOG.md` 记录。
2. 里程碑延期 → 在 `DEVLOG` 记录原因与新的日期。
3. 阻塞项 → 标记 `[!]`，写明阻塞原因与需要谁决策。
4. 不得为了“进度好看”提前勾选未验证的任务。

---

## 会话结束检查

- [ ] 本文件勾选与“当前焦点”已更新
- [ ] `docs/DEVLOG.md` 已追加本次记录
- [ ] 下一次会话能从“当前焦点”直接开始
