## ThesisFlow 代码审查报告

审查日期：2026-06-13 | 审查版本：v0.1.0 | 审查范围：全量源码

---

### 第一部分：确认的 Bug

#### BUG-01：GraphCanvas useEffect 闭包陈旧引用（严重）

文件：`src/renderer/src/components/graph-editor/GraphCanvas.tsx`，第 169–331 行

主 `useEffect` 的依赖数组为空 `[]`，意味着其中的所有事件回调只在组件首次渲染时注册一次。但这些回调通过闭包捕获了 `edgeCreationMode`、`edgeCreationSourceId`、`edgeStyleId`、`nodes`、`edges` 等 Zustand selector 的值，这些值在后续渲染中不会被更新。

具体表现：

- `connecting.createEdge()` 闭包中的 `edgeStyleId` 永远是初始值 `'straight-arrow'`。用户在侧边栏切换连线样式后再通过端口拖拽创建连线，仍然会使用直箭头样式。
- `node:mouseenter` 和 `node:mouseleave` 中的 `edgeCreationMode` 永远为 `false`（初始值）。进入连线创建模式后，悬停节点不会出现蓝色高亮提示。
- `node:click` 中的 `edgeCreationMode` 和 `edgeCreationSourceId` 同理，导致从侧边栏拖拽连线样式后点击目标节点无法完成连线。

修复方向：将事件处理器改为通过 `useGraphStore.getState()` 读取最新状态，而非通过闭包捕获 selector 返回值；或将需要响应变化的逻辑拆分到独立的 `useEffect` 中。

---

#### BUG-02：快捷键 Ctrl+0 与 Ctrl+9 行为互换（中等）

文件：`src/renderer/src/components/toolbar/ToolBar.tsx`，第 259–264 行

README 文档声明 `Ctrl+0` 为"适应画布"，`Ctrl+9` 为"实际大小 (100%)"。但代码实现恰好相反：

```typescript
} else if (isCtrl && e.key === '0') {
  handleZoomReset();  // 实际是 zoom(1) → 100%
} else if (isCtrl && e.key === '9') {
  handleZoomFit();    // 实际是 zoomToFit → 适应画布
```

工具栏按钮本身的 onClick 绑定是正确的（"适应"按钮绑定 `handleZoomFit`，"100%"按钮绑定 `handleZoomReset`），但它们的 Tooltip 快捷键标注与键盘实际触发行为相反：Tooltip 声称"适应画布 (Ctrl+0)"，而 Ctrl+0 实际触发的是 `handleZoomReset`（100%）；Tooltip 声称"实际大小 (Ctrl+9)"，而 Ctrl+9 实际触发的是 `handleZoomFit`。无论是调整快捷键映射还是调整 Tooltip 文本，都需要统一。

---

#### BUG-03：自动排版（Auto Layout）无法撤销（中等）

文件：`src/renderer/src/utils/autoLayout.ts`，第 68 行；`src/renderer/src/stores/useGraphStore.ts`，第 296–304 行

`runAutoLayout` 调用 `loadGraph` 更新所有节点位置，但 `loadGraph` 的实现中没有调用 `pushHistoryIfNeeded`。用户在执行自动排版后按 Ctrl+Z 无法恢复到排版前的布局。

---

#### BUG-04：新建项目后 sheets 数组被清空导致数据不一致（中等）

文件：`src/renderer/src/stores/useGraphStore.ts`，第 281–294 行

`clearGraph()` 将 `sheets` 设为空数组、`activeSheetId` 设为 `null`。随后 `handleNew` 调用 `addNode(startNode)`，而 `addNode` 内部的 sheets 同步逻辑依赖 `activeSheetId` 匹配，此时为 `null` 导致没有任何 sheet 被更新。

后果：新建项目后如果直接保存而不做任何触发 sheets 同步的操作（如切换 sheet），`buildProjectFile` 会生成一个空的 sheets 数组，"开始"节点会丢失。X6 画布上的渲染不受影响（因为它监听 nodes/edges），但持久化数据不完整。

---

#### BUG-05：属性面板颜色选择器无法正确回显已保存颜色（轻微）

文件：`src/renderer/src/components/property-panel/PropertyPanel.tsx`，第 36–44 行

`form.setFieldsValue` 将 `color`、`borderColor`、`fontColor` 以字符串形式设置（如 `'#ffffff'`），但 Ant Design v5 的 `ColorPicker` 组件期望的是 `Color` 对象或特定格式。这会导致选中一个已有节点时，颜色选择器可能显示为空白或默认色，而非该节点实际的颜色值。

---

#### BUG-06：连线属性面板的颜色/线型/线宽修改不生效（中等）

文件：`src/renderer/src/components/property-panel/PropertyPanel.tsx`，第 55–73 行

连线属性面板中的"连线颜色"、"线型"、"线宽"三个控件通过 `handleFieldChange` 将值写入 `edge.data` 对象（如 `data.color`、`data.strokeDasharray`、`data.strokeWidth`），但 X6 的连线渲染依赖的是 `edge.attrs.line.stroke`、`edge.attrs.line.strokeDasharray`、`edge.attrs.line.strokeWidth`。写入 `data` 字段后没有任何同步逻辑将这些值映射到 X6 的 attrs 上，因此用户在属性面板修改连线的颜色、线型、线宽后画布上不会有任何视觉变化。

---

#### BUG-07：module-component 形状名与 ModuleNodeShape 枚举不一致（轻微）

文件：`src/renderer/src/registerNodes.ts`（注册 `module-component`）；`src/shared/types.ts`（枚举中无此值）；`src/renderer/src/components/sidebar/SidePanel.tsx`（使用 `'module-component'` 字符串）

`registerNodes.ts` 注册了一个名为 `module-component` 的 X6 节点形状，侧边栏模块图模板也使用 `'module-component'` 字符串。但 `ModuleNodeShape` 枚举定义的六个形状（`module-presentation`、`module-business`、`module-data-access`、`module-external`、`module-database`、`module-generic`）中不包含 `module-component`。

这导致：通过类型守卫 `isModuleNode` 判断侧边栏创建的模块节点时会返回 `false`（因为 `'module-component'.startsWith('module-')` 为 `true`，但类型上不匹配枚举），属性面板的类型标注可能出现偏差，且枚举中定义的 5 个形状未在任何地方注册或使用。

---

#### BUG-08：Ctrl+C 复制后 Ctrl+V 粘贴时，系统剪贴板与内部剪贴板不同步（轻微）

文件：`src/renderer/src/components/toolbar/ToolBar.tsx`，第 238–249 行；`src/renderer/src/components/graph-editor/GraphCanvas.tsx`，第 128–140 行

右键菜单的"复制"操作将数据写入 `navigator.clipboard`（系统剪贴板），而 Ctrl+C 快捷键和工具栏按钮则写入组件内部的 `clipboard` state。Ctrl+V 只读取内部 `clipboard` state。这导致：用户通过右键菜单复制后无法用 Ctrl+V 粘贴；反之，通过 Ctrl+C 复制后右键菜单中的"粘贴"选项也是 disabled 状态（因为右键菜单中的粘贴被硬编码为 `disabled: true`，是另一个问题）。

---

#### BUG-09：EdgeLabelEditor 的 useEffect 闭包陈旧（轻微）

文件：`src/renderer/src/components/graph-editor/EdgeLabelEditor.tsx`，第 43–50 行

`useEffect` 依赖数组为空 `[]`，其中注册的 `thesisflow:edit-edge-label` 事件监听器通过闭包捕获了 `openEditor` 函数。`openEditor` 内部调用 `setValue`、`setEditingEdgeId`、`setOpen`，这些 setState 函数本身是稳定的（React 保证），所以实际不会出问题。但如果后续有人修改 `openEditor` 使其依赖外部 state，会引入陈旧闭包 bug。建议将 `openEditor` 包裹在 `useCallback` 中并加入依赖数组。

---

#### BUG-10：PDF 导出方向判断逻辑存在偏差（轻微）

文件：`src/renderer/src/utils/exportPdf.ts`，第 31 行

```typescript
orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait'
```

这里 `pdfWidth` 固定为 210mm（A4 宽度），`pdfHeight` 是根据 SVG 宽高比计算出的高度。当图表很宽时 `pdfHeight` 较小，条件为 `true` 选 `landscape`，这本身没错。但紧接着 format 参数传的是 `[pdfWidth, Math.max(pdfHeight, 100)]`，始终以 `pdfWidth`（210）为第一维度。当 orientation 为 `landscape` 时，jsPDF 内部的宽高处理逻辑可能与预期不符，导致内容被裁切或留白过多。

---

#### BUG-11：节点拖拽过程中产生过多历史记录（设计缺陷）

文件：`src/renderer/src/stores/useGraphStore.ts`，第 170–189 行

`updateNode` 在每次调用时都执行 `pushHistoryIfNeeded`。X6 的 `node:moved` 事件在拖拽过程中可能触发多次（尤其是启用了网格吸附时），每次移动都会往历史栈中压入一条记录。用户拖一次节点可能就消耗了 5–10 个历史槽位，50 条历史上限很快就会被用尽，导致 Ctrl+Z 只能回退到很近的操作。

---

### 第二部分：修改建议

#### 一、架构与代码质量

**1. 解决 GraphCanvas useEffect 陈旧闭包问题**

这是当前项目中最关键的技术债。建议采用以下策略：将所有需要在事件中读取最新值的逻辑改为调用 `useGraphStore.getState()` 而非通过 React selector 闭包捕获。例如 `createEdge` 中应使用 `useGraphStore.getState().edgeStyleId` 获取最新连线样式。这也符合 `ToolBar.tsx` 中键盘快捷键已采用的模式（那里已经正确地使用了 `getState()`）。

**2. 引入 node:moved 的防抖历史推送**

在 `updateNode` 中区分"实时位置更新"和"最终位置更新"。可以在 `GraphCanvas` 的 `node:mousemove` 事件中只更新 store 位置而不推送历史，在 `node:moved`（拖拽结束）时才推送一条历史记录。或者在 `useGraphStore` 中为 `updateNode` 增加一个 `skipHistory` 参数。

**3. 将 `getGraph` 从 DOM hack 改为 React Context**

目前 `getGraph()` 通过将 Graph 实例挂到 DOM 元素的 `__graph__` 属性上来全局共享，这是一种不安全的模式。建议通过 React Context 或 Zustand 的一个独立 store 来共享 Graph 实例，确保类型安全且可追踪。

**4. 修复 loadGraph 缺少历史推送**

`loadGraph` 应该像其他 mutation 一样调用 `pushHistoryIfNeeded`，以确保自动排版等操作可以被撤销。

**5. 修复新建项目后 sheets 为空的问题**

`clearGraph` 或 `handleNew` 应该在清空后自动创建一个默认 sheet，确保 `sheets` 和 `activeSheetId` 始终有值。这与 `removeSheet` 中"如果删除所有 sheet 则自动创建默认 sheet"的逻辑一致。

---

#### 二、功能完善

**6. 模板面板（TemplatePanel）已编写但未集成**

`TemplatePanel.tsx` 组件功能完整（包含三个内置模板、导入/导出、应用模板），但未在 `App.tsx` 中渲染。建议将其集成到侧边栏底部或作为一个独立的 Tab 页签，与节点面板并列。

**7. 模块图节点体系需要重新设计**

当前状态：`registerNodes.ts` 只注册了一个 `module-component` 形状，但 `ModuleNodeShape` 枚举定义了 6 种分层架构形状（展示层、业务层、数据层等），侧边栏也只暴露了一个"系统模块"。建议二选一：要么将枚举精简为 `Generic = 'module-component'` 一个通用形状并删除未使用的枚举值；要么将所有 6 种形状注册到 X6 并在侧边栏中展示。

**8. 主题系统只有定义没有实现**

`themes.css` 精心定义了三套主题（亮色、暗色、高对比度），但全应用没有任何地方通过 `data-theme` 属性切换主题，所有组件（工具栏、侧边栏、属性面板、对齐工具栏）都使用硬编码的颜色值（`#fff`、`#333`、`#f0f0f0` 等）。建议：要么删除 `themes.css` 避免误导；要么实现一个主题切换器并将组件中的硬编码颜色替换为 CSS 变量。

**9. 属性面板缺少节点宽高编辑**

README 中提到"选中节点后拖拽边角可自由调整大小"，X6 的 Transform 插件也支持缩放。但属性面板中没有宽度和高度的数值输入框，用户无法精确设定节点尺寸。对于学术论文排版，精确控制尺寸是常见需求。

**10. 右键菜单的画布粘贴功能被硬编码为 disabled**

`GraphCanvas.tsx` 第 166 行将画布右键菜单的"粘贴"项设为 `disabled: true`，是一个占位实现。建议接入内部剪贴板逻辑，实现完整的右键复制/粘贴闭环。

---

#### 三、用户体验

**11. 首次使用缺少引导**

应用启动后是一个空白画布 + 左侧节点面板，没有任何引导提示。对于从未接触过 X6 图编辑器的用户，"从端口拖拽创建连线"、"从侧边栏拖拽连线样式到节点"等操作并不直观。建议：首次启动时显示一个简短的引导浮层或交互式教程；或在画布空白区域显示一个提示卡片（如"从左侧拖拽节点到此处开始"）。

**12. 新建项目缺少"未保存数据"确认**

点击"新建"或"打开"时，如果当前项目有未保存的更改，没有任何确认对话框。用户可能意外丢失工作。建议在 `handleNew` 和 `handleOpen` 开头检查 `dirty` 状态，若有未保存更改则弹出确认框。

**13. 关闭应用时缺少未保存确认**

Electron 主进程关闭窗口时没有检查是否有未保存的数据。建议在主进程监听 `close` 事件，如果有 `dirty` 状态则弹出保存确认对话框。

**14. 搜索面板没有关闭按钮**

`SearchPanel` 浮层只能通过 `Escape` 键关闭，没有可见的关闭按钮（如右上角 X 图标）。不熟悉快捷键的用户可能不知道如何关闭搜索面板。

**15. 缺少缩放比例显示**

工具栏有放大、缩小、适应、100% 四个按钮，但没有显示当前的缩放百分比。用户在缩放后无法知道当前处于什么比例。建议在缩放按钮旁添加一个只读的百分比文本。

---

#### 四、安全与健壮性

**16. 文件加载缺少数据校验**

`open-project` 和 `open-file-by-path` 的 IPC handler 仅检查 `parsed.version` 和 `Array.isArray(parsed.sheets)` 两个字段。缺少对以下内容的校验：sheets 数组中每个元素的必需字段（id, name, type, nodes, edges）、nodes 的必需字段（id, shape, x, y, width, height）、edges 的 source/target 有效性（引用的 node id 是否存在）、version 字符串是否在支持范围内。

建议引入一个轻量的 schema 校验（如 zod），在加载时对文件内容进行完整验证，对不合法的数据给出明确的错误提示而非静默忽略或运行时崩溃。

**17. 最近文件列表缺少存在性检查**

最近文件列表中的路径指向的文件可能已被删除或移动。`openFileByPath` 虽然有 try/catch，但只返回 `null` 而没有从最近文件列表中自动移除失效的条目，也没有给用户"文件不存在"的明确提示。

**18. Preload 中定义了未被使用的菜单事件**

`preload/index.ts` 暴露了 `onMenuNewProject`、`onMenuOpenProject`、`onMenuSaveProject`、`onMenuExportImage` 四个菜单事件监听器，但主进程中 `Menu.setApplicationMenu(null)` 禁用了原生菜单，这些事件永远不会被触发。这些 API 是死代码，增加了维护负担和理解成本。

---

#### 五、工程化

**19. 缺少 electron-builder 完整配置**

`package.json` 中 `build:win` 脚本依赖 `electron-builder`，但缺少完整的 `build` 配置字段（如 `appId`、`productName`、`directories`、`files` 过滤规则等）。当前可能依赖默认配置工作，但不利于长期维护和自定义打包需求。

**20. 测试覆盖不完整**

当前 55 个测试用例覆盖了 3 个 store 和 1 个 utils 文件，但以下关键模块没有测试：`GraphCanvas` 的 syncStoreToGraph 同步逻辑、`PropertyPanel` 的表单交互、`TemplatePanel` 的应用模板逻辑、`autoLayout` 的布局计算、`exportPdf` 的导出流程、Electron 主进程的 IPC handler。建议逐步补充组件测试和集成测试。

**21. ESLint 配置使用了旧的 --ext 参数**

`package.json` 中的 `lint` 脚本为 `eslint src --ext .ts,.tsx`，但 ESLint v10（flat config）已不推荐使用 `--ext` 参数，文件类型过滤应在 `eslint.config.mjs` 中配置。当前可能会产生 warning 或被未来版本废弃。

**22. README 与代码状态不一致**

README 描述了一些尚未实现或存在偏差的功能：快捷键 Ctrl+0/Ctrl+9 的行为与实际相反；测试用例数量描述为 55 个但需核实是否与最新代码同步；模块图节点类型表格中列出的类型与实际注册的不完全对应。建议将 README 与代码同步更新，避免误导用户和贡献者。

---

### 第三部分：优先级建议

按对用户影响的紧急程度排序，建议的修复优先级：

| 优先级 | 编号 | 问题 | 影响 |
|--------|------|------|------|
| P0 紧急 | BUG-01 | useEffect 闭包陈旧 | 连线创建核心功能失效 |
| P0 紧急 | BUG-06 | 连线属性修改不生效 | 用户修改连线样式无反馈 |
| P1 高 | BUG-04 | 新建项目 sheets 为空 | 数据保存不完整 |
| P1 高 | BUG-03 | 自动排版无法撤销 | 用户误操作无法恢复 |
| P1 高 | BUG-11 | 拖拽历史过多 | 撤销功能实际不可用 |
| P2 中 | BUG-02 | 快捷键行为互换 | 与文档不符，困惑用户 |
| P2 中 | BUG-07 | 模块形状名不一致 | 类型系统混乱 |
| P2 中 | 建议-12 | 缺少未保存确认 | 可能丢失用户数据 |
| P2 中 | 建议-13 | 关闭应用无确认 | 可能丢失用户数据 |
| P3 低 | BUG-05 | 颜色回显异常 | 影响编辑体验 |
| P3 低 | BUG-08 | 剪贴板不同步 | 操作方式不一致 |
| P3 低 | 其余建议 | 体验/工程化优化 | 提升产品完成度 |
