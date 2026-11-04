# FoldLens 统一开发规约

> 本文约束**怎么写**。范围见 `docs/PROJECT.md`，契约见 `docs/ARCHITECTURE.md`，视觉见 `DESIGN.md`。  
> 新会话必须遵守；需要例外时，在 `docs/DEVLOG.md` 记录理由。

- 版本：v1.0（2026-11-04）

---

## 1. 总则

1. **可读性优先于聪明。** 宁可多一行命名清晰的代码，不要一行需要推导的技巧。
2. **单一事实源。** 选中状态只在 store；API 字段只在 schema；颜色只在 token；文案只在 i18n 字典。
3. **小步可验证。** 每个改动都能用一条命令验证。
4. **不做未批准的扩展。** 新页面、新依赖、新功能模块先问用户。
5. **文档随代码走。** 行为、契约、token、依赖变化时，同一次会话更新文档。
6. **不留半成品。** 不允许 `TODO` 长期悬挂；必须记录到 `docs/ROADMAP.md` 或开发日志。

---

## 2. TypeScript / React

- `strict: true`；开启 `noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`。
- **禁止 `any`**。边界处用 `unknown` + 类型守卫；确需断言时写注释说明来源。
- 对象形状用 `interface`，联合/工具类型用 `type`。
- 组件用函数声明 + 命名导出：

  ```tsx
  interface ResidueCardProps {
    residue: ResidueRecord | null;
  }

  export function ResidueCard({ residue }: ResidueCardProps) {
    // ...
  }
  ```

- Props 类型命名 `XxxProps`；不展开 `React.FC`。
- 必须给列表项稳定的 `key`；禁止用数组下标作为可变列表的 key。
- `useEffect` 依赖必须完整；禁止用 `// eslint-disable` 掩盖依赖问题。
- 事件处理器命名 `handleXxx`；回调 prop 命名 `onXxx`。
- 派生数据用 `useMemo`，仅在确实有性能收益时；不要为了“看起来优化”滥用。
- 异步函数必须处理错误；不允许 floating promise。
- 组件文件超过 ~250 行时，拆分子组件或抽 hook。
- 不写桶文件（`index.ts` re-export）；直接引用具体文件，避免循环依赖。

---

## 3. 文件与命名

| 类型 | 规则 | 例子 |
|---|---|---|
| React 组件 | `PascalCase.tsx` | `ResidueCard.tsx` |
| Hook | `useXxx.ts` | `useEntry.ts` |
| 工具/纯函数 | `kebab-case.ts` | `format-angle.ts` |
| 类型 | 小写文件名 | `api.ts`、`domain.ts` |
| 测试 | 与被测文件同目录，`*.test.ts(x)` | `analysis.test.ts` |
| Python 模块 | `snake_case.py` | `routes_entries.py` |
| Python 测试 | `test_*.py` | `test_analysis.py` |
| 样式 | `tokens.css`、`globals.css` | |

- 目录名用 `kebab-case`；feature 目录用单数（`structure/`、`sequence/`）。
- 常量用 `SCREAMING_SNAKE_CASE`；类型/组件用 `PascalCase`；变量/函数用 `camelCase`。
- 布尔变量以 `is/has/can/should` 开头。
- 避免缩写；`res` 只允许出现在局部坐标/URL 参数中，领域对象用 `residue`。
- 文件只放一个主要导出；工具文件可以多个纯函数。

---

## 4. 样式与设计 token

- 只使用 `DESIGN.md` 登记的语义 token；组件中**禁止**出现未登记十六进制颜色。
- Tailwind 类使用语义名：`bg-paper`、`bg-surface`、`text-ink`、`text-muted`、`border-line`、`text-accent-ink`、`bg-viewport`。
- 允许任意值（`[]`）仅用于**布局尺寸**（如 `grid-cols-[62fr_38fr]`），不得用于颜色、字号、圆角。
- 3D 结构颜色集中在 `features/structure/colors.ts`，并导出 `SCHEME_COLORS`；组件不得自行定义结构色。
- 间距使用 4px 基数的 token（4/8/12/16/24/32/48/64）。
- 圆角只用 `xs/sm/md/lg`。
- 不使用内联 `style` 处理颜色；Canvas 绘图除外（需要具体色值，从 colors 模块读取）。
- 尊重 `prefers-reduced-motion`；所有过渡时长来自 token。
- 每个新组件必须在 1440 / 768 / 390 三个宽度可用。

---

## 5. 状态与数据获取

- 全局状态用 Zustand；一个 store 文件：`stores/app-store.ts`。
- 组件通过 selector 订阅最小切片，避免整 store 重渲染。
- 不把服务端数据放进全局 store；用 `useEntry` 等 hook 的内存缓存。
- API 调用集中在 `lib/api.ts`，返回已解析的领域类型；组件不直接 `fetch`。
- 每个请求带 `AbortController`；组件卸载时 abort。
- 请求状态用判别联合表达：

  ```ts
  type AsyncState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: ApiError };
  ```

- 不允许用多个布尔值（`isLoading`、`isError`、`isSuccess`）表达同一状态。
- URL 是选中/视图状态的持久层；store 是运行时唯一源。

---

## 6. i18n

- 默认语言 `zh`；可选 `en`；持久化键 `foldlens.lang`。
- 所有用户可见文案来自 `src/i18n/zh.ts` / `en.ts`；禁止组件内字面量。
- key 采用点分命名：`workspace.analysis.ramachandran.title`。
- 插值用 `{{count}}` / `{{id}}`，不拼接句子。
- 专业术语在两种语言中保持英文：PDB、Cα、Ramachandran、B-factor、α-helix、β-strand、Å。
- 数字、日期、百分比用 `Intl`，随语言变化。
- 新增文案必须同时补 `zh` 与 `en`；缺一视为未完成。
- 语言切换后更新 `<html lang>` 与 `document.title`。

---

## 7. Python / FastAPI

- Python 3.12；全部函数写类型标注（参数 + 返回值）。
- 格式与 lint 用 Ruff：
  - `line-length = 88`
  - `target-version = "py312"`
  - 启用 `E,F,I,UP,B,SIM,RUF`
- 用 Pydantic v2 模型；对外 JSON 用 camelCase alias。
- 路由函数只做参数校验与调用 service；业务逻辑放 `services/`。
- 服务函数尽量纯；I/O（网络、文件）集中在 `services/rcsb.py`、`services/cache.py`。
- 禁止裸 `except:`；捕获具体异常并转成 `AppError`。
- 禁止 `from module import *`。
- 公共函数写 docstring（一句话说明输入/输出/副作用）；私有函数按需。
- 常量放模块顶部；疏水性表等数据放 `utils/`，不散落在函数里。
- 不在模块导入时做网络请求或重计算。
- 日志用 `logging.getLogger(__name__)`，禁止 `print`。

---

## 8. API / JSON

- 所有 JSON 字段 camelCase；Python 内部 snake_case，通过 Pydantic alias 转换。
- 缺失值用 `null`，不要用 `0`、`""`、`NaN` 冒充。
- 日期用 ISO 8601（`YYYY-MM-DD`）；时间戳用带时区 ISO 8601。
- 数字保持 number 类型，不要用字符串包裹。
- PDB ID 对外统一大写；缩略图路径用小写。
- 错误统一封套：`{ "error": { "code", "message", "detail" } }`。
- 新增/修改字段必须同步：
  1. `backend/app/models/schemas.py`
  2. `docs/ARCHITECTURE.md` 第 6/7 节
  3. `frontend/src/types/api.ts`
- 不允许前端猜测字段或做“兼容性 try/catch”。

---

## 9. 错误处理

- 后端：定义 `AppError(code, message, status_code)`；全局异常处理器输出封套。
- 前端：`ApiError` 含 `code` 与 HTTP 状态；UI 用 `errors.<CODE>` 翻译。
- 禁止把后端英文 `message` 直接展示给用户；`message` 只用于日志/调试。
- 每个异步视图必须实现：loading、empty、error（含重试）。
- 不允许静默吞错；至少 `console.debug`（仅开发）并给用户可见出口。
- 上游超时与 404 要区分：前者可重试，后者提示换 ID。

---

## 10. 数值、单位与舍入

| 量 | 单位 | 精度 | 显示 |
|---|---|---|---|
| φ / ψ | 度 | 1 位小数 | `−62.4°` |
| 距离 / 分辨率 | Å | 2 位小数 | `1.50 Å` |
| B-factor | Å² | 2 位小数 | `13.79 Å²` |
| 疏水性 | 无量纲 | 2 位小数 | `3.80` |
| 百分比 | % | 0 位小数 | `41%` |

- 存储层保留原始精度；显示层再舍入。
- 角度统一 `[-180, 180]`，不使用 `[0, 360]`。
- 不允许把 `NaN` 写入 JSON；必须转 `null`。
- 前端显示 `null` 为 `—`，不显示 `NaN`、`undefined`、`0`。
- 计数用整数；不要显示 `46.0`。

---

## 11. Git 与提交

- 只有用户明确要求时才 commit；不擅自提交。
- 分支：默认 `master`；功能分支用 `feat/<short-name>`、修复用 `fix/<short-name>`。
- 提交信息用 Conventional Commits：

  ```
  feat(workspace): 联动 3D 与序列的残基选中
  fix(analysis): 修正 φ/ψ 在末端残基的 NaN 处理
  docs: 补充 API 错误码表
  style(design): 调整残基卡间距
  refactor(structure): 抽出配色函数
  test(backend): 覆盖 1CRN 二级结构计数
  chore: 更新依赖锁文件
  ```

- 标题 ≤ 72 字符，祈使句；正文说明“为什么”，不重复“改了什么”。
- 一次提交只做一件事；不把格式化与功能混在一起。
- 不提交 `.env`、密钥、缓存、`node_modules`、`.venv`、截图产物。
- 不 `force push`，不改写已推送历史。
- 提交前跑对应验证命令。

---

## 12. 文档与注释

- 行为/契约/token/依赖变化 → 同一次会话更新对应文档。
- 每次会话结束 → 更新 `docs/ROADMAP.md` + 追加 `docs/DEVLOG.md`。
- 注释解释**为什么**，不复述代码在做什么。
- 不保留注释掉的旧代码；需要历史就看 git。
- `TODO` 必须带负责人/条件，并登记到 ROADMAP；禁止无限期悬挂。
- 文档中的命令必须可复制执行；路径用相对项目根的形式。

---

## 13. 测试

- 后端：pytest；测试不访问网络；使用 `data/samples/` 固定文件。
- 测试命名：`test_<行为>_<条件>`，例如 `test_annotate_sse_1crn_counts`。
- 断言具体值，不只断言“非空”。
- 前端：`npm run build` + `npm run lint` 必须通过；核心交互按手动清单验证。
- 修 bug 时先写能复现的测试（后端）或把复现步骤写进开发日志（前端）。
- 不为了让测试通过而放宽断言或跳过测试；如需跳过，写明原因并登记。

---

## 14. Definition of Done

一个任务只有同时满足以下条件才算完成：

- [ ] 功能按 `docs/PROJECT.md` 的规格实现
- [ ] 加载 / 空 / 错误三态齐全（涉及异步时）
- [ ] 中英文文案齐全
- [ ] 颜色 / 间距来自 token
- [ ] `npm run build` 通过
- [ ] `npm run lint` 通过
- [ ] `pytest` 通过（涉及后端时）
- [ ] 浏览器控制台无未处理错误
- [ ] 设计检查无 `FAIL`（涉及 UI 时）
- [ ] `docs/ROADMAP.md` 勾选更新
- [ ] `docs/DEVLOG.md` 追加记录（含验证命令与真实结果）
- [ ] 相关文档已同步（API / token / 依赖 / 环境）

---

## 15. 代码审查清单

- [ ] 是否存在硬编码文案、颜色、API 地址？
- [ ] 是否引入了未批准的依赖或页面？
- [ ] 选中状态是否仍然只有一处来源？
- [ ] 是否处理了 `null` / `NaN` / 空数组 / 单链 / 无配体？
- [ ] 是否处理了慢网、断网、404、超时？
- [ ] 大结构（4HHB / 6M0J）是否仍可交互？
- [ ] 键盘能否完成主流程？焦点是否可见？
- [ ] 英文界面是否有溢出或半汉化？
- [ ] 是否更新了文档与开发日志？
- [ ] 是否留下了未登记的 `TODO`？
