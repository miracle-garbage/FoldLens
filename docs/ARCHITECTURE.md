# FoldLens 架构与契约

> 本文是**技术契约的权威**：API 字段、数据模型、算法参数、模块边界以本文为准。  
> 产品范围见 `PRODUCT.md` / `docs/PROJECT.md`；视觉规则见 `DESIGN.md`；代码风格见 `docs/CONVENTIONS.md`。

- 版本：v1.0（2026-11-04）
- 状态：设计定稿，代码未开始

---

## 1. 系统上下文

```
┌──────────────────────────────┐
│  浏览器（React SPA）          │
│  ├─ 首页 / 工作台             │
│  ├─ 3Dmol 懒加载              │
│  └─ Canvas 图表               │
└──────────────┬───────────────┘
               │ /api（Vite 代理）
┌──────────────▼───────────────┐
│  FastAPI（127.0.0.1:8000）     │
│  ├─ entries / samples         │
│  ├─ uploads                   │
│  └─ health                    │
└──────┬───────────────┬───────┘
       │               │
┌──────▼──────┐  ┌─────▼────────────┐
│ data/samples│  │ .cache/           │
│ 6 个内置 CIF│  │ 结构 / 元数据 / 分析│
└─────────────┘  └─────┬────────────┘
                       │ 未命中
                 ┌─────▼────────────┐
                 │ RCSB PDB          │
                 │ files + data API  │
                 └──────────────────┘
```

**硬边界**

- 前端不直接请求 RCSB；所有外部请求经后端。
- 后端不连接数据库；缓存是文件系统。
- 3Dmol 只在工作台路由加载。

---

## 2. 运行时拓扑

| 进程 | 地址 | 启动方式 |
|---|---|---|
| Vite dev server | `http://localhost:5173` | `npm run dev` |
| FastAPI | `http://127.0.0.1:8000` | `uvicorn app.main:app --reload --port 8000` |

Vite 配置：

```ts
server: {
  port: 5173,
  proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: false } }
}
```

后端只绑定 `127.0.0.1`，不监听 `0.0.0.0`。

---

## 3. 目标目录结构

```
FoldLens/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/                 # main.tsx, router.tsx, providers.tsx
│   │   ├── components/          # 通用 UI：Button, Card, Tabs, ErrorState...
│   │   ├── features/
│   │   │   ├── home/            # 搜索、样例画廊
│   │   │   ├── workspace/       # 工作台壳、顶部栏、布局
│   │   │   ├── structure/       # 3D 视图、配色、选中高亮
│   │   │   ├── sequence/        # 序列面板
│   │   │   └── analysis/        # 残基卡、Ramachandran、接触图、档案
│   │   ├── i18n/                # index.ts, zh.ts, en.ts
│   │   ├── lib/                 # api.ts, format.ts, selection.ts
│   │   ├── stores/              # app-store.ts
│   │   ├── types/               # api.ts, domain.ts
│   │   └── styles/              # tokens.css, globals.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig*.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/                 # routes_health, routes_entries, routes_samples, routes_uploads
│   │   ├── core/                # config.py, errors.py, logging.py
│   │   ├── models/              # schemas.py
│   │   ├── services/            # rcsb.py, structure.py, analysis.py, samples.py, uploads.py, cache.py
│   │   └── utils/               # residues.py, hydrophobicity.py
│   ├── tests/                   # fixtures + test_*.py
│   └── pyproject.toml
├── data/
│   ├── samples/                 # 1CRN.cif ... 1L2Y.cif
│   └── thumbnails/              # 1crn_assembly-1.jpeg ...
└── scripts/
    ├── setup.sh
    ├── dev.sh
    ├── fetch-samples.sh
    └── design-check.sh
```

---

## 4. 前端架构

### 4.1 路由

| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | Home | 搜索 + 样例画廊 |
| `/entry/:entryId` | Workspace | `entryId` 为 4 位 PDB ID 或 `upload-<12hex>` |
| `*` | NotFound | 回到首页 |

工作台状态通过 query string 表达（见 4.6）。

### 4.2 状态分层

| 层 | 存放 | 例子 |
|---|---|---|
| URL | `useSearchParams` | `pdb`, `chain`, `res`, `scheme`, `repr` |
| 全局 UI 状态 | Zustand | 当前选中残基、表示方式、配色、可见链 |
| 服务端数据 | 内存缓存 Hook | `EntryAnalysis`、CIF 文本、样例列表 |
| 组件局部 | `useState` | 面板 tab、下拉开关、tooltip |

**不使用 TanStack Query**。`lib/api.ts` 提供带 `AbortController` 的 fetch；`lib/use-entry.ts` 用 `Map` 做进程内缓存，避免同一会话重复请求。

### 4.3 Zustand store

```ts
interface AppState {
  selection: ResidueKey | null;          // { chainId, resId, insCode }
  scheme: 'ss' | 'chain' | 'hydrophobicity' | 'bfactor' | 'element';
  representation: 'cartoon' | 'stick' | 'sphere';
  hiddenChains: string[];
  language: 'zh' | 'en';

  selectResidue(key: ResidueKey | null): void;
  setScheme(s: AppState['scheme']): void;
  setRepresentation(r: AppState['representation']): void;
  toggleChain(chainId: string): void;
  setLanguage(l: AppState['language']): void;
}
```

- `selection` 是**唯一**选中源；四个视图只读它。
- 不允许把选中状态存在组件内部。
- 语言同时写 `localStorage['foldlens.lang']` 并更新 `<html lang>`。

### 4.4 3D 视图生命周期

```
mount
  → 动态 import('3dmol')                    # 懒加载
  → createViewer(container, { backgroundColor:'#0C0F14' })
  → fetch CIF 文本 → addModel(text, 'cif')
  → setStyle(默认 cartoon + SS 着色)
  → zoomTo() → render()
  → setClickable / setHoverable
update (selection / scheme / representation / hiddenChains)
  → 重新应用 style → render()
unmount
  → clear() → 释放容器
```

要求：

- `useEffect` 的依赖必须覆盖所有影响样式的状态。
- 选中高亮不重建整个 viewer；只增删选中残基的 style。
- 容器尺寸变化用 `ResizeObserver` → `viewer.resize()`，不重置相机。
- 组件卸载必须清理 WebGL 上下文。

### 4.5 残基映射（关键风险点）

后端返回的 `ResidueRecord` 有 `(chainId, resId, insCode)`；3Dmol 的 atom 对象提供 `chain`、`resi`、`resn` 等字段。实现时必须：

1. 启动时为当前条目建立：
   ```ts
   const key = (chain: string, resi: number, icode?: string) =>
     `${chain}|${resi}|${icode ?? ''}`;
   const residueByKey = new Map<string, ResidueRecord>();
   const keyByAtomIndex = new Map<number, string>();
   ```
2. 用 `viewer.selectedAtoms({})` 遍历一次，把 `atom.index` 映射到残基 key。
3. 点击回调里用 `atom.index` 查 `keyByAtomIndex`，而不是直接拼字符串。
4. 若 3Dmol 不提供 `icode` 或与 Biotite 不一致，用“链 + 作者残基号”做二级映射，并在 M1 用 6M0J/4HHB 验证。

**验收**：点击 3D 中任意残基，序列中同名残基必须同时高亮；反之亦然。

### 4.6 URL 状态

```ts
type WorkspaceQuery = {
  pdb?: string;      // 4 位 ID；上传条目用 entryId 路径参数
  chain?: string;
  res?: string;      // 数字
  ins?: string;      // 插入码，可空
  scheme?: Scheme;
  repr?: Representation;
};
```

规则：

- 打开条目用 `navigate('/entry/1CRN?scheme=ss')`（push）。
- 选中、配色、表示变化用 `setSearchParams(..., { replace: true })`。
- 语言不写入 URL。
- 非法值静默回退到默认，不抛错。

### 4.7 图表实现

- **Canvas 2D**，按 `devicePixelRatio` 缩放，避免模糊。
- 绘制函数与 React 组件分离：`drawRamachandran(ctx, data, size, selection)`、`drawContactMap(...)`。
- 命中测试用数学计算（角度 → 像素；矩阵 → 行列），不依赖 DOM 元素。
- 图例、轴标签用 HTML 覆盖层，保证可选中、可翻译。
- 颜色从 `features/structure/colors.ts` 读取，不写死。

### 4.8 i18n

- `i18next` + `react-i18next`；资源在 `src/i18n/zh.ts` / `en.ts`。
- key 结构：`nav.*`、`home.*`、`workspace.*`、`analysis.*`、`errors.*`、`units.*`。
- 专业术语在两种语言中保持英文：PDB、Cα、Ramachandran、B-factor、α-helix、β-strand。
- 数字与日期用 `Intl.NumberFormat` / `Intl.DateTimeFormat`，随语言变化。
- 组件内禁止出现中英文句子字面量。

### 4.9 样式

- Tailwind CSS 4 + `src/styles/tokens.css` 的 CSS 变量。
- Tailwind theme 映射到变量：
  ```css
  @theme {
    --color-paper: #F2EFE7;
    --color-surface: #FAF8F3;
    --color-ink: #1A1917;
    --color-accent: #D9482B;
    --color-accent-ink: #B83A22;
    /* ... */
  }
  ```
- 组件只使用语义类（`bg-paper`、`text-ink`、`border-line`、`text-accent-ink`）。
- 3D 配色独立在 `features/structure/colors.ts`，不与 UI token 混用。

---

## 5. 后端架构

### 5.1 分层

```
api/        HTTP 路由、参数校验、错误映射
services/   业务逻辑：拉取、缓存、解析、计算
models/     Pydantic v2 schema（camelCase 输出）
core/       配置、错误、日志
utils/      纯函数：残基表、疏水性表
```

规则：

- `api` 可以依赖 `services` 与 `models`；`services` 不依赖 `api`。
- `services` 之间通过函数调用，不共享可变全局状态。
- 计算函数尽量纯：输入 `AtomArray`，输出普通数据。
- 所有对外 JSON 使用 camelCase（Pydantic alias generator）。

### 5.2 配置

`app/core/config.py`（pydantic-settings）：

| 变量 | 默认 | 说明 |
|---|---|---|
| `FOLDLENS_HOST` | `127.0.0.1` | 绑定地址 |
| `FOLDLENS_PORT` | `8000` | 端口 |
| `FOLDLENS_CACHE_DIR` | `.cache` | 缓存根 |
| `FOLDLENS_DATA_DIR` | `data` | 样例与缩略图根 |
| `FOLDLENS_RCSB_TIMEOUT` | `15` | 秒 |
| `FOLDLENS_MAX_UPLOAD_MB` | `50` | 上传上限 |

`.env.example` 只列变量与默认值，不含密钥；`.env` 被 gitignore。

### 5.3 缓存

| 内容 | 路径 | 失效 |
|---|---|---|
| 结构文件 | `.cache/structures/{entryId}.cif` | 永久；`?refresh=true` 重取 |
| 元数据 | `.cache/meta/{entryId}.json` | 永久 |
| 分析结果 | `.cache/analysis/{entryId}.json` | 结构文件 mtime 变化时重算 |
| 上传结构 | `.cache/uploads/{entryId}.cif` | 启动时清理 > 24h |
| 样例 | `data/samples/{ID}.cif` | 随仓库，不删除 |
| 缩略图 | `data/thumbnails/{id}_assembly-1.jpeg` | 随仓库 |

写入用“临时文件 + `os.replace`”保证原子性。实现见 `services/cache.py`。

---

## 6. API 契约

Base URL：`/api`。所有响应 `application/json; charset=utf-8`，结构文件除外。

### 6.1 端点总表

| 方法 | 路径 | 返回 |
|---|---|---|
| GET | `/api/health` | `HealthResponse` |
| GET | `/api/samples` | `SampleSummary[]` |
| GET | `/api/entries/{entryId}` | `EntryAnalysis` |
| GET | `/api/entries/{entryId}/structure` | `text/plain`（CIF/PDB 原文） |
| POST | `/api/uploads` | `UploadResponse` |
| GET | `/api/thumbnails/{pdbId}` | `image/jpeg` |

`entryId` 规则：

- 4 位字母数字 → PDB 条目，统一大写。
- `upload-<12位小写十六进制>` → 上传条目。
- 其他 → `400 INVALID_ENTRY_ID`。

### 6.2 `GET /api/health`

```json
{ "status": "ok", "version": "0.1.0" }
```

### 6.3 `GET /api/samples`

```json
[
  {
    "pdbId": "1CRN",
    "name": "Crambin",
    "description": "46 个残基的植物种子蛋白，结构生物学经典入门样例。",
    "thumbnailUrl": "/api/thumbnails/1crn",
    "chainCount": 1,
    "residueCount": 46,
    "resolution": 1.5
  }
]
```

顺序固定：1CRN、1UBQ、1LYZ、4HHB、6M0J、1L2Y。

### 6.4 `GET /api/entries/{entryId}` → `EntryAnalysis`

```json
{
  "meta": {
    "entryId": "1CRN",
    "pdbId": "1CRN",
    "structureFormat": "cif",
    "title": "WATER STRUCTURE OF A HYDROPHOBIC PROTEIN AT ATOMIC RESOLUTION. PENTAGON RINGS OF WATER MOLECULES IN CRYSTALS OF CRAMBIN",
    "method": "X-RAY DIFFRACTION",
    "resolution": 1.5,
    "rFree": null,
    "depositedAt": "1981-04-30",
    "atomCount": 327,
    "residueCount": 46,
    "chainCount": 1,
    "ligands": [],
    "missingResidues": []
  },
  "residues": [
    {
      "index": 0,
      "chainId": "A",
      "resId": 1,
      "insCode": "",
      "name3": "THR",
      "name1": "T",
      "sse": "coil",
      "phi": null,
      "psi": null,
      "bFactor": 13.79,
      "hydrophobicity": -0.7
    }
  ],
  "contacts": [[0, 5], [0, 6]],
  "stats": {
    "helixCount": 18,
    "strandCount": 4,
    "coilCount": 24,
    "meanBFactor": 12.34,
    "hydrophobicFraction": 0.41
  }
}
```

约束：

- `residues` 是**全局扁平数组**，`index` 从 0 连续递增。
- `contacts` 的索引指向 `residues`，每对 `i < j`，且 `j - i >= 3`。
- `residueCount` 只统计蛋白质残基；`atomCount` 统计 model 1 的全部原子。
- 缺失值一律 `null`，不使用 `0` 或空字符串冒充。
- 插入码无值为 `""`。

### 6.5 `GET /api/entries/{entryId}/structure`

- 返回原始 mmCIF 或 PDB 文本，`text/plain; charset=utf-8`。
- `Content-Disposition: inline; filename="{entryId}.{cif|pdb}"`。
- 前端 3Dmol 用 `addModel(text, meta.structureFormat)` 解析；**不要根据扩展名或内容猜测格式**。
- 不支持 Range 请求（文件小）。

### 6.6 `POST /api/uploads`

- `multipart/form-data`，字段名 `file`。
- 允许 `.cif`、`.mmcif`、`.pdb`，≤ 50MB。
- 校验：扩展名 + 内容首部（CIF 含 `data_`；PDB 含 `ATOM`/`HEADER`）。
- 成功：`201`，返回：

```json
{
  "entryId": "upload-3f2a9c1b7d4e",
  "analysis": { "...": "同 EntryAnalysis" }
}
```

- 随后 `GET /api/entries/upload-.../structure` 取原文。
- 失败：`413 FILE_TOO_LARGE`、`422 UNSUPPORTED_FORMAT`、`422 PARSE_FAILED`。

### 6.7 `GET /api/thumbnails/{pdbId}`

- 返回 `data/thumbnails/{lowercase}_assembly-1.jpeg`。
- 不存在 → `404 ENTRY_NOT_FOUND`。
- 仅允许 4 位 ID，防止路径穿越。

### 6.8 错误封套

```json
{
  "error": {
    "code": "ENTRY_NOT_FOUND",
    "message": "PDB entry 9XYZ was not found.",
    "detail": null
  }
}
```

| HTTP | code | 前端 i18n key |
|---|---|---|
| 400 | `INVALID_ENTRY_ID` | `errors.INVALID_ENTRY_ID` |
| 404 | `ENTRY_NOT_FOUND` | `errors.ENTRY_NOT_FOUND` |
| 413 | `FILE_TOO_LARGE` | `errors.FILE_TOO_LARGE` |
| 422 | `UNSUPPORTED_FORMAT` | `errors.UNSUPPORTED_FORMAT` |
| 422 | `PARSE_FAILED` | `errors.PARSE_FAILED` |
| 502 | `UPSTREAM_UNAVAILABLE` | `errors.UPSTREAM_UNAVAILABLE` |
| 504 | `UPSTREAM_TIMEOUT` | `errors.UPSTREAM_TIMEOUT` |
| 500 | `INTERNAL_ERROR` | `errors.INTERNAL_ERROR` |

`detail` 只放可公开的诊断信息；不返回堆栈。

---

## 7. 数据模型（TypeScript 对应）

```ts
export type Sse = 'helix' | 'strand' | 'coil';
export type Scheme = 'ss' | 'chain' | 'hydrophobicity' | 'bfactor' | 'element';
export type Representation = 'cartoon' | 'stick' | 'sphere';

export interface ResidueKey {
  chainId: string;
  resId: number;
  insCode: string;
}

export interface ResidueRecord extends ResidueKey {
  index: number;
  name3: string;
  name1: string | null;
  sse: Sse;
  phi: number | null;
  psi: number | null;
  bFactor: number | null;
  hydrophobicity: number | null;
}

export interface LigandRecord extends ResidueKey {
  compId: string;
  name: string;
  atomCount: number;
}

export interface MissingRange {
  chainId: string;
  start: number;
  end: number;
}

export interface EntryMeta {
  entryId: string;
  pdbId: string | null;
  structureFormat: 'cif' | 'pdb';
  title: string;
  method: string | null;
  resolution: number | null;
  rFree: number | null;
  depositedAt: string | null;
  atomCount: number;
  residueCount: number;
  chainCount: number;
  ligands: LigandRecord[];
  missingResidues: MissingRange[];
}

export interface EntryStats {
  helixCount: number;
  strandCount: number;
  coilCount: number;
  meanBFactor: number | null;
  hydrophobicFraction: number | null;
}

export interface EntryAnalysis {
  meta: EntryMeta;
  residues: ResidueRecord[];
  contacts: [number, number][];
  stats: EntryStats;
}

export interface SampleSummary {
  pdbId: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  chainCount: number;
  residueCount: number;
  resolution: number | null;
}
```

Python 端用 Pydantic v2 的 `alias_generator=to_camel`、`populate_by_name=True`，字段名保持 `snake_case`。

---

## 8. 算法规格

> 全部基于 **Biotite 2.0.0** 实测 API。旧版 Biotite 文档中的 `PDBxFile` 已不存在。

### 8.1 载入结构

```python
from biotite.structure.io import pdbx
f = pdbx.CIFFile.read(path)
array = pdbx.get_structure(f, model=1)      # 只取第一个 model
```

PDB 文件：

```python
from biotite.structure.io import pdb
f = pdb.PDBFile.read(path)
array = pdb.get_structure(f, model=1)
```

### 8.2 蛋白质残基

- 用 `biotite.structure.filter_amino_acids(array)` 得到蛋白质原子掩码。
- 用 `get_residue_count(protein_array)` 取残基数，`get_residue_starts(protein_array)` 取每个残基的起始原子索引。
- `get_residues(protein_array)` 在 Biotite 2.0 返回 `(residue_ids, residue_names)`，不是残基级 AtomArray；不要按旧版文档使用。
- SSE、φ/ψ 均按同样的残基顺序对齐；实现后用测试锁定长度与顺序。
- 只支持蛋白质；核酸结构返回 `UNSUPPORTED_FORMAT`。
- 标准 20 种氨基酸映射为单字母；非标准残基 `name1 = null`。

### 8.3 二级结构（P-SEA）

```python
sse = struc.annotate_sse(protein_array)
```

返回值是整数数组，映射（已实测）：

| 值 | 枚举 | 输出 |
|---|---|---|
| −1 | `NONE` | `coil` |
| 0 | `COIL` | `coil` |
| 1 | `HELIX` | `helix` |
| 2 | `STRAND` | `strand` |

1CRN 的基准值：`helix=18, strand=4, coil=24`（共 46 个残基）。

### 8.4 主链二面角

```python
phi, psi, omega = struc.dihedral_backbone(protein_array)
```

- 返回弧度；用 `np.degrees` 转度。
- `NaN` → JSON `null`。
- 保留 1 位小数。
- 数组长度应与残基数一致（1CRN 实测 46）；实现后用测试锁定。

### 8.5 疏水性

Kyte–Doolittle 标度：

| 残基 | 值 | 残基 | 值 | 残基 | 值 | 残基 | 值 |
|---|---|---|---|---|---|---|---|
| A | 1.8 | C | 2.5 | D | −3.5 | E | −3.5 |
| F | 2.8 | G | −0.4 | H | −3.2 | I | 4.5 |
| K | −3.9 | L | 3.8 | M | 1.9 | N | −3.5 |
| P | −1.6 | Q | −3.5 | R | −4.5 | S | −0.8 |
| T | −0.7 | V | 4.2 | W | −0.9 | Y | −1.3 |

- 非标准残基 → `null`。
- 保留 2 位小数。
- 前端色阶范围固定为 `[−4.5, 4.5]`。

### 8.6 B-factor

- 每个残基取其所有原子的 `b_factor` 均值。
- 全部为 `NaN` → `null`。
- 保留 2 位小数。
- 前端按当前条目的 min/max 归一化；若 min == max，全部使用中色。

### 8.7 接触图

```python
ca = protein_array[protein_array.atom_name == "CA"]
matrix = struc.CellList(ca, cell_size=8.0).create_adjacency_matrix(8.0)
```

- 阈值 8.0 Å。
- 只保留 `i < j` 且 `j - i >= 3`。
- 输出为 `[i, j]` 整数对数组，索引对应 `residues`。
- 1CRN 实测：邻接矩阵含 46 个对角自对，去对角后 203 对；再加 `|i−j|≥3` 后为 **114 对**。测试以此为基准。

### 8.8 配体

- 取 HETATM 且非溶剂（`~struc.filter_solvent(array)`）。
- 按 `(chain_id, res_id, ins_code, res_name)` 分组。
- 排除水（`HOH`、`WAT`）。
- `name` 优先取 mmCIF 的 `_pdbx_entity_nonpoly.name`；缺失时用 `res_name`。
- 记录原子数。

### 8.9 缺失残基

- 对每个蛋白质链，收集已观测的 `res_id` 唯一值并排序。
- 相邻观测值差 > 1 → 生成 `[prev+1, next−1]` 范围。
- 不推断 N 端 / C 端缺失。
- 插入码不参与断档计算；在文档中注明这一限制。

### 8.10 统计

- `helixCount / strandCount / coilCount`：按 `residues` 计数。
- `meanBFactor`：非空 B-factor 的算术平均。
- `hydrophobicFraction`：KD > 0 的残基数 / KD 非空残基数；分母为 0 → `null`。

### 8.11 元数据

优先 `GET https://data.rcsb.org/rest/v1/core/entry/{ID}`：

- `struct.title`
- `exptl.method`
- `refine.ls_d_res_high`
- `refine.ls_R_free`
- `rcsb_accession_info.deposit_date`

失败时从 CIF 头兜底：

- `_struct.title`
- `_exptl.method`
- `_refine.ls_d_res_high`
- `_refine.ls_R_free`

再失败则字段为 `null`，不阻塞结构展示。

---

## 9. 缓存与离线

1. 样例：`data/samples/{ID}.cif` 永远优先。
2. 其他 PDB ID：`.cache/structures/{ID}.cif`。
3. 未命中：HTTPX 拉取，超时 15s，重试 1 次；写缓存。
4. 元数据、分析结果分别缓存，避免重复计算。
5. 断网且无缓存：`UPSTREAM_UNAVAILABLE` / `UPSTREAM_TIMEOUT`，前端提供“打开内置样例”。
6. 缩略图不依赖网络。

---

## 10. 性能策略

- 后端：
  - NumPy 向量化；避免逐原子 Python 循环。
  - 分析结果缓存为 JSON，二次请求直接读。
  - RCSB 拉取用异步 HTTPX；同一 `entryId` 的并发请求加进程内锁，避免重复下载。
- 前端：
  - 3Dmol 动态 `import()`。
  - 首页不引入任何 3D 代码。
  - Canvas 图表按需重绘，不在每次 store 变化时重绘全部。
  - `ResizeObserver` 防抖 100ms。
  - 大结构（>3000 残基）接触图降采样。

---

## 11. 安全

- 绑定 `127.0.0.1`。
- `entryId` 白名单正则；缩略图 ID 同样校验。
- 上传：大小、扩展名、内容首部三重校验；不把原文件名拼进路径。
- 不执行用户提供的任何脚本；3Dmol 只解析结构数据。
- CORS 只允许本地前端来源。
- 错误响应不包含文件路径、堆栈、环境变量。
- 依赖锁定：`package-lock.json`、`uv.lock` 入库。

---

## 12. 日志

- 后端：标准库 `logging`，格式 `时间 级别 模块 - 消息`。
  - INFO：请求条目、缓存命中/未命中、耗时。
  - WARNING：上游重试、元数据兜底。
  - ERROR：解析失败、未处理异常（含 entryId，不含堆栈给前端）。
- 前端：开发环境 `console.debug`；生产环境不输出用户可感知的错误细节，只显示错误码与可读说明。

---

## 13. 已知技术风险

| 风险 | 说明 | 缓解 |
|---|---|---|
| 3Dmol 残基标识 | `resi`/`icode` 与 Biotite 的作者编号可能不完全一致 | M1 建立 atom index → residue key 映射；用 4HHB/6M0J 验证 |
| 逐残基着色性能 | 大结构逐残基 `addStyle` 可能慢 | 优先用 `colorfunc`；必要时缓存 style 结果 |
| Biotite API 变化 | 2.0 与旧文档差异大 | 以本机实测为准；关键调用写测试 |
| NMR ensemble | 只取 model 1 | 在文档与界面注明 |
| 核酸结构 | 不支持 | 明确报 `UNSUPPORTED_FORMAT` |
| 大结构 | 6M0J 尚可，病毒衣壳不行 | 不纳入样例；>3000 残基提示 |
| 字体 | CJK 包过大 | 用系统 Noto CJK，回退栈 |

---

## 14. 测试策略

### 后端（pytest）

- `test_parse_1crn`：46 残基、1 链、327 原子。
- `test_sse_1crn`：helix 18 / strand 4 / coil 24。
- `test_dihedral_range`：所有非空 φ/ψ ∈ [−180, 180]。
- `test_contacts`：非空、`i<j`、`j-i>=3`、无自环；1CRN 过滤后应为 114 对。
- `test_ligands_4hhb`：至少包含 HEM。
- `test_missing_residues`：构造样例断档。
- `test_invalid_entry_id`：400。
- `test_not_found`：404（用假 ID，monkeypatch 上游）。
- `test_upload_invalid`：422。
- `test_cache_hit`：第二次请求不触发上游（monkeypatch 计数）。

测试不访问网络；使用 `data/samples/` 中的固定文件。

### 前端

- `npm run build`（tsc + vite build）。
- `npm run lint`。
- 手动清单见 `docs/PROJECT.md` 第 10 节。
- 设计检查：`inspect.mjs --app` 三档截图，无 `FAIL`。
- Vitest 暂不引入；M2 评估是否补充。

---

## 15. 模块边界速查

| 想改… | 去哪 |
|---|---|
| API 字段 | `backend/app/models/schemas.py` + 本文第 6 节 |
| 二级结构 / 二面角 / 接触算法 | `backend/app/services/analysis.py` + 本文第 8 节 |
| 3D 配色 | `frontend/src/features/structure/colors.ts` + `DESIGN.md` |
| 联动逻辑 | `frontend/src/stores/app-store.ts` |
| 图表绘制 | `frontend/src/features/analysis/*` |
| 文案 | `frontend/src/i18n/{zh,en}.ts` |
| 设计 token | `DESIGN.md` + `frontend/src/styles/tokens.css` |
| 运行环境 | `docs/ENVIRONMENT.md` |
