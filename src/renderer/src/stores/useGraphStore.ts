import { create } from 'zustand';
import type { FlowNode, ModuleNode, GraphEdge, ProjectFile, GraphSheet } from '../types';
import { GraphType } from '../types';

export type AnyNode = FlowNode | ModuleNode;

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
  nodes: AnyNode[];
  edges: GraphEdge[];
  selectedNode: AnyNode | null;
  selectedEdgeId: string | null;

  projectName: string;
  currentFilePath: string | null;
  dirty: boolean;

  /** 当前选中的连线样式 */
  edgeStyleId: string;

  /** 连线创建模式 */
  edgeCreationMode: boolean;
  edgeCreationSourceId: string | null;
  enterEdgeCreationMode: (sourceId: string) => void;
  exitEdgeCreationMode: () => void;

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
}

export const useGraphStore = create<GraphState>()((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedEdgeId: null,
  projectName: '未命名项目',
  currentFilePath: null,
  dirty: false,
  edgeStyleId: 'straight-arrow',
  edgeCreationMode: false,
  edgeCreationSourceId: null,

  addNode: (node) =>
    set((state) => ({ nodes: [...state.nodes, node], dirty: true })),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => endpointId(e.source) !== nodeId && endpointId(e.target) !== nodeId
      ),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
      dirty: true,
    })),

  updateNode: (nodeId, patch) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, ...patch } : n
      ),
      selectedNode:
        state.selectedNode?.id === nodeId
          ? { ...state.selectedNode, ...patch }
          : state.selectedNode,
      dirty: true,
    })),

  addEdge: (edge) =>
    set((state) => ({ edges: [...state.edges, edge], dirty: true })),

  removeEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
      selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
      dirty: true,
    })),

  updateEdge: (edgeId, patch) =>
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === edgeId ? { ...e, ...patch } : e
      ),
      dirty: true,
    })),

  setSelectedNode: (node) => set({ selectedNode: node, selectedEdgeId: null }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNode: null }),
  clearSelection: () => set({ selectedNode: null, selectedEdgeId: null }),

  setEdgeStyleId: (id) => set({ edgeStyleId: id }),

  enterEdgeCreationMode: (sourceId) =>
    set({ edgeCreationMode: true, edgeCreationSourceId: sourceId }),

  exitEdgeCreationMode: () =>
    set({ edgeCreationMode: false, edgeCreationSourceId: null }),

  loadProject: (project) => {
    const firstSheet = project.sheets[0];
    set({
      projectName: project.name,
      currentFilePath: (project as any).__filePath ?? null,
      nodes: firstSheet?.nodes ?? [],
      edges: firstSheet?.edges ?? [],
      selectedNode: null,
      selectedEdgeId: null,
      edgeCreationMode: false,
      edgeCreationSourceId: null,
      dirty: false,
    });
  },

  setProjectName: (name) => set({ projectName: name, dirty: true }),
  setCurrentFilePath: (path) => set({ currentFilePath: path }),
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
      dirty: false,
    }),

  loadGraph: (nodes, edges) =>
    set({ nodes, edges, selectedNode: null, selectedEdgeId: null, dirty: true }),

  buildProjectFile: (): ProjectFile => {
    const state = get();
    const sheet: GraphSheet = {
      id: `sheet-${Date.now()}`,
      name: '流程图 1',
      type: GraphType.Flow,
      nodes: state.nodes,
      edges: state.edges,
    };
    return {
      version: '1.0.0',
      name: state.projectName,
      updatedAt: new Date().toISOString(),
      sheets: [sheet],
    };
  },
}));

function endpointId(ep: GraphEdge['source'] | GraphEdge['target']): string {
  return typeof ep === 'string' ? ep : ep.cell;
}