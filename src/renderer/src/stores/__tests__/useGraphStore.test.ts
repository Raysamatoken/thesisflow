import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGraphStore } from '../useGraphStore';
import type { AnyNode, GraphEdge } from '../../types';
import { FlowNodeShape, GraphType } from '../../types';

// Mock the history store to prevent interference
vi.mock('../useHistoryStore', () => ({
  useHistoryStore: {
    getState: () => ({
      pushHistory: vi.fn(),
      clearHistory: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: vi.fn().mockReturnValue(false),
      canRedo: vi.fn().mockReturnValue(false),
    }),
  },
}));

// Helper to create a mock node
function createMockNode(id: string, x = 0, y = 0): AnyNode {
  return {
    id,
    shape: FlowNodeShape.Process,
    x,
    y,
    width: 140,
    height: 60,
    label: `Node ${id}`,
    data: {
      shape: FlowNodeShape.Process,
      color: '#ffffff',
      borderColor: '#333333',
      fontColor: '#333333',
      fontSize: 12,
      remark: '',
    },
  } as AnyNode;
}

// Helper to create a mock edge
function createMockEdge(id: string, source: string, target: string): GraphEdge {
  return {
    id,
    source,
    target,
    label: '',
    data: {
      color: '#333333',
      borderColor: '#333333',
      fontColor: '#333333',
      fontSize: 12,
      remark: '',
    },
  } as GraphEdge;
}

describe('useGraphStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useGraphStore.setState({
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
    });
  });

  describe('addNode', () => {
    it('should add a node to the store', () => {
      const node = createMockNode('1');
      useGraphStore.getState().addNode(node);

      expect(useGraphStore.getState().nodes).toHaveLength(1);
      expect(useGraphStore.getState().nodes[0]).toEqual(node);
      expect(useGraphStore.getState().dirty).toBe(true);
    });

    it('should add multiple nodes', () => {
      useGraphStore.getState().addNode(createMockNode('1'));
      useGraphStore.getState().addNode(createMockNode('2'));

      expect(useGraphStore.getState().nodes).toHaveLength(2);
    });
  });

  describe('removeNode', () => {
    it('should remove a node', () => {
      useGraphStore.getState().addNode(createMockNode('1'));
      useGraphStore.getState().addNode(createMockNode('2'));
      useGraphStore.getState().removeNode('1');

      expect(useGraphStore.getState().nodes).toHaveLength(1);
      expect(useGraphStore.getState().nodes[0].id).toBe('2');
    });

    it('should remove connected edges', () => {
      useGraphStore.getState().addNode(createMockNode('1'));
      useGraphStore.getState().addNode(createMockNode('2'));
      useGraphStore.getState().addEdge(createMockEdge('e1', '1', '2'));
      useGraphStore.getState().removeNode('1');

      expect(useGraphStore.getState().edges).toHaveLength(0);
    });

    it('should clear selection if selected node is removed', () => {
      useGraphStore.getState().addNode(createMockNode('1'));
      useGraphStore.getState().setSelectedNode(useGraphStore.getState().nodes[0]);
      useGraphStore.getState().removeNode('1');

      expect(useGraphStore.getState().selectedNode).toBeNull();
    });
  });

  describe('updateNode', () => {
    it('should update node properties', () => {
      useGraphStore.getState().addNode(createMockNode('1'));
      useGraphStore.getState().updateNode('1', { label: 'Updated' });

      expect(useGraphStore.getState().nodes[0].label).toBe('Updated');
    });

    it('should update selected node if it matches', () => {
      const node = createMockNode('1');
      useGraphStore.getState().addNode(node);
      useGraphStore.getState().setSelectedNode(node);
      useGraphStore.getState().updateNode('1', { label: 'Updated' });

      expect(useGraphStore.getState().selectedNode?.label).toBe('Updated');
    });
  });

  describe('addEdge', () => {
    it('should add an edge', () => {
      useGraphStore.getState().addNode(createMockNode('1'));
      useGraphStore.getState().addNode(createMockNode('2'));
      useGraphStore.getState().addEdge(createMockEdge('e1', '1', '2'));

      expect(useGraphStore.getState().edges).toHaveLength(1);
      expect(useGraphStore.getState().edges[0].id).toBe('e1');
    });
  });

  describe('removeEdge', () => {
    it('should remove an edge', () => {
      useGraphStore.getState().addNode(createMockNode('1'));
      useGraphStore.getState().addNode(createMockNode('2'));
      useGraphStore.getState().addEdge(createMockEdge('e1', '1', '2'));
      useGraphStore.getState().removeEdge('e1');

      expect(useGraphStore.getState().edges).toHaveLength(0);
    });

    it('should clear selection if selected edge is removed', () => {
      useGraphStore.getState().addNode(createMockNode('1'));
      useGraphStore.getState().addNode(createMockNode('2'));
      useGraphStore.getState().addEdge(createMockEdge('e1', '1', '2'));
      useGraphStore.getState().setSelectedEdgeId('e1');
      useGraphStore.getState().removeEdge('e1');

      expect(useGraphStore.getState().selectedEdgeId).toBeNull();
    });
  });

  describe('selection', () => {
    it('should set selected node', () => {
      const node = createMockNode('1');
      useGraphStore.getState().addNode(node);
      useGraphStore.getState().setSelectedNode(node);

      expect(useGraphStore.getState().selectedNode).toEqual(node);
      expect(useGraphStore.getState().selectedNodeIds).toEqual(['1']);
    });

    it('should set multiple selected node ids', () => {
      useGraphStore.getState().addNode(createMockNode('1'));
      useGraphStore.getState().addNode(createMockNode('2'));
      useGraphStore.getState().setSelectedNodeIds(['1', '2']);

      expect(useGraphStore.getState().selectedNodeIds).toEqual(['1', '2']);
    });

    it('should clear selection', () => {
      useGraphStore.getState().addNode(createMockNode('1'));
      useGraphStore.getState().setSelectedNode(useGraphStore.getState().nodes[0]);
      useGraphStore.getState().clearSelection();

      expect(useGraphStore.getState().selectedNode).toBeNull();
      expect(useGraphStore.getState().selectedNodeIds).toEqual([]);
      expect(useGraphStore.getState().selectedEdgeId).toBeNull();
    });
  });

  describe('sheet management', () => {
    it('should add a sheet', () => {
      const sheetId = useGraphStore.getState().addSheet('Test Sheet');

      expect(useGraphStore.getState().sheets).toHaveLength(1);
      expect(useGraphStore.getState().sheets[0].name).toBe('Test Sheet');
      expect(useGraphStore.getState().activeSheetId).toBe(sheetId);
    });

    it('should add a module sheet', () => {
      useGraphStore.getState().addSheet('Module', GraphType.Module);

      expect(useGraphStore.getState().sheets[0].type).toBe(GraphType.Module);
    });

    it('should switch active sheet', () => {
      const id1 = useGraphStore.getState().addSheet('Sheet 1');
      useGraphStore.getState().addSheet('Sheet 2');
      useGraphStore.getState().setActiveSheet(id1);

      expect(useGraphStore.getState().activeSheetId).toBe(id1);
    });

    it('should rename a sheet', () => {
      const sheetId = useGraphStore.getState().addSheet('Original');
      useGraphStore.getState().renameSheet(sheetId, 'Renamed');

      expect(useGraphStore.getState().sheets[0].name).toBe('Renamed');
    });

    it('should remove a sheet', () => {
      const id1 = useGraphStore.getState().addSheet('Sheet 1');
      useGraphStore.getState().addSheet('Sheet 2');
      useGraphStore.getState().removeSheet(id1);

      expect(useGraphStore.getState().sheets).toHaveLength(1);
      expect(useGraphStore.getState().sheets[0].name).toBe('Sheet 2');
    });

    it('should create default sheet when all are removed', () => {
      const id1 = useGraphStore.getState().addSheet('Sheet 1');
      useGraphStore.getState().removeSheet(id1);

      expect(useGraphStore.getState().sheets).toHaveLength(1);
    });
  });

  describe('alignment', () => {
    it('should align nodes left', () => {
      useGraphStore.getState().addNode(createMockNode('1', 10, 0));
      useGraphStore.getState().addNode(createMockNode('2', 50, 0));
      useGraphStore.getState().setSelectedNodeIds(['1', '2']);
      useGraphStore.getState().alignLeft();

      const nodes = useGraphStore.getState().nodes;
      expect(nodes[0].x).toBe(10);
      expect(nodes[1].x).toBe(10);
    });

    it('should align nodes top', () => {
      useGraphStore.getState().addNode(createMockNode('1', 0, 10));
      useGraphStore.getState().addNode(createMockNode('2', 0, 50));
      useGraphStore.getState().setSelectedNodeIds(['1', '2']);
      useGraphStore.getState().alignTop();

      const nodes = useGraphStore.getState().nodes;
      expect(nodes[0].y).toBe(10);
      expect(nodes[1].y).toBe(10);
    });

    it('should not align with less than 2 nodes selected', () => {
      useGraphStore.getState().addNode(createMockNode('1', 10, 0));
      useGraphStore.getState().addNode(createMockNode('2', 50, 0));
      useGraphStore.getState().setSelectedNodeIds(['1']);
      useGraphStore.getState().alignLeft();

      const nodes = useGraphStore.getState().nodes;
      expect(nodes[0].x).toBe(10);
      expect(nodes[1].x).toBe(50);
    });
  });

  describe('buildProjectFile', () => {
    it('should build a project file with sheets', () => {
      useGraphStore.getState().addSheet('Sheet 1');
      useGraphStore.getState().addNode(createMockNode('1'));

      const project = useGraphStore.getState().buildProjectFile();

      expect(project.version).toBe('1.0.0');
      expect(project.sheets).toHaveLength(1);
      expect(useGraphStore.getState().nodes).toHaveLength(1);
    });
  });

  describe('clearGraph', () => {
    it('should clear all data', () => {
      useGraphStore.getState().addNode(createMockNode('1'));
      useGraphStore.getState().addEdge(createMockEdge('e1', '1', '2'));
      useGraphStore.getState().setProjectName('Test');
      useGraphStore.getState().clearGraph();

      expect(useGraphStore.getState().nodes).toEqual([]);
      expect(useGraphStore.getState().edges).toEqual([]);
      expect(useGraphStore.getState().projectName).toBe('未命名项目');
    });
  });
});
