import { Graph as AntvGraph } from '@antv/graphlib';
import { DagreLayout } from '@antv/layout';
import { useGraphStore, type AnyNode } from '../stores/useGraphStore';
import type { GraphEdge, EdgeEndpoint } from '../types';

function toNodeId(ep: EdgeEndpoint): string {
  return typeof ep === 'string' ? ep : ep.cell;
}

export interface DagreOptions {
  rankdir?: 'TB' | 'LR' | 'BT' | 'RL';
  nodesep?: number;
  ranksep?: number;
}

const DEFAULT_OPTIONS: Required<DagreOptions> = {
  rankdir: 'TB',
  nodesep: 60,
  ranksep: 80,
};

export async function runAutoLayout(options?: DagreOptions): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { nodes, edges } = useGraphStore.getState();
  if (nodes.length === 0) return;

  // Build @antv/graphlib Graph for DagreLayout
  const g = new AntvGraph<any, any>({
    nodes: nodes.map((n) => ({
      id: n.id,
      width: n.width,
      height: n.height,
    })),
    edges: edges.map((e, i) => ({
      id: `edge-${i}`,
      source: toNodeId(e.source),
      target: toNodeId(e.target),
    })),
  });

  const layout = new DagreLayout({
    rankdir: opts.rankdir,
    nodesep: opts.nodesep,
    ranksep: opts.ranksep,
  });

  const result = await layout.execute(g);

  // Build position map; dagre returns center coords
  const posMap = new Map<string, { x: number; y: number }>();
  for (const rn of result.nodes) {
    const orig = nodes.find((n) => n.id === rn.id);
    if (orig) {
      posMap.set(rn.id, {
        x: rn.data.x - orig.width / 2,
        y: rn.data.y - orig.height / 2,
      });
    }
  }

  const updatedNodes: AnyNode[] = nodes.map((n) => {
    const pos = posMap.get(n.id);
    return pos ? { ...n, x: pos.x, y: pos.y } : n;
  });

  useGraphStore.getState().loadGraph(updatedNodes, edges);
}
