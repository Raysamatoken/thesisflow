import { create } from 'zustand';
import { GraphType } from '../types';
import type { AnyNode, GraphEdge, ProjectFile, GraphSheet } from '../types';
import { useHistoryStore } from './useHistoryStore';
import { endpointId } from '../utils/common';

/** 连线样式预设 */
export interface EdgeStylePreset {
  id: string;
  label: string;
  router: string;
  connector: string;
  strokeDasharray: string;
  targetMarker: string;
}

export const EDGE_PRESETS: EdgeStylePreset[] = [
  {
    id: 'straight-arrow',
    label: '直箭头',
    router: 'normal',
    connector: 'normal',
    strokeDasharray: '',
    targetMarker: 'block',
  },
  {
    id: 'adaptive-arrow',
    label: '自适应弯曲箭头',
    router: 'manhattan',
    connector: 'rounded',
    strokeDasharray: '',
    targetMarker: 'block',
  },
];

export interface GraphState {
  // Current sheet data (for backward compatibility and active editing)
  nodes: AnyNode[];
  edges: GraphEdge[];
  selectedNode: AnyNode | null;
  selectedNodeIds: string[]; // For multi-selection alignment
  selectedEdgeId: string | null;

  projectName: string;
  currentFilePath: string | null;
  dirty: boolean;

  /** 所有 sheets */
  sheets: GraphSheet[];
  /** 当前激活的 sheet ID */
  activeSheetId: string | null;

  /** 当前选中的连线样式 */
  edgeStyleId: string;

  /** 连线创建模式 */
  edgeCreationMode: boolean;
  edgeCreationSourceId: string | null;
  enterEdgeCreationMode: (sourceId: string) => void;
  exitEdgeCreationMode: () => void;

  /** 内部标志：正在从历史恢复，不记录历史 */
  _restoringFromHistory: boolean;
  setRestoringFromHistory: (v: boolean) => void;

  addNode: (node: AnyNode) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (
    nodeId: string,
    patch: Partial<Pick<AnyNode, 'x' | 'y' | 'width' | 'height' | 'label' | 'data'>>
  ) => void;

  addEdge: (edge: GraphEdge) => void;
  removeEdge: (edgeId: string) => void;
  updateEdge: (edgeId: string, patch: Partial<GraphEdge>) => void;

  setSelectedNode: (node: AnyNode | null) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  toggleNodeSelection: (nodeId: string) => void;
  setSelectedEdgeId: (id: string | null) => void;
  clearSelection: () => void;

  setEdgeStyleId: (id: string) => void;

  loadProject: (project: ProjectFile) => void;
  setProjectName: (name: string) => void;
  setCurrentFilePath: (path: string | null) => void;
  markClean: () => void;
  clearGraph: () => void;
  loadGraph: (nodes: AnyNode[], edges: GraphEdge[]) => void;

  buildProjectFile: () => ProjectFile;

  // Sheet management
  addSheet: (name?: string, type?: GraphType) => string;
  removeSheet: (sheetId: string) => void;
  setActiveSheet: (sheetId: string) => void;
  renameSheet: (sheetId: string, name: string) => void;
  duplicateSheet: (sheetId: string) => string;

  // Alignment & Distribution
  alignLeft: () => void;
  alignCenter: () => void;
  alignRight: () => void;
  alignTop: () => void;
  alignMiddle: () => void;
  alignBottom: () => void;
  distributeHorizontal: () => void;
  distributeVertical: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function pushHistoryIfNeeded(getState: () => GraphState) {
  const { _restoringFromHistory, nodes, edges } = getState();
  if (!_restoringFromHistory) {
    useHistoryStore.getState().pushHistory(nodes, edges);
  }
}

export const useGraphStore = create<GraphState>()((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedNodeIds: [],
  selectedEdgeId: null,
  projectName: '未命名项目',
  currentFilePath: null,
  dirty: false,
  sheets: [],
  activeSheetId: null,
  edgeStyleId: 'straight-arrow',
  edgeCreationMode: false,
  edgeCreationSourceId: null,
  _restoringFromHistory: false,

  addNode: (node: AnyNode) => {
    set((state: GraphState) => {
      const nodes = [...state.nodes, node];
      return {
        nodes,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, nodes } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  removeNode: (nodeId: string) => {
    set((state: GraphState) => {
      const nodes = state.nodes.filter((n: AnyNode) => n.id !== nodeId);
      const edges = state.edges.filter(
        (e: GraphEdge) => endpointId(e.source) !== nodeId && endpointId(e.target) !== nodeId
      );
      return {
        nodes,
        edges,
        selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, nodes, edges } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  updateNode: (
    nodeId: string,
    patch: Partial<Pick<AnyNode, 'x' | 'y' | 'width' | 'height' | 'label' | 'data'>>
  ) => {
    set((state: GraphState) => {
      const nodes = state.nodes.map((n: AnyNode) =>
        n.id === nodeId ? ({ ...n, ...patch } as AnyNode) : n
      );
      return {
        nodes,
        selectedNode:
          state.selectedNode?.id === nodeId
            ? ({ ...state.selectedNode, ...patch } as AnyNode)
            : state.selectedNode,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, nodes } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  addEdge: (edge: GraphEdge) => {
    set((state: GraphState) => {
      const edges = [...state.edges, edge];
      return {
        edges,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, edges } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  removeEdge: (edgeId: string) => {
    set((state: GraphState) => {
      const edges = state.edges.filter((e: GraphEdge) => e.id !== edgeId);
      return {
        edges,
        selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, edges } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  updateEdge: (edgeId: string, patch: Partial<GraphEdge>) => {
    set((state: GraphState) => {
      const edges = state.edges.map((e: GraphEdge) =>
        e.id === edgeId ? { ...e, ...patch } : e
      );
      return {
        edges,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, edges } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  setSelectedNode: (node: AnyNode | null) =>
    set({ selectedNode: node, selectedNodeIds: node ? [node.id] : [], selectedEdgeId: null }),
  setSelectedNodeIds: (ids: string[]) =>
    set({
      selectedNodeIds: ids,
      selectedNode: ids.length === 1 ? (get().nodes.find(n => n.id === ids[0]) ?? null) : null,
      selectedEdgeId: null,
    }),
  toggleNodeSelection: (nodeId: string) =>
    set(state => ({
      selectedNodeIds: state.selectedNodeIds.includes(nodeId)
        ? state.selectedNodeIds.filter(id => id !== nodeId)
        : [...state.selectedNodeIds, nodeId],
      selectedNode: null,
      selectedEdgeId: null,
    })),
  setSelectedEdgeId: (id: string | null) =>
    set({ selectedEdgeId: id, selectedNode: null, selectedNodeIds: [] }),
  clearSelection: () => set({ selectedNode: null, selectedNodeIds: [], selectedEdgeId: null }),

  setEdgeStyleId: (id: string) => set({ edgeStyleId: id }),

  setRestoringFromHistory: (v: boolean) => set({ _restoringFromHistory: v }),

  enterEdgeCreationMode: (sourceId: string) =>
    set({ edgeCreationMode: true, edgeCreationSourceId: sourceId }),

  exitEdgeCreationMode: () => set({ edgeCreationMode: false, edgeCreationSourceId: null }),

  loadProject: (project: ProjectFile) => {
    const sheets = project.sheets ?? [];
    const firstSheet = sheets[0];
    set({
      projectName: project.name,
      sheets,
      activeSheetId: firstSheet?.id ?? null,
      nodes: firstSheet?.nodes ?? [],
      edges: firstSheet?.edges ?? [],
      selectedNode: null,
      selectedEdgeId: null,
      edgeCreationMode: false,
      edgeCreationSourceId: null,
      dirty: false,
    });
    // Clear history on new project load
    useHistoryStore.getState().clearHistory();
    useHistoryStore.getState().pushHistory(firstSheet?.nodes ?? [], firstSheet?.edges ?? []);
  },

  setProjectName: (name: string) => set({ projectName: name, dirty: true }),
  setCurrentFilePath: (path: string | null) => set({ currentFilePath: path }),
  markClean: () => set({ dirty: false }),

  clearGraph: () =>
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      selectedEdgeId: null,
      edgeCreationMode: false,
      edgeCreationSourceId: null,
      projectName: '未命名项目',
      currentFilePath: null,
      sheets: [],
      activeSheetId: null,
      dirty: false,
    }),

  loadGraph: (nodes: AnyNode[], edges: GraphEdge[]) =>
    set((state: GraphState) => ({
      nodes,
      edges,
      selectedNode: null,
      selectedEdgeId: null,
      dirty: true,
      sheets: state.sheets.map(s =>
        s.id === state.activeSheetId ? { ...s, nodes, edges } : s
      ),
    })),

  buildProjectFile: (): ProjectFile => {
    const state = get();
    const sheets = state.sheets.map(s =>
      s.id === state.activeSheetId ? { ...s, nodes: state.nodes, edges: state.edges } : s
    );
    return {
      version: '1.0.0',
      name: state.projectName,
      updatedAt: new Date().toISOString(),
      sheets,
    };
  },

  // Sheet management
  addSheet: (name?: string, type: GraphType = GraphType.Flow) => {
    const newSheet: GraphSheet = {
      id: `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name ?? `流程图 ${get().sheets.length + 1}`,
      type,
      nodes: [],
      edges: [],
    };
    set(state => ({
      sheets: [...state.sheets, newSheet],
      activeSheetId: newSheet.id,
      nodes: [],
      edges: [],
      selectedNode: null,
      selectedEdgeId: null,
    }));
    useHistoryStore.getState().clearHistory();
    return newSheet.id;
  },

  removeSheet: (sheetId: string) => {
    set(state => {
      const newSheets = state.sheets.filter(s => s.id !== sheetId);
      if (newSheets.length === 0) {
        // Create a default sheet if all removed
        const defaultSheet: GraphSheet = {
          id: `sheet-${Date.now()}`,
          name: '流程图 1',
          type: GraphType.Flow,
          nodes: [],
          edges: [],
        };
        return {
          sheets: [defaultSheet],
          activeSheetId: defaultSheet.id,
          nodes: [],
          edges: [],
          selectedNode: null,
          selectedEdgeId: null,
        };
      }
      const wasActive = state.activeSheetId === sheetId;
      const newActiveId = wasActive ? newSheets[0].id : state.activeSheetId;
      const activeSheet = newSheets.find(s => s.id === newActiveId);
      return {
        sheets: newSheets,
        activeSheetId: newActiveId,
        nodes: activeSheet?.nodes ?? [],
        edges: activeSheet?.edges ?? [],
        selectedNode: null,
        selectedEdgeId: null,
      };
    });
    useHistoryStore.getState().clearHistory();
    const newActive = get().sheets.find(s => s.id === get().activeSheetId);
    if (newActive) {
      useHistoryStore.getState().pushHistory(newActive.nodes ?? [], newActive.edges ?? []);
    }
  },

  setActiveSheet: (sheetId: string) => {
    const state = get();
    const sheet = state.sheets.find(s => s.id === sheetId);
    if (!sheet) return;
    // Save current sheet's data before switching
    const updatedSheets = state.sheets.map(s =>
      s.id === state.activeSheetId ? { ...s, nodes: state.nodes, edges: state.edges } : s
    );
    const targetSheet = updatedSheets.find(s => s.id === sheetId)!;
    set({
      sheets: updatedSheets,
      activeSheetId: sheetId,
      nodes: targetSheet.nodes,
      edges: targetSheet.edges,
      selectedNode: null,
      selectedEdgeId: null,
    });
    useHistoryStore.getState().clearHistory();
    useHistoryStore.getState().pushHistory(targetSheet.nodes ?? [], targetSheet.edges ?? []);
  },

  renameSheet: (sheetId: string, name: string) => {
    set(state => ({
      sheets: state.sheets.map(s => (s.id === sheetId ? { ...s, name } : s)),
      dirty: true,
    }));
  },

  duplicateSheet: (sheetId: string) => {
    const sheet = get().sheets.find(s => s.id === sheetId);
    if (!sheet) return '';

    const nodeIdMap = new Map<string, string>();
    const newNodes = sheet.nodes.map(n => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      nodeIdMap.set(n.id, newId);
      return { ...n, id: newId, x: n.x + 20, y: n.y + 20 };
    });

    const newEdges = sheet.edges.map((e, i) => ({
      ...e,
      id: `edge-${Date.now()}-${i}`,
      source:
        typeof e.source === 'string'
          ? (nodeIdMap.get(e.source) ?? e.source)
          : { ...e.source, cell: nodeIdMap.get(e.source.cell) ?? e.source.cell },
      target:
        typeof e.target === 'string'
          ? (nodeIdMap.get(e.target) ?? e.target)
          : { ...e.target, cell: nodeIdMap.get(e.target.cell) ?? e.target.cell },
    }));

    const newSheet: GraphSheet = {
      id: `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${sheet.name} (副本)`,
      type: sheet.type,
      nodes: newNodes,
      edges: newEdges,
    };
    set(state => ({
      sheets: [...state.sheets, newSheet],
    }));
    return newSheet.id;
  },

  // Alignment & Distribution
  alignLeft: () => {
    const { selectedNodeIds, nodes } = get();
    if (selectedNodeIds.length < 2) return;
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const minX = Math.min(...selectedNodes.map(n => n.x));
    set(state => {
      const updated = state.nodes.map(n =>
        selectedNodeIds.includes(n.id) ? { ...n, x: minX } : n
      );
      return {
        nodes: updated,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, nodes: updated } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  alignCenter: () => {
    const { selectedNodeIds, nodes } = get();
    if (selectedNodeIds.length < 2) return;
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const centerX =
      selectedNodes.reduce((sum, n) => sum + n.x + n.width / 2, 0) / selectedNodes.length;
    set(state => {
      const updated = state.nodes.map(n =>
        selectedNodeIds.includes(n.id) ? { ...n, x: centerX - n.width / 2 } : n
      );
      return {
        nodes: updated,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, nodes: updated } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  alignRight: () => {
    const { selectedNodeIds, nodes } = get();
    if (selectedNodeIds.length < 2) return;
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const maxRight = Math.max(...selectedNodes.map(n => n.x + n.width));
    set(state => {
      const updated = state.nodes.map(n =>
        selectedNodeIds.includes(n.id) ? { ...n, x: maxRight - n.width } : n
      );
      return {
        nodes: updated,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, nodes: updated } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  alignTop: () => {
    const { selectedNodeIds, nodes } = get();
    if (selectedNodeIds.length < 2) return;
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const minY = Math.min(...selectedNodes.map(n => n.y));
    set(state => {
      const updated = state.nodes.map(n =>
        selectedNodeIds.includes(n.id) ? { ...n, y: minY } : n
      );
      return {
        nodes: updated,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, nodes: updated } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  alignMiddle: () => {
    const { selectedNodeIds, nodes } = get();
    if (selectedNodeIds.length < 2) return;
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const centerY =
      selectedNodes.reduce((sum, n) => sum + n.y + n.height / 2, 0) / selectedNodes.length;
    set(state => {
      const updated = state.nodes.map(n =>
        selectedNodeIds.includes(n.id) ? { ...n, y: centerY - n.height / 2 } : n
      );
      return {
        nodes: updated,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, nodes: updated } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  alignBottom: () => {
    const { selectedNodeIds, nodes } = get();
    if (selectedNodeIds.length < 2) return;
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const maxBottom = Math.max(...selectedNodes.map(n => n.y + n.height));
    set(state => {
      const updated = state.nodes.map(n =>
        selectedNodeIds.includes(n.id) ? { ...n, y: maxBottom - n.height } : n
      );
      return {
        nodes: updated,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, nodes: updated } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  distributeHorizontal: () => {
    const { selectedNodeIds, nodes } = get();
    if (selectedNodeIds.length < 3) return;
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const sorted = [...selectedNodes].sort(
      (a, b) => a.x + a.width / 2 - (b.x + b.width / 2)
    );
    const leftmost = sorted[0].x;
    const rightmost = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
    const totalWidth = sorted.reduce((sum, n) => sum + n.width, 0);
    const spacing = (rightmost - leftmost - totalWidth) / (sorted.length - 1);
    const posMap = new Map<string, number>();
    let currentX = leftmost;
    for (const n of sorted) {
      posMap.set(n.id, currentX);
      currentX += n.width + spacing;
    }
    set(state => {
      const updated = state.nodes.map(n =>
        posMap.has(n.id) ? { ...n, x: posMap.get(n.id)! } : n
      );
      return {
        nodes: updated,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, nodes: updated } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  distributeVertical: () => {
    const { selectedNodeIds, nodes } = get();
    if (selectedNodeIds.length < 3) return;
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const sorted = [...selectedNodes].sort(
      (a, b) => a.y + a.height / 2 - (b.y + b.height / 2)
    );
    const topmost = sorted[0].y;
    const bottommost = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
    const totalHeight = sorted.reduce((sum, n) => sum + n.height, 0);
    const spacing = (bottommost - topmost - totalHeight) / (sorted.length - 1);
    const posMap = new Map<string, number>();
    let currentY = topmost;
    for (const n of sorted) {
      posMap.set(n.id, currentY);
      currentY += n.height + spacing;
    }
    set(state => {
      const updated = state.nodes.map(n =>
        posMap.has(n.id) ? { ...n, y: posMap.get(n.id)! } : n
      );
      return {
        nodes: updated,
        dirty: true,
        sheets: state.sheets.map(s =>
          s.id === state.activeSheetId ? { ...s, nodes: updated } : s
        ),
      };
    });
    pushHistoryIfNeeded(get);
  },

  // Undo/Redo
  undo: () => {
    const prev = useHistoryStore.getState().undo();
    if (prev) {
      set({ _restoringFromHistory: true });
      get().loadGraph(prev.nodes, prev.edges);
      set({ _restoringFromHistory: false });
    }
  },

  redo: () => {
    const next = useHistoryStore.getState().redo();
    if (next) {
      set({ _restoringFromHistory: true });
      get().loadGraph(next.nodes, next.edges);
      set({ _restoringFromHistory: false });
    }
  },

  canUndo: () => useHistoryStore.getState().canUndo(),
  canRedo: () => useHistoryStore.getState().canRedo(),
}));
