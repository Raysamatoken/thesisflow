# Agent Guide — ThesisFlow

## Project Overview

ThesisFlow is an Electron desktop app for generating academic flowcharts and module diagrams. Users drag nodes from a sidebar onto an X6-powered canvas, connect them, style properties, auto-layout with Dagre, and export high-res PNG/SVG/PDF for thesis papers.

## Tech Stack

- **Desktop**: Electron 33 + electron-vite (Vite build)
- **Frontend**: React 18 + TypeScript 5
- **Graph Engine**: AntV X6 2.x (`@antv/x6`, `@antv/x6-plugin-export`, `@antv/x6-plugin-transform`)
- **Layout**: `@antv/layout` (Dagre algorithm)
- **State**: Zustand 5 (dual stores: `useGraphStore.ts` + `useHistoryStore.ts`)
- **UI**: Ant Design 5
- **PDF Export**: jspdf + svg2pdf.js
- **Packaging**: electron-builder (Windows portable)
- **Testing**: Vitest + @testing-library/react
- **Linting**: ESLint 10 (flat config) + Prettier + Husky

## Directory Structure

```
thesisflow/
├── src/
│   ├── main/index.ts                    # Electron main process: window, IPC, auto-save, recent files, PDF save
│   ├── preload/index.ts                 # contextBridge exposes window.thesisFlow API (incl. exportPdf, openFileByPath)
│   ├── shared/
│   │   ├── types.ts                     # FlowNode, ModuleNode, GraphEdge, ProjectFile, enums, type guards
│   │   └── ipc.ts                       # ThesisFlowAPI interface + Window.thesisFlow declaration
│   └── renderer/
│       ├── index.html                   # Entry HTML with CSP headers
│       └── src/
│           ├── main.tsx                 # React root, antd ConfigProvider (zhCN locale)
│           ├── App.tsx                  # Layout: ToolBar + SheetTabs + 3-column + AlignmentToolbar
│           ├── registerNodes.ts         # X6 custom node shapes (6 types, academic B&W style)
│           ├── components/
│           │   ├── graph-editor/
│           │   │   ├── GraphCanvas.tsx   # X6 init, events, store sync, context menu (uses sub-components)
│           │   │   ├── SearchPanel.tsx   # Global search overlay (Ctrl+F), arrow-key navigation
│           │   │   └── EdgeLabelEditor.tsx # Edge label edit modal (triggered via CustomEvent)
│           │   ├── sidebar/SidePanel.tsx           # Draggable node palette + edge style picker + search
│           │   ├── toolbar/ToolBar.tsx             # Full toolbar: file ops, undo/redo, copy/paste, zoom, PDF export, recent files
│           │   ├── property-panel/PropertyPanel.tsx # Node/edge property editing form
│           │   ├── sheet-tabs/SheetTabs.tsx        # Multi-sheet tab management with context menu
│           │   └── alignment-toolbar/AlignmentToolbar.tsx # Node alignment/distribution tools
│           ├── stores/
│           │   ├── useGraphStore.ts     # Zustand store (nodes, edges, selection, sheets, alignment) — sheets kept in sync
│           │   ├── useHistoryStore.ts   # Undo/redo history management
│           │   └── __tests__/           # Unit tests for stores (45 tests across 3 files)
│           ├── types/
│           │   ├── index.ts             # Re-exports shared types + renderer-only helpers
│           │   └── x6-events.ts         # Typed X6 event interfaces (X6NodeEvent, X6EdgeEvent, etc.)
│           ├── utils/
│           │   ├── autoLayout.ts        # Dagre layout wrapper
│           │   ├── getGraph.ts          # Get X6 Graph instance from DOM
│           │   ├── common.ts            # Shared helpers (endpointId)
│           │   ├── exportPdf.ts         # SVG → PDF export via jspdf + svg2pdf.js
│           │   └── __tests__/
│           │       └── common.test.ts   # Tests for shared utilities
│           └── styles/
│               ├── global.css           # Reset, scrollbar, fonts
│               └── themes.css           # Light/dark theme tokens
├── src/test/setup.ts                    # Test environment setup (mocks for Electron APIs)
├── vitest.config.ts                     # Vitest configuration
├── eslint.config.mjs                    # ESLint flat config (separate node/browser rules)
├── .prettierrc                          # Prettier configuration
├── .husky/                              # Git hooks (pre-commit: lint-staged)
├── electron.vite.config.ts              # Paths: main, preload, renderer (alias @ -> src/renderer/src)
├── package.json                         # Dependencies, scripts, lint-staged config
├── tsconfig.json                        # References tsconfig.node.json + tsconfig.web.json
├── tsconfig.node.json                   # main + preload + shared
└── tsconfig.web.json                    # renderer (jsx: react-jsx, paths: @/*)
```

## Build & Run

```bash
npm install          # install deps
npm run dev          # electron-vite dev (hot reload)
npm run build        # build all (main + preload + renderer) -> out/
npm run build:win    # electron-builder portable -> dist/
npm run typecheck    # tsc check for both node and web configs
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
```

## Architecture Constraints

### Security

- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` in BrowserWindow
- All file I/O goes through IPC: main process does `dialog.showOpenDialog` / `dialog.showSaveDialog` + `fs/promises`
- Preload exposes `window.thesisFlow` via `contextBridge.exposeInMainWorld` — never raw `ipcRenderer`

### Electron-vite env vars

- Use `process.env.ELECTRON_RENDERER_URL` (NOT `MAIN_WINDOW_VITE_DEV_SERVER_URL`) in main process to detect dev server

### Menu bar

- Removed via `Menu.setApplicationMenu(null)` in main process

## Core Data Model (`src/shared/types.ts`)

```
FlowNodeShape:  flow-terminal | flow-process | flow-decision | flow-io | flow-subprocess
ModuleNodeShape: module-presentation | module-business | module-data-access | module-external | module-database | module-generic

FlowNode:    { id, shape: FlowNodeShape, x, y, width, height, label, data: FlowNodeData }
ModuleNode:  { id, shape: ModuleNodeShape, x, y, width, height, label, data: ModuleNodeData }
GraphEdge:   { id, source: EdgeEndpoint, target: EdgeEndpoint, label, data: EdgeData }
ProjectFile: { version, name, updatedAt, sheets: GraphSheet[] }
GraphSheet:  { id, name, type: GraphType.Flow|Module, nodes, edges }

AnyNode = FlowNode | ModuleNode  (discriminated union via shape field)
```

`EdgeEndpoint` = `string | { cell: string; port?: string }`

All nodes/edges extend X6 `Node.Metadata` / `Edge.Metadata` for compatibility with `graph.addNode()` / `graph.addEdge()`.

### Type Guards

- `isFlowNode(node: AnyNode): node is FlowNode` — checks `shape.startsWith('flow-')`
- `isModuleNode(node: AnyNode): node is ModuleNode` — checks `shape.startsWith('module-')`
- `getNodeData(node: AnyNode)` — returns typed business data

## Zustand Stores

### useGraphStore (Main Store)

Single store holds: `nodes`, `edges`, `selectedNode`, `selectedNodeIds`, `selectedEdgeId`, `projectName`, `currentFilePath`, `dirty`, `edgeStyleId`, `edgeCreationMode`, `edgeCreationSourceId`, `sheets`, `activeSheetId`.

Key actions:
- **Node/Edge**: `addNode`, `removeNode`, `updateNode`, `addEdge`, `removeEdge`, `updateEdge`
- **Selection**: `setSelectedNode`, `setSelectedNodeIds`, `toggleNodeSelection`, `clearSelection`
- **Sheet**: `addSheet`, `removeSheet`, `setActiveSheet`, `renameSheet`, `duplicateSheet`
- **Alignment**: `alignLeft`, `alignCenter`, `alignRight`, `alignTop`, `alignMiddle`, `alignBottom`, `distributeHorizontal`, `distributeVertical`
- **History**: `undo`, `redo`, `canUndo`, `canRedo`
- **Project**: `loadProject`, `buildProjectFile`, `clearGraph`, `loadGraph`

**Sheets sync invariant**: Every mutation to `nodes`/`edges` (addNode, removeNode, updateNode, addEdge, removeEdge, updateEdge, alignment, distribution) also updates the `sheets` array for the `activeSheetId`. `setActiveSheet` saves the current sheet before switching. `buildProjectFile` merges current state into the sheets before serializing.

### useHistoryStore (History Store)

Manages undo/redo history with `past` and `future` arrays. Each entry contains `{ nodes, edges }`.

- `pushHistory(nodes, edges)` — adds current state to history
- `undo()` — returns previous state, moves current to future
- `redo()` — returns next state, moves current to past
- `clearHistory()` — resets all history
- `maxHistorySize` — limits history to 50 entries

## X6 Graph Sync Pattern

- **Store -> X6**: `syncStoreToGraph()` in GraphCanvas runs on `nodes`/`edges` changes. Uses incremental diff (add/remove/update) — NOT `fromJSON` which would cause infinite loops.
- **X6 -> Store**: Canvas events (`node:click`, `node:moved`, `edge:connected`, `blank:click`) update the store.
- **Version guard**: `syncVersion` ref counter prevents circular updates when store changes originate from X6 events.

## Custom Nodes (`registerNodes.ts`)

Registered via `Graph.registerNode()`:

| Shape | Inherits | Style |
|-------|----------|-------|
| `flow-terminal` | ellipse | 120x50, white fill, #333 stroke |
| `flow-process` | rect (rx=6) | 140x60 |
| `flow-decision` | polygon (diamond) | 120x80 |
| `flow-io` | polygon (parallelogram) | 140x60 |
| `flow-subprocess` | rect + line markup | 140x60, double vertical stripes |
| `module-component` | rect + label/subtitle/divider | 200x80 |

Each node has 4 ports (top/right/bottom/left) with `visibility: 'hidden'` by default, shown on `node:mouseenter`.

## Edge Creation

Two methods:
1. **Port-to-port drag**: X6 `connecting.createEdge()` fires, creates edge with current `edgeStyleId` preset.
2. **Drag from sidebar**: Drag an edge style onto a source node → enters `edgeCreationMode` → click target node to complete.

Edge presets (`EDGE_PRESETS`):
- `straight-arrow`: router=normal, connector=normal (no routing)
- `adaptive-arrow`: router=manhattan, connector=rounded (auto-routing)

**Important**: Each edge carries its own router/connector in its metadata. The top-level `connecting` config must NOT set router/connector, or straight arrows will incorrectly bend.

## Context Menus

- **Node context menu**: Right-click on node → Copy, Delete
- **Edge context menu**: Right-click on edge → Copy, Edit Label, Delete
- **Canvas context menu**: Right-click on blank area → Paste (placeholder)
- **Sheet tab context menu**: Right-click on tab → Rename, Duplicate, New Flow/Module, Delete

## Search System

- **Sidebar search**: Input box at top of SidePanel filters node templates by label
- **Canvas search** (Ctrl+F): `SearchPanel` component renders a floating overlay. Searches all nodes by label/remark, arrow keys navigate, Enter selects and centers node on canvas.

## Edge Label Editing

- **Double-click edge** or **right-click → Edit Label**: Dispatches `thesisflow:edit-edge-label` CustomEvent. `EdgeLabelEditor` component opens a modal, updates store via `updateEdge()` and syncs X6 labels directly.

## Export System

- **PNG**: X6 `exportPNG()` with 2x ratio, sent to main process via `export-image` IPC
- **SVG**: X6 `exportSVG()`, sent to main process via `export-image` IPC
- **PDF**: `exportPdf()` in `utils/exportPdf.ts` uses jspdf + svg2pdf.js to embed the SVG into a PDF document, then sends base64 data to main process via `export-pdf` IPC for file saving

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New project |
| Ctrl+O | Open project |
| Ctrl+S | Save project |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Ctrl+C | Copy selected node/edge |
| Ctrl+V | Paste |
| Delete/Backspace | Delete selected |
| Ctrl+F | Open search |
| Ctrl++ | Zoom in |
| Ctrl+- | Zoom out |
| Ctrl+0 | Zoom to fit |
| Ctrl+9 | Zoom 100% |

**Implementation note**: Keyboard handlers in `ToolBar.tsx` call `useGraphStore.getState()` directly (not via stale closures from `useEffect` dependencies) to ensure they always read the latest store state. Clipboard state is tracked via `useRef` for the same reason.

## Auto-Save & Recent Files

- **Auto-save**: Main process sends `auto-save-trigger` event every 30 seconds. Renderer saves if `dirty` and `currentFilePath` exists.
- **Recent files**: Stored in `userData/recent-files.json`. Max 10 entries. Exposed via `getRecentFiles()`, `clearRecentFiles()`, and `openFileByPath(filePath)` IPC.

## Alignment System

When 2+ nodes are selected (via Shift+click or rubberband), AlignmentToolbar appears at bottom of canvas:
- **Alignment** (2+ nodes): Left, Center, Right, Top, Middle, Bottom
- **Distribution** (3+ nodes): Horizontal, Vertical

All alignment operations sync to sheets and push to history for undo support.

**Distribution algorithm**: Sorts selected nodes by center coordinate, computes evenly-spaced positions using a `posMap` (Map of id → position), then applies in a single pass. This avoids the stale-closure bug where closure-captured counters diverged from the actual `state.nodes.map` traversal order.

## Known Gotchas

1. **PowerShell heredocs**: Template literals with `${...}` get mangled. Use Python scripts or `apply_patch` for files containing template literals or Unicode.
2. **Unicode escapes**: `\uXXXX` in PowerShell output renders literally in JSX. Decode to actual UTF-8 characters.
3. **SVG line elements**: Don't support `100%` or `calc()`. Use fixed pixel values (e.g., x1=12, y1=2, x2=12, y2=58 for subprocess node stripes).
4. **Node resize**: Uses `@antv/x6-plugin-transform`. The plugin must be registered via `graph.use(new Transform({...}))`.
5. **Git permissions**: `.git/` directory sometimes requires escalated permissions on Windows.
6. **X6 type assertions**: X6 event types are defined in `types/x6-events.ts`. Remaining `as any` casts are limited to X6 API calls with incomplete type definitions (e.g., `exportPNG`, `exportSVG`).

## IPC Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `create-project` | renderer -> main -> renderer | Returns default ProjectFile |
| `open-project` | renderer -> main -> renderer | Opens .thesisflow file, returns ProjectFile |
| `save-project` | renderer -> main -> renderer | Saves ProjectFile, optional filePath param |
| `export-image` | renderer -> main -> renderer | Saves PNG/SVG data to disk |
| `export-pdf` | renderer -> main -> renderer | Saves PDF (base64 data URI) to disk |
| `get-recent-files` | renderer -> main -> renderer | Returns string[] of recent file paths |
| `clear-recent-files` | renderer -> main -> renderer | Clears recent files list |
| `open-file-by-path` | renderer -> main -> renderer | Opens .thesisflow by absolute path (for recent files) |
| `auto-save-trigger` | main -> renderer | Notifies renderer to auto-save |
| `window:minimize/maximize/close` | renderer -> main | Window controls (send, not invoke) |

## Import Aliases

- `@/` maps to `src/renderer/src/` (configured in electron.vite.config.ts and tsconfig.web.json)

## File Format

`.thesisflow` is plain JSON: `{ version, name, updatedAt, sheets: [{ id, name, type, nodes, edges }] }`

Supports multiple sheets (tabs) per project.

## Testing

Tests are in `src/renderer/src/stores/__tests__/` and `src/renderer/src/utils/__tests__/`, using Vitest with jsdom environment.

```bash
npm run test         # Run all tests
npm run test:watch   # Watch mode
npm run test:ui      # UI mode
```

Current test coverage: useHistoryStore (10 tests), useGraphStore (34 tests), useTemplateStore (11 tests), common utils (2 tests). Total: 55 tests across 4 files.
