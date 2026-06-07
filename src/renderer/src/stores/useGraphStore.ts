import { create } from 'zustand';
import { GraphType } from '../types';
import type { AnyNode, FlowNode, ModuleNode, GraphEdge, ProjectFile, GraphSheet } from '../types';
import { useHistoryStore } from './useHistoryStore';

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
  updateNode: (nodeId: string, patch: Partial<AnyNode>) => void;

  addEdge: (edge: GraphEdge) => void;
  removeEdge: (edgeId: string) => void;
  updateEdge: (edgeId: string, patch: Partial<GraphEdge>) => void;

  setSelectedNode: (node: AnyNode | null) => void;
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

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function endpointId(ep: GraphEdge['source'] | GraphEdge['target']): string {
  return typeof ep === 'string' ? ep : ep.cell;
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
    set((state: GraphState) => ({ nodes: [...state.nodes, node], dirty: true }));
    pushHistoryIfNeeded(get);
  },

  removeNode: (nodeId: string) => {
    set((state: GraphState) => ({
      nodes: state.nodes.filter((n: AnyNode) => n.id !== nodeId),
      edges: state.edges.filter(
        (e: GraphEdge) => endpointId(e.source) !== nodeId && endpointId(e.target) !== nodeId
      ),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
      dirty: true,
    }));
    pushHistoryIfNeeded(get);
  },

  updateNode: (nodeId: string, patch: Partial<AnyNode>) => {
    set((state: GraphState) => ({
      nodes: state.nodes.map((n: AnyNode) =>
        n.id === nodeId ? ({ ...n, ...patch } as AnyNode) : n
      ),
      selectedNode:
        state.selectedNode?.id === nodeId
          ? ({ ...state.selectedNode, ...patch } as AnyNode)
          : state.selectedNode,
      dirty: true,
    }));
    pushHistoryIfNeeded(get);
  },

  addEdge: (edge: GraphEdge) => {
    set((state: GraphState) => ({ edges: [...state.edges, edge], dirty: true }));
    pushHistoryIfNeeded(get);
  },

  removeEdge: (edgeId: string) => {
    set((state: GraphState) => ({
      edges: state.edges.filter((e: GraphEdge) => e.id !== edgeId),
      selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
      dirty: true,
    }));
    pushHistoryIfNeeded(get);
  },

  updateEdge: (edgeId: string, patch: Partial<GraphEdge>) => {
    set((state: GraphState) => ({
      edges: state.edges.map((e: GraphEdge) =>
        e.id === edgeId ? { ...e, ...patch } : e
      ),
      dirty: true,
    }));
    pushHistoryIfNeeded(get);
  },

  setSelectedNode: (node: AnyNode | null) => set({ selectedNode: node, selectedEdgeId: null }),
  setSelectedEdgeId: (id: string | null) => set({ selectedEdgeId: id, selectedNode: null }),
  clearSelection: () => set({ selectedNode: null, selectedEdgeId: null }),

  setEdgeStyleId: (id: string) => set({ edgeStyleId: id }),

  setRestoringFromHistory: (v: boolean) => set({ _restoringFromHistory: v }),

  enterEdgeCreationMode: (sourceId: string) =>
    set({ edgeCreationMode: true, edgeCreationSourceId: sourceId }),

  exitEdgeCreationMode: () =>
    set({ edgeCreationMode: false, edgeCreationSourceId: null }),

  loadProject: (project: ProjectFile) => {
    const sheets = project.sheets ?? [];
    const firstSheet = sheets[0];
    set({
      projectName: project.name,
      currentFilePath: (project as any).__filePath ?? null,
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
    set({ nodes, edges, selectedNode: null, selectedEdgeId: null, dirty: true }),

  buildProjectFile: (): ProjectFile => {
    const state = get();
    const activeSheet = state.sheets.find((s) => s.id === state.activeSheetId) ?? state.sheets[0];
    return {
      version: '1.0.0',
      name: state.projectName,
      updatedAt: new Date().toISOString(),
      sheets: state.sheets,
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
    set((state) => ({
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
    set((state) => {
      const newSheets = state.sheets.filter((s) => s.id !== sheetId);
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
      const activeSheet = newSheets.find((s) => s.id === newActiveId);
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
    const newActive = get().sheets.find((s) => s.id === get().activeSheetId);
    if (newActive) {
      useHistoryStore.getState().pushHistory(newActive.nodes ?? [], newActive.edges ?? []);
    }
  },

  setActiveSheet: (sheetId: string) => {
    const sheet = get().sheets.find((s) => s.id === sheetId);
    if (sheet) {
      set({
        activeSheetId: sheetId,
        nodes: sheet.nodes,
        edges: sheet.edges,
        selectedNode: null,
        selectedEdgeId: null,
      });
      useHistoryStore.getState().clearHistory();
      useHistoryStore.getState().pushHistory(sheet.nodes ?? [], sheet.edges ?? []);
    }
  },

  renameSheet: (sheetId: string, name: string) => {
    set((state) => ({
      sheets: state.sheets.map((s) => (s.id === sheetId ? { ...s, name } : s)),
      dirty: true,
    }));
  },

  duplicateSheet: (sheetId: string) => {
    const sheet = get().sheets.find((s) => s.id === sheetId);
    if (!sheet) return '';
    
    const newSheet: GraphSheet = {
      id: `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${sheet.name} (副本)`,
      type: sheet.type,
      nodes: sheet.nodes.map((n) => ({
        ...n,
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        x: n.x + 20,
        y: n.y + 20,
      })),
      edges: sheet.edges.map((e, i) => ({
        ...e,
        id: `edge-${Date.now()}-${i}`,
        source: typeof e.source === 'string' ? e.source : { ...e.source },
        target: typeof e.target === 'string' ? e.target : { ...e.target },
      })),
    };
    set((state) => ({
      sheets: [...state.sheets, newSheet],
    }));
    return newSheet.id;
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