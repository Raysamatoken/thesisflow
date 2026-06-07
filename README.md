# ThesisFlow

> 毕业设计 / 课题报告流程图与模块图快速生成工具

ThesisFlow 是一款基于 Electron + React + AntV X6 构建的桌面应用，专为高校学生和研究人员设计，用于快速创建符合学术规范的流程图、模块图和系统架构图。所有图元均采用黑白简约风格，导出后可直接用于论文、开题报告和答辩 PPT。

---

## 功能特性

### 流程图节点

| 节点类型 | 形状 | 用途 |
|---------|------|------|
| 开始 / 结束 | 椭圆形 | 流程起止标记 |
| 处理步骤 | 圆角矩形 | 一般处理过程 |
| 判断条件 | 菱形 | 条件分支判断 |
| 输入 / 输出 | 平行四边形 | 数据输入输出 |
| 子流程 | 双竖线矩形 | 引用外部子流程 |

### 模块图节点

| 节点类型 | 形状 | 用途 |
|---------|------|------|
| 系统模块 | 带标题分隔线矩形 | 分层架构中的系统模块 |

### 连线样式

- **直箭头** — 直线连接，适合简单线性流程
- **自适应弯曲箭头** — Manhattan 路由自动绕开障碍物，适合复杂分支流程

### 核心能力

- **拖拽式编辑**：从左侧面板拖拽节点到画布，从节点端口拖拽创建连线
- **节点缩放**：选中节点后拖拽边角可自由调整大小
- **属性面板**：选中节点或连线后，右侧面板可编辑文本内容、字号、填充色、边框色、字体颜色和备注
- **自动排版**：一键使用 Dagre 算法将节点自上而下整齐排列
- **项目保存 / 打开**：以 `.thesisflow` JSON 格式持久化项目，支持多次编辑
- **高清导出**：支持导出 PNG（2 倍像素密度）、SVG 矢量图和 PDF 文档，适合打印和论文插入
- **多 Sheet 标签页**：支持在同一个项目中创建多个流程图/模块图，自由切换
- **撤销 / 重做**：完整的历史记录，支持 Ctrl+Z / Ctrl+Y 快捷键
- **复制 / 粘贴**：支持节点和连线的复制粘贴，自动偏移避免重叠
- **节点对齐 / 分布**：多选节点后显示对齐工具栏，支持 6 种对齐和 2 种分布
- **搜索节点**：侧边栏节点库搜索 + 画布内 Ctrl+F 全局搜索定位
- **右键菜单**：画布节点、连线、标签页均支持右键操作
- **自动保存**：每 30 秒自动保存（需先手动保存一次）
- **最近文件**：工具栏「最近」按钮快速访问历史项目，点击即可重新打开
- **对齐辅助线**：拖拽节点时自动显示与其他节点的对齐参考线

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- Windows / macOS / Linux

### 克隆项目

```bash
git clone https://github.com/Raysamatoken/thesisflow.git
cd thesisflow
```

### 安装依赖

```bash
npm install
```

### 启动开发模式

```bash
npm run dev
```

启动后会打开 Electron 窗口，支持热重载。开发时 Vite 会自动监听文件变化并热更新渲染进程。

### 构建生产版本

```bash
# 构建 Electron 资源（main + preload + renderer）
npm run build

# 打包 Windows 便携版（免安装）
npm run build:win
```

打包产物位于 `dist/ThesisFlow-0.1.0-portable.exe`，双击即可运行，无需安装。

### 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发模式（热重载） |
| `npm run build` | 构建生产资源 |
| `npm run build:win` | 打包 Windows 便携版 |
| `npm run preview` | 预览构建产物 |
| `npm run typecheck` | 运行 TypeScript 类型检查 |
| `npm run lint` | 运行 ESLint 代码检查 |
| `npm run lint:fix` | 自动修复 ESLint 问题 |
| `npm run format` | 运行 Prettier 格式化 |
| `npm run test` | 运行单元测试 |
| `npm run test:watch` | 监听模式运行测试 |

### 直接下载

前往 [Releases](https://github.com/Raysamatoken/thesisflow/releases) 页面下载最新的 `ThesisFlow-x.x.x-portable.exe`，双击运行即可。

---

## 使用说明

### 创建流程图

1. 从左侧面板将节点拖拽到中间画布
2. 鼠标悬停在节点上，从出现的端口拖拽到另一个节点完成连线
3. 或从左侧「连线样式」区域拖拽一个样式到源节点，再点击目标节点
4. 选中节点后，在右侧面板修改文本和样式
5. 点击工具栏「自动排版」一键整理布局

### 多 Sheet 管理

- 点击标签页栏的 `+` 按钮新建画布
- 右键标签页可重命名、复制、删除
- 支持流程图和模块图两种类型

### 节点对齐

- 按住 `Shift` 拖拽框选多个节点
- 底部自动弹出对齐工具栏
- 支持左/中/右/顶/中/底 6 种对齐，水平/垂直 2 种分布

### 搜索节点

- 侧边栏顶部输入框可过滤节点模板
- 按 `Ctrl+F` 打开全局搜索，可搜索画布中节点的标签和备注

### 保存和导出

- 点击「保存」将项目保存为 `.thesisflow` 文件
- 点击「打开」加载之前保存的项目
- 点击「最近」访问历史项目，点击文件名即可重新打开
- 点击「导出 PNG」将当前画布导出为高清图片
- 点击「导出 SVG」将当前画布导出为矢量图
- 点击「导出 PDF」将当前画布导出为 PDF 文档（基于 jspdf + svg2pdf.js）

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+N` | 新建项目 |
| `Ctrl+O` | 打开项目 |
| `Ctrl+S` | 保存项目 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` / `Ctrl+Shift+Z` | 重做 |
| `Ctrl+C` | 复制选中节点/连线 |
| `Ctrl+V` | 粘贴 |
| `Delete` / `Backspace` | 删除选中项 |
| `Ctrl+F` | 搜索节点 |
| `Ctrl++` / `Ctrl+=` | 放大画布 |
| `Ctrl+-` | 缩小画布 |
| `Ctrl+0` | 适应画布 |
| `Ctrl+9` | 实际大小 (100%) |
| `Ctrl+滚轮` | 缩放画布 |
| 鼠标拖拽空白区域 | 平移画布 |
| `Shift` + 拖拽 | 框选多个节点 |
| 选中节点后拖拽边角 | 调整节点大小 |

---

## 技术栈

| 技术 | 用途 |
|------|------|
| Electron 33 | 桌面应用框架 |
| electron-vite | Vite 构建集成 |
| React 18 | UI 框架 |
| TypeScript 5 | 类型安全 |
| AntV X6 2.x | 图编辑引擎 |
| @antv/layout | Dagre 自动排版算法 |
| @antv/x6-plugin-transform | 节点缩放插件 |
| @antv/x6-plugin-export | 画布导出插件 |
| Ant Design 5 | UI 组件库 |
| Zustand 5 | 状态管理 |
| jspdf + svg2pdf.js | PDF 导出 |
| electron-builder | Windows 打包 |
| Vitest | 单元测试框架 |
| ESLint 10 | 代码检查 |
| Prettier | 代码格式化 |
| Husky | Git hooks |

---

## 项目结构

```
thesisflow/
├── src/
│   ├── main/                          # Electron 主进程
│   │   └── index.ts                   # 窗口创建、IPC 监听、自动保存、最近文件、PDF 保存
│   ├── preload/                       # 预加载脚本（contextBridge）
│   │   └── index.ts                   # 暴露 window.thesisFlow API（含 exportPdf、openFileByPath）
│   ├── shared/                        # 主进程与渲染进程共享类型
│   │   ├── types.ts                   # FlowNode / ModuleNode / GraphEdge / ProjectFile + 类型守卫
│   │   └── ipc.ts                     # ThesisFlowAPI 接口定义
│   └── renderer/                      # React 前端
│       ├── index.html                 # 入口 HTML，含 CSP 策略
│       └── src/
│           ├── main.tsx               # React 根挂载
│           ├── App.tsx                # 布局：工具栏 + 标签页 + 三栏主体 + 对齐工具栏
│           ├── registerNodes.ts       # X6 自定义节点注册
│           ├── components/
│           │   ├── graph-editor/      # X6 画布组件
│           │   │   ├── GraphCanvas.tsx # 画布初始化、事件监听、store 同步、右键菜单
│           │   │   ├── SearchPanel.tsx # 全局搜索浮层（Ctrl+F）
│           │   │   └── EdgeLabelEditor.tsx # 连线标签编辑弹窗
│           │   ├── sidebar/           # 左侧节点面板 + 连线样式 + 搜索过滤
│           │   ├── toolbar/           # 顶部工具栏 + 撤销重做 + 复制粘贴 + 缩放 + PDF 导出 + 最近文件
│           │   ├── property-panel/    # 右侧属性面板
│           │   ├── sheet-tabs/        # 多 Sheet 标签页管理
│           │   └── alignment-toolbar/ # 节点对齐/分布工具栏
│           ├── stores/
│           │   ├── useGraphStore.ts   # 图数据状态管理 + Sheet 管理 + 对齐操作（sheets 自动同步）
│           │   ├── useHistoryStore.ts # 撤销/重做历史管理
│           │   └── __tests__/         # 单元测试（45 个测试用例）
│           ├── types/
│           │   ├── index.ts           # 渲染进程类型导出
│           │   └── x6-events.ts       # X6 事件类型定义（X6NodeEvent / X6EdgeEvent 等）
│           ├── utils/
│           │   ├── autoLayout.ts      # 自动排版（Dagre）
│           │   ├── getGraph.ts        # 获取 X6 Graph 实例
│           │   ├── common.ts          # 公共工具函数（endpointId）
│           │   ├── exportPdf.ts       # SVG → PDF 导出（jspdf + svg2pdf.js）
│           │   └── __tests__/
│           │       └── common.test.ts # 公共工具函数测试
│           └── styles/                # 全局 CSS + 主题
├── src/test/                          # 测试配置
│   └── setup.ts                       # 测试环境设置
├── electron.vite.config.ts            # electron-vite 配置
├── vitest.config.ts                   # Vitest 测试配置
├── eslint.config.mjs                  # ESLint flat config
├── .prettierrc                        # Prettier 配置
├── .husky/                            # Git hooks
├── package.json                       # 依赖与脚本
├── tsconfig.json                      # TypeScript 配置（引用子配置）
├── tsconfig.node.json                 # main + preload + shared 类型检查
└── tsconfig.web.json                  # renderer 类型检查
```

---

## IPC API

ThesisFlow 严格遵循 Electron 安全规范，禁用 `nodeIntegration`，通过 Preload + `contextBridge` 暴露 IPC API。渲染进程通过 `window.thesisFlow` 访问主进程能力：

| 方法 | 说明 |
|------|------|
| `createProject()` | 新建项目，返回默认 ProjectFile |
| `openProject()` | 打开 .thesisflow 文件，返回 ProjectFile 或 null |
| `saveProject(data, path?)` | 保存项目，可指定路径或弹出对话框 |
| `exportImage(data, format)` | 导出 PNG/SVG 图片 |
| `exportPdf(data, name)` | 导出 PDF 文档 |
| `getRecentFiles()` | 获取最近文件列表 |
| `clearRecentFiles()` | 清空最近文件列表 |
| `openFileByPath(path)` | 通过绝对路径打开项目文件（用于最近文件） |
| `minimize()` | 最小化窗口 |
| `maximize()` | 最大化/还原窗口 |
| `close()` | 关闭窗口 |
| `onAutoSave(callback)` | 监听自动保存触发事件 |

---

## 项目文件格式

`.thesisflow` 文件是纯 JSON 格式，结构如下：

```json
{
  "version": "1.0.0",
  "name": "项目名称",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "sheets": [
    {
      "id": "sheet-xxx",
      "name": "流程图 1",
      "type": "flow",
      "nodes": [],
      "edges": []
    }
  ]
}
```

支持多画布（`sheets` 数组），每个 sheet 可独立编辑。

---

## 架构设计

- **安全隔离**：Main 进程不向渲染进程暴露 Node.js API，所有文件操作通过 IPC 中转
- **数据驱动**：Zustand 作为单一数据源，X6 画布通过增量同步（避免 `fromJSON` 导致的无限循环）。所有 mutation 同步更新 sheets 数组
- **节点注册**：通过 X6 `Graph.registerNode` 全局注册自定义形状，统一学术简约风格（黑色边框、白色填充、字号 12px）
- **端口系统**：每个节点带 4 个连接端口（上/右/下/左），悬停时显示，离开时隐藏
- **连线路由**：直箭头使用直线连接，自适应箭头使用 Manhattan 路由 + 圆角连接器自动避障
- **历史管理**：独立的 history store 记录操作历史，支持撤销/重做
- **对齐系统**：基于选中节点的坐标计算，支持左/中/右/顶/中/底对齐和水平/垂直分布
- **搜索系统**：侧边栏过滤 + 全局搜索（Ctrl+F），支持标签和备注搜索
- **PDF 导出**：渲染进程通过 jspdf + svg2pdf.js 生成 PDF，通过 IPC 保存到本地
- **组件拆分**：GraphCanvas 拆分为 GraphCanvas、SearchPanel、EdgeLabelEditor 三个独立组件

---

## 开发指南

### 代码规范

项目使用 ESLint + Prettier 进行代码规范管理：

```bash
# 检查代码规范
npm run lint

# 自动修复
npm run lint:fix

# 格式化代码
npm run format
```

Git 提交时会自动运行 `lint-staged` 检查。

### 测试

```bash
# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# 带 UI
npm run test:ui
```

测试覆盖核心 store 逻辑（useHistoryStore、useGraphStore、useTemplateStore）和公共工具函数，共 55 个测试用例。

---

## 许可证

MIT License
