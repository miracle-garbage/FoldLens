# CLAUDE.md

本项目的唯一接续开发总则是 **`AGENTS.md`**。开始任何工作前，请完整阅读它。

## 必读顺序

1. `AGENTS.md` — 流程、约束、环境、交接规则
2. `PRODUCT.md` — 产品事实与范围
3. `docs/PROJECT.md` — 项目总设计
4. `docs/ROADMAP.md` — 当前进度与下一任务
5. `docs/DEVLOG.md` — 当前状态 + 最近记录

## 硬性规则（摘要）

- 范围锁定为**标准版**；不得擅自加配体口袋、表面渲染、结构对比、变异致病性预测。
- 纯本地运行；不部署、不加鉴权、不接数据库。
- 6 个样例必须离线可用。
- 所有 UI 文案走 i18n（`zh` / `en`）；专业术语保留英文。
- 颜色只用 `DESIGN.md` 中的 token；3D 配色集中在 `features/structure/colors.ts`。
- 每个异步区域必须有加载 / 空 / 错误三态。
- 不做未经批准的依赖、页面或功能扩展。
- 不擅自 git commit；不 force push。
- **每次会话结束必须更新 `docs/ROADMAP.md` 并在 `docs/DEVLOG.md` 追加记录。**

## 环境提醒

- `uv` 在 `~/.local/bin/uv`，不在 PATH；系统 pip/venv 不可用。
- 设计检查器的 Chromium 路径：
  `~/.cache/ms-playwright/chromium-1169/chrome-linux/chrome`
- 详细命令见 `docs/ENVIRONMENT.md`。

## 当前阶段

M0（规划/文档/环境验证）已完成，**业务代码尚未开始**。等待用户明确指示后进入 M1。
