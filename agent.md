# Agent Guide — ThesisFlow

## Project Overview

ThesisFlow is an Electron desktop app for generating academic flowcharts and module diagrams. Users drag nodes from a sidebar onto an X6-powered canvas, connect them, style properties, auto-layout with Dagre, and export high-res PNG/SVG for thesis papers.

## Tech Stack

- **Desktop**: Electron 33 + electron-vite (Vite build)
- **Frontend**: React 18 + TypeScript 5
- **Graph Engine**: AntV X6 2.x (`@antv/x6`, `@antv/x6-plugin-export`, `@antv/x6-plugin-transform`)
- **Layout**: `@antv/layout` (Dagre algorithm)
- **State**: Zustand 5 (single store in `useGraphStore.ts`)
- **UI**: Ant Design 5
- **Packaging**: electron-builder (Windows portable)

## Directory Structure

```
thesisflow/
├── src/
│   ├── main/index.ts              # Electron main process: window, IPC, Menu.setApplicationMenu(null)
│   ├── preload/index.ts           # contextBridge exposes window.thesisFlow API
│   ├── shared/
│   │   ├── types.ts               # FlowNode, ModuleNode, GraphEdge, ProjectFile, enums
│   │   └── ipc.ts                 # ThesisFlowAPI interface + Window.thesisFlow declaration
│   └── renderer/
│       ├── index.html             # Entry HTML with CSP headers
│       └── src/
│           ├── main.tsx           # React root, antd ConfigProvider (zhCN locale)
│           ├── App.tsx            # Layout: ToolBar + 3-column (SidePanel | GraphCanvas | PropertyPanel)
│           ├── registerNodes.ts   # X6 custom node shapes (6 types, academic B&W style)
│           ├── components/
│           │   ├── graph-editor/GraphCanvas.tsx   # X6 init, events, store sync, edge creation
│           │   ├── sidebar/SidePanel.tsx           # Draggable node palette + edge style picker
│           │   ├── toolbar/ToolBar.tsx             # New/Open/Save/AutoLayout/Export buttons
│           │   └── property-panel/PropertyPanel.tsx # Node/edge property editing form
│           ├── stores/useGraphStore.ts  # Zustand store (nodes, edges, selection, dirty state)
│           ├── types/index.ts           # Re-exports shared types + renderer-only helpers
│           ├── utils/
│           │   ├── autoLayout.ts        # Dagre layout wrapper
│           │   └── getGraph.ts          # Get X6 Graph instance from DOM
│           └── styles/global.css        # Reset, scrollbar, fonts
├── electron.vite.config.ts       # Paths: main, preload, renderer (alias @ -> src/renderer/src)
├── tsconfig.json                 # References tsconfig.node.json + tsconfig.web.json
├── tsconfig.node.json            # main + preload + shared
└── tsconfig.web.json             # renderer (jsx: react-jsx, paths: @/*)
```

## Build & Run

```bash
npm install          # install deps
npm run dev          # electron-vite dev (hot reload)
npm run build        # build all (main + preload + renderer) -> out/
npm run build:win    # electron-builder portable -> dist/
npm run typecheck    # tsc check for both node and web configs
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
```

`EdgeEndpoint` = `string | { cell: string; port?: string }`

All nodes/edges extend X6 `Node.Metadata` / `Edge.Metadata` for compatibility with `graph.addNode()` / `graph.addEdge()`.

## Zustand Store (`useGraphStore.ts`)

Single store holds: `nodes`, `edges`, `selectedNode`, `selectedEdgeId`, `projectName`, `currentFilePath`, `dirty`, `edgeStyleId`, `edgeCreationMode`, `edgeCreationSourceId`.

Key actions: `addNode`, `removeNode`, `updateNode`, `addEdge`, `removeEdge`, `updateEdge`, `loadProject`, `loadGraph`, `buildProjectFile`.

Type `AnyNode = FlowNode | ModuleNode`.

## X6 Graph Sync Pattern

- **Store -> X6**: `syncStoreToGraph()` in GraphCanvas runs on `nodes`/`edges` changes. Uses incremental diff (add/remove/update) — NOT `fromJSON` which would cause infinite loops.
- **X6 -> Store**: Canvas events (`node:click`, `node:moved`, `edge:connected`, `blank:click`) update the store.
- **Suppress guard**: `suppressSync` ref flag prevents circular updates when store changes originate from X6 events.

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

## Known Gotchas

1. **PowerShell heredocs**: Template literals with `${...}` get mangled. Use Python scripts or `apply_patch` for files containing template literals or Unicode.
2. **Unicode escapes**: `\uXXXX` in PowerShell output renders literally in JSX. Decode to actual UTF-8 characters.
3. **SVG line elements**: Don't support `100%` or `calc()`. Use fixed pixel values (e.g., x1=12, y1=2, x2=12, y2=58 for subprocess node stripes).
4. **Node resize**: Uses `@antv/x6-plugin-transform`. The plugin must be registered via `graph.use(new Transform({...}))`.
5. **Git permissions**: `.git/` directory sometimes requires escalated permissions on Windows.

## IPC Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `create-project` | renderer -> main -> renderer | Returns default ProjectFile |
| `open-project` | renderer -> main -> renderer | Opens .thesisflow file, returns ProjectFile |
| `save-project` | renderer -> main -> renderer | Saves ProjectFile, optional filePath param |
| `export-image` | renderer -> main -> renderer | Saves PNG/SVG data to disk |
| `window:minimize/maximize/close` | renderer -> main | Window controls (send, not invoke) |

## Import Aliases

- `@/` maps to `src/renderer/src/` (configured in electron.vite.config.ts and tsconfig.web.json)

## File Format

`.thesisflow` is plain JSON: `{ version, name, updatedAt, sheets: [{ id, name, type, nodes, edges }] }`