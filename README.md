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
- **高清导出**：支持导出 PNG（2 倍像素密度）和 SVG 矢量图，适合打印和论文插入

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

### 保存和导出

- 点击「保存」将项目保存为 `.thesisflow` 文件
- 点击「打开」加载之前保存的项目
- 点击「导出 PNG」或「导出 SVG」将当前画布导出为图片

### 快捷操作

| 快捷键 | 功能 |
|--------|------|
| Ctrl + 滚轮 | 缩放画布 |
| 鼠标拖拽空白区域 | 平移画布 |
| Shift + 拖拽 | 框选多个节点 |
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
| electron-builder | Windows 打包 |

---

## 项目结构

```
thesisflow/
├── src/
│   ├── main/                      # Electron 主进程
│   │   └── index.ts               # 窗口创建、IPC 监听、菜单移除
│   ├── preload/                   # 预加载脚本（contextBridge）
│   │   └── index.ts               # 暴露 window.thesisFlow API
│   ├── shared/                    # 主进程与渲染进程共享类型
│   │   ├── types.ts               # FlowNode / ModuleNode / GraphEdge / ProjectFile
│   │   └── ipc.ts                 # ThesisFlowAPI 接口定义
│   └── renderer/                  # React 前端
│       ├── index.html             # 入口 HTML，含 CSP 策略
│       └── src/
│           ├── main.tsx           # React 根挂载
│           ├── App.tsx            # 布局：工具栏 + 三栏主体
│           ├── registerNodes.ts   # X6 自定义节点注册
│           ├── components/
│           │   ├── graph-editor/  # X6 画布组件
│           │   ├── sidebar/       # 左侧节点面板 + 连线样式
│           │   ├── toolbar/       # 顶部工具栏
│           │   └── property-panel/# 右侧属性面板
│           ├── stores/            # Zustand 状态管理
│           ├── types/             # 渲染进程类型导出
│           ├── utils/             # 工具函数（自动布局、Graph 获取）
│           └── styles/            # 全局 CSS
├── electron.vite.config.ts        # electron-vite 配置
├── package.json                   # 依赖与脚本
├── tsconfig.json                  # TypeScript 配置（引用子配置）
├── tsconfig.node.json             # main + preload + shared 类型检查
└── tsconfig.web.json              # renderer 类型检查
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
| `minimize()` | 最小化窗口 |
| `maximize()` | 最大化/还原窗口 |
| `close()` | 关闭窗口 |

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

支持多画布扩展（`sheets` 数组），当前版本使用 `sheets[0]`。

---

## 架构设计

- **安全隔离**：Main 进程不向渲染进程暴露 Node.js API，所有文件操作通过 IPC 中转
- **数据驱动**：Zustand 作为单一数据源，X6 画布通过增量同步（避免 `fromJSON` 导致的无限循环）
- **节点注册**：通过 X6 `Graph.registerNode` 全局注册自定义形状，统一学术简约风格（黑色边框、白色填充、字号 12px）
- **端口系统**：每个节点带 4 个连接端口（上/右/下/左），悬停时显示，离开时隐藏
- **连线路由**：直箭头使用直线连接，自适应箭头使用 Manhattan 路由 + 圆角连接器自动避障

---

## 许可证

MIT License