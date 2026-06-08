import { create } from 'zustand';
import type { AnyNode, GraphEdge } from '../types';

interface HistoryState {
  past: Array<{ nodes: AnyNode[]; edges: GraphEdge[] }>;
  future: Array<{ nodes: AnyNode[]; edges: GraphEdge[] }>;
  maxHistorySize: number;

  pushHistory: (nodes: AnyNode[], edges: GraphEdge[]) => void;
  undo: () => { nodes: AnyNode[]; edges: GraphEdge[] } | null;
  redo: () => { nodes: AnyNode[]; edges: GraphEdge[] } | null;
  clearHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  past: [],
  future: [],
  maxHistorySize: MAX_HISTORY,

  pushHistory: (nodes, edges) => {
    set(state => {
      const newPast = [...state.past, { nodes, edges }];
      if (newPast.length > state.maxHistorySize) {
        newPast.shift();
      }
      return {
        past: newPast,
        future: [],
      };
    });
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return null;

    const current = past[past.length - 1];
    const newPast = past.slice(0, -1);

    set({
      past: newPast,
      future: [current, ...future],
    });

    return newPast.length > 0 ? newPast[newPast.length - 1] : { nodes: [], edges: [] };
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);
    set({
      past: [...past, next],
      future: newFuture,
    });
    return next;
  },

  clearHistory: () => set({ past: [], future: [] }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
