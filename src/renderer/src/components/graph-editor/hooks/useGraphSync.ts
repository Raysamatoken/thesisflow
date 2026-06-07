import { useRef, useCallback, useEffect } from 'react';
import type { Graph } from '@antv/x6';
import { useGraphStore, EDGE_PRESETS } from '../../../stores/useGraphStore';
import type { AnyNode, GraphEdge } from '../../../types';

export function useGraphSync(graphRef: React.MutableRefObject<Graph | null>) {
  const syncVersion = useRef(0);
  const nodes = useGraphStore(s => s.nodes);
  const edges = useGraphStore(s => s.edges);

  const syncStoreToGraph = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;

    const currentVersion = ++syncVersion.current;
    const storeNodes = useGraphStore.getState().nodes;
    const storeEdges = useGraphStore.getState().edges;

    const graphNodeMap = new Map(graph.getNodes().map(n => [n.id, n]));
    const storeNodeMap = new Map(storeNodes.map(n => [n.id, n]));

    for (const [id] of graphNodeMap) {
      if (!storeNodeMap.has(id)) {
        graph.removeNode(id);
      }
    }
    if (currentVersion !== syncVersion.current) return;

    for (const node of storeNodes) {
      const existing = graph.getCellById(node.id);
      if (existing && existing.isNode()) {
        const nodeCell = existing as any;
        const pos = nodeCell.position();
        const size = nodeCell.size();
        if (pos.x !== node.x || pos.y !== node.y) {
          nodeCell.position(node.x, node.y);
        }
        if (size.width !== node.width || size.height !== node.height) {
          nodeCell.resize(node.width, node.height);
        }
        if (node.label !== undefined) {
          nodeCell.setAttrByPath('label/text', node.label ?? '');
        }
      } else {
        graph.addNode({
          id: node.id,
          shape: node.shape,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          label: node.label ?? '',
          data: node.data,
          attrs: node.attrs,
          ports: node.ports,
        });
      }
    }
    if (currentVersion !== syncVersion.current) return;

    const graphEdgeMap = new Map(graph.getEdges().map(e => [e.id, e]));
    const storeEdgeMap = new Map(storeEdges.map(e => [e.id, e]));

    for (const [id] of graphEdgeMap) {
      if (!storeEdgeMap.has(id)) {
        graph.removeEdge(id);
      }
    }
    if (currentVersion !== syncVersion.current) return;

    for (const edge of storeEdges) {
      if (!graphEdgeMap.has(edge.id)) {
        graph.addEdge({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label ?? '',
          data: edge.data,
          attrs: edge.attrs,
          labels: edge.labels,
          router: edge.router ?? { name: 'manhattan' },
          connector: edge.connector ?? { name: 'rounded' },
        });
      }
    }
  }, [graphRef]);

  useEffect(() => {
    syncStoreToGraph();
  }, [nodes, edges, syncStoreToGraph]);

  return { syncVersion, syncStoreToGraph };
}
