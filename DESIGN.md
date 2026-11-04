---
name: FoldLens
description: 蛋白质结构探索器 —— 暖白纸面与深色观察窗
colors:
  paper: "#F2EFE7"
  surface: "#FAF8F3"
  ink: "#1A1917"
  muted: "#6B675F"
  line: "#D8D2C4"
  accent: "#D9482B"
  accent-ink: "#B83A22"
  teal: "#2A7F7A"
  teal-ink: "#226B66"
  viewport: "#0C0F14"
  viewport-grid: "#1D232C"
  helix: "#E0523B"
  strand: "#3E9B94"
  coil: "#9A958B"
  warning: "#B7791F"
  warning-ink: "#8A5A12"
  danger: "#B42318"
  success: "#2F7D5B"
  success-ink: "#256B4C"
typography:
  display:
    fontFamily: "Fraunces Variable, Noto Serif CJK SC, Georgia, serif"
    fontSize: "clamp(2.5rem, 4vw, 4rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Instrument Sans Variable, Noto Sans CJK SC, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  mono:
    fontFamily: "IBM Plex Mono, Noto Sans Mono CJK SC, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.01em"
rounded:
  xs: "2px"
  sm: "4px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  xxxl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent-ink}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
    height: "40px"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
    height: "48px"
  card-sample:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0"
  tab-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    padding: "6px 12px"
  chip-residue:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.xs}"
    padding: "2px 6px"
---

> **状态：Seed v0.1（2026-11-04）**
> 这是实现前根据已确认方向写下的设计系统种子。M1–M3 期间允许在保持世界与 token 语义的前提下细化；
> M4 完成后由 `impeccable document` 扫描真实代码，把本文件升级为与实现一致的正式版本。
> **Token 是规范；正文解释如何应用。**

## Overview

FoldLens 的世界是**科学标本台（Specimen Bench）**：暖白纸面般的操作台，嵌着一扇深色的观察窗。三维结构在暗窗里被照亮，数据面板像贴在纸面上的标签与读数。

这是一个 **Operate** 型界面：用户来这里完成任务——找到一个结构、选中一个残基、读出一组数。因此表达必须克制，唯一的“响”留给观察窗本身：

- 纸面区域负责阅读、导航、输入，保持低对比、低噪音。
- 观察窗负责吸引注意，深色、致密、发光。
- 强调色朱红只出现在主操作、当前选中残基、当前激活的读数上。

界面不应让人想到“又一个深色仪表盘”。它更像一张被认真排版过的实验记录纸，中间开了一扇窗。

## Colors

| Token | 值 | 角色 |
|---|---|---|
| `paper` | `#F2EFE7` | 页面底色 |
| `surface` | `#FAF8F3` | 卡片、输入框、面板 |
| `ink` | `#1A1917` | 主文字、激活态底色 |
| `muted` | `#6B675F` | 次级文字、说明 |
| `line` | `#D8D2C4` | 分隔线、卡片边框 |
| `accent` | `#D9482B` | 大面积高亮、图形、当前残基 |
| `accent-ink` | `#B83A22` | 强调文字、主按钮底色（AA 安全） |
| `teal` | `#2A7F7A` | β 折叠、辅助图形 |
| `teal-ink` | `#226B66` | 辅助文字（AA 安全） |
| `viewport` | `#0C0F14` | 3D 观察窗背景 |
| `viewport-grid` | `#1D232C` | 观察窗内的极淡网格 / 分隔 |
| `helix` | `#E0523B` | α 螺旋 |
| `strand` | `#3E9B94` | β 折叠 |
| `coil` | `#9A958B` | 无规卷曲 |
| `warning` / `warning-ink` | `#B7791F` / `#8A5A12` | 提示 |
| `danger` | `#B42318` | 错误 |
| `success` / `success-ink` | `#2F7D5B` / `#256B4C` | 成功 |

规则：

- `accent` 适合图形与大面积标记；**正文不要用 `accent`**（对纸面仅 3.72:1），文字用 `accent-ink`。
- `teal` 同理只用于图形；文字用 `teal-ink`。
- 主按钮：`accent-ink` 底 + `surface` 字（5.40:1）。
- 分隔线只用 `line`，不要用阴影代替结构。
- 二级结构配色必须同时提供图例；颜色不是唯一信息通道。
- 3D 结构色与界面色分离：不要在纸面 UI 中直接使用 `helix/strand/coil` 作为文字色。

## Typography

| 角色 | 字体 | 用途 |
|---|---|---|
| Display | Fraunces Variable → Noto Serif CJK SC → Georgia | 首页主标题、样例名称、工作台结构标题 |
| Body | Instrument Sans Variable → Noto Sans CJK SC → system-ui | 正文、按钮、表单、导航 |
| Mono | IBM Plex Mono → Noto Sans Mono CJK SC | PDB ID、残基序号、φ/ψ、坐标、统计数字 |

字号阶梯：

- Display XL：`clamp(2.5rem, 4vw, 4rem)` / 1.05（仅首页主标题）
- Display L：`2.25rem` / 1.1（样例详情标题）
- Display M：`1.5rem` / 1.2（面板标题）
- Body L：`1.0625rem` / 1.6（导语）
- Body：`1rem` / 1.6
- Body S：`0.875rem` / 1.5（说明、标签）
- Mono：`0.8125rem` / 1.5（数据）
- Mono S：`0.75rem` / 1.4（单位、次级数据）

规则：

- 中文标题使用 Noto Serif CJK SC；若系统缺失则回退到正文无衬线，不强行下载 83MB 字体包。
- 拉丁字母与数字使用对应拉丁字体；中文回退到系统 CJK 字体。
- 数据一律用等宽字体，并让小数点对齐（表格使用 `font-variant-numeric: tabular-nums`）。
- 不用全大写英文做长标题；短标签可以 `letter-spacing: 0.08em` 全大写。
- 正文最大宽度 68ch；面板内 60ch。

## Layout

### 首页

- 12 栏网格，最大宽度 1440px，左右留白 48px（≥1280px）/ 24px（<1280px）。
- 顶部栏 64px：左侧 wordmark，右侧语言切换。
- Hero 区：左侧标题 + 一句说明 + 搜索框；右侧留白或一个极简结构线稿，不放大图。
- 样例画廊：3 列（≥1200px）/ 2 列（768–1199px）/ 1 列（<768px），卡片间距 24px。
- 页脚：数据来源与课程信息，字号 Body S。

### 工作台

- 顶部栏 56px：返回、PDB ID + 标题、表示方式、配色、导出、语言。
- 主体：3D 观察窗 62% | 分析面板 38%；间距 16px；整体高度 `calc(100vh - 56px)`。
- 观察窗：内边距 0；外框 1px `line`，圆角 `lg`；内部深色，四周留 12px 暗边。
- 分析面板：`surface` 背景，1px `line` 边框，圆角 `lg`；内部纵向滚动。
  - 顶部固定：残基详情卡（未选中时显示操作提示）。
  - 下方 tab：`分析`（序列 / Ramachandran / 接触图）与 `档案`（统计 / 配体 / 缺失残基）。
  - 序列在面板内按链分组，横向滚动；当前残基有朱红下划线与浅色底。
- 断点：
  - ≥1280px：62/38 双栏。
  - 1024–1279px：58/42，字号不变。
  - <1024px：上下堆叠，观察窗 56vh，面板在下方；顶部栏允许换行。
- 不使用悬浮玻璃面板；所有面板有实体边界。

### 状态布局

- 加载：观察窗显示暗色骨架 + 中央细线进度；面板显示 3 行骨架。
- 空：未选中残基时，残基卡显示“点击结构或序列中的残基”及一个可点击的示例。
- 错误：面板内错误卡，包含错误码、可读说明、重试按钮；观察窗保持上一帧或显示空态。
- 超时：明确显示“RCSB 响应超时”，提供“使用内置样例”出口。

## Elevation & Depth

- 默认不使用投影制造层级；用 1px 边框、底色差与留白分层。
- 仅两处允许轻投影：
  - 样例卡片 hover：`0 2px 0 rgba(26,25,23,0.06)`。
  - 工作台顶部栏：`0 1px 0 rgba(26,25,23,0.06)`。
- 观察窗是唯一的“深”层：背景 `viewport`，内部结构自发光；不要在其周围再加暗色卡片。
- 禁止玻璃拟态、模糊背景、彩色光晕。

## Shapes

- 圆角：`xs 2px`（标签、残基 chip）、`sm 4px`（按钮、输入）、`md 8px`（样例卡）、`lg 12px`（观察窗、面板）。
- 不使用全圆角胶囊，除非是状态点或极小计数。
- 图标使用 1.5px 线宽的线性图标（lucide），尺寸 16/20px；不使用 emoji。
- 选中态：2px `accent` 外框或左侧 3px 竖线；不要同时用多种选中语言。
- 分隔线 1px，颜色 `line`；分区间距优先于分隔线。

## Components

### Buttons

- **Primary**：`accent-ink` 底、`surface` 字、40px 高、4px 圆角；只用于页面唯一主操作（首页“打开结构”、错误卡“重试”）。
- **Ghost**：透明底、`ink` 字、1px `line` 边框；用于次级操作（切换表示、导出）。
- **IconButton**：32×32px，图标 18px，`aria-label` 必填；hover 底色 `paper`。
- 禁用态：40% 不透明度 + `cursor: not-allowed`；不发灰到失去对比。

### Search

- 48px 高，`surface` 底，1px `line` 边框；左侧搜索图标，右侧 PDB ID 格式提示。
- 聚焦：2px `accent` 外框，不使用发光。
- 示例 chips：`1CRN`、`4HHB`、`6M0J`，mono 字体，点击填入并直接打开。

### Sample Card

- 结构缩略图在上（16:10，深色底，图片 `object-fit: contain`），信息在下。
- 信息层级：PDB ID（mono，12px，muted）→ 名称（display，20px）→ 一句说明（body S）→ 指标行（链数 / 残基数 / 分辨率）。
- hover：边框变 `ink`，缩略图轻微放大 1.02（`prefers-reduced-motion` 下取消）。
- 整卡可点击；键盘 focus 有 2px `accent` 外框。

### Residue Card

- 固定在分析面板顶部；`surface` 底，底部 1px `line`。
- 第一行：`LEU 45`（mono，18px，ink）+ 二级结构 chip。
- 第二行：φ / ψ 两个读数块；无值时显示 `—`。
- 第三行：B-factor 与疏水性（Kyte–Doolittle）读数。
- 选中时左侧 3px `accent` 竖线；未选中时显示提示语。

### Tabs

- 两个 tab：`分析` / `档案`；下划线式，不要实心胶囊。
- 激活：`ink` 字 + 2px `ink` 下划线；未激活：`muted` 字。
- 键盘左右方向键切换，`aria-selected` 正确。

### Plots

- Ramachandran：`surface` 底，φ 横轴 −180…180，ψ 纵轴 −180…180；允许区用 `line` 描边、`paper` 填充；普通点 `muted` 40% 透明，异常点 `danger`，当前残基 `accent` 实心 + 2px 白环。
- 接触图：Canvas 热图；非接触 `paper`，接触 `ink`（低透明度叠加），当前残基十字线 `accent`；坐标轴不画满刻度，只标 0、中间、末端。
- 图例放在图下方，字号 Mono S；不要悬浮大段说明。

### Feedback

- Toast：右下角，`ink` 底、`surface` 字，最多 3 秒；用于复制链接、导出完成。
- 错误卡：`danger` 左侧 3px 竖线 + 错误码（mono）+ 一句可执行说明。
- 骨架屏：`paper` 底上的 `line` 色块，不做闪烁动画；用 1.2s 的透明度呼吸，`reduced-motion` 下静态。

### Motion

- 时长 180ms（hover/focus）/ 240ms（面板切换）；缓动 `cubic-bezier(0.2, 0.7, 0.2, 1)`。
- 允许：残基高亮淡入、面板切换淡入 + 4px 位移、观察窗 resize。
- 禁止：视差、连续旋转、自动播放的装饰动画。
- `prefers-reduced-motion: reduce` 时全部时长设为 0，保留状态变化。

## Do's and Don'ts

**Do**

- 让观察窗成为页面唯一的深色焦点。
- 用 `accent-ink` 处理所有需要 AA 的强调文字。
- 用 mono 字体呈现一切可复制的数据：PDB ID、残基号、角度、距离。
- 每个图都给图例；每个异步区域都给加载/空/错误三态。
- 在 1440 / 768 / 390 三个宽度检查；优先保证 1280 以上演示宽度。

**Don't**

- 不要使用紫色渐变、玻璃卡片、霓虹发光、通用 SaaS 仪表盘布局。
- 不要在浅色纸面上直接铺大面积 `accent` 或 `teal`。
- 不要把全部内容塞进圆角胶囊。
- 不要用 emoji 当图标。
- 不要让 3D 窗口占满全屏而没有读数面板——联动的读数才是产品差异。
- 不要在组件里写死十六进制颜色；只引用 token（3D 配色集中在 `features/structure/colors.ts`）。
- 不要为了“丰满”添加无数据支撑的统计或夸大描述。
