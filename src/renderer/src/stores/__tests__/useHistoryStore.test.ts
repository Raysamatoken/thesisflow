import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore } from '../useHistoryStore';
import type { AnyNode, GraphEdge } from '../../types';
import { FlowNodeShape } from '../../types';

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

describe('useHistoryStore', () => {
  beforeEach(() => {
    // Reset the store completely before each test
    useHistoryStore.setState({ past: [], future: [], maxHistorySize: 50 });
  });

  it('should initialize with empty history', () => {
    const state = useHistoryStore.getState();
    expect(state.past).toEqual([]);
    expect(state.future).toEqual([]);
    expect(state.maxHistorySize).toBe(50);
  });

  it('should push history', () => {
    const nodes = [createMockNode('1')];
    const edges: GraphEdge[] = [];

    useHistoryStore.getState().pushHistory(nodes, edges);

    const state = useHistoryStore.getState();
    expect(state.past).toHaveLength(1);
    expect(state.past[0].nodes).toEqual(nodes);
    expect(state.past[0].edges).toEqual(edges);
    expect(state.future).toEqual([]);
  });

  it('should undo to previous state', () => {
    const nodes1 = [createMockNode('1')];
    const nodes2 = [createMockNode('1'), createMockNode('2')];

    useHistoryStore.getState().pushHistory(nodes1, []);
    useHistoryStore.getState().pushHistory(nodes2, []);

    // After 2 pushes, past has 2 entries
    expect(useHistoryStore.getState().past).toHaveLength(2);

    const result = useHistoryStore.getState().undo();

    // Undo returns the previous state (before the last push)
    expect(result).not.toBeNull();
    expect(result!.nodes).toHaveLength(1);
    expect(result!.nodes[0].id).toBe('1');
  });

  it('should redo after undo', () => {
    const nodes1 = [createMockNode('1')];
    const nodes2 = [createMockNode('1'), createMockNode('2')];

    useHistoryStore.getState().pushHistory(nodes1, []);
    useHistoryStore.getState().pushHistory(nodes2, []);
    useHistoryStore.getState().undo();

    const result = useHistoryStore.getState().redo();

    expect(result).not.toBeNull();
    expect(result!.nodes).toHaveLength(2);
  });

  it('should return null when undoing empty history', () => {
    const result = useHistoryStore.getState().undo();
    expect(result).toBeNull();
  });

  it('should return null when redoing empty future', () => {
    const result = useHistoryStore.getState().redo();
    expect(result).toBeNull();
  });

  it('should clear history', () => {
    useHistoryStore.getState().pushHistory([createMockNode('1')], []);
    useHistoryStore.getState().pushHistory([createMockNode('2')], []);

    useHistoryStore.getState().clearHistory();

    const state = useHistoryStore.getState();
    expect(state.past).toEqual([]);
    expect(state.future).toEqual([]);
  });

  it('should report canUndo correctly', () => {
    expect(useHistoryStore.getState().canUndo()).toBe(false);

    useHistoryStore.getState().pushHistory([createMockNode('1')], []);
    expect(useHistoryStore.getState().canUndo()).toBe(true);
  });

  it('should report canRedo correctly', () => {
    expect(useHistoryStore.getState().canRedo()).toBe(false);

    useHistoryStore.getState().pushHistory([createMockNode('1')], []);
    useHistoryStore.getState().pushHistory([createMockNode('2')], []);
    useHistoryStore.getState().undo();

    expect(useHistoryStore.getState().canRedo()).toBe(true);
  });

  it('should limit history size', () => {
    useHistoryStore.setState({ maxHistorySize: 3 });

    for (let i = 0; i < 5; i++) {
      useHistoryStore.getState().pushHistory([createMockNode(`${i}`)], []);
    }

    const state = useHistoryStore.getState();
    expect(state.past).toHaveLength(3);
  });
});
