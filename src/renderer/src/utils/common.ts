import type { GraphEdge, AnyNode } from '../types';
import { useGraphStore } from '../stores/useGraphStore';

export function endpointId(ep: GraphEdge['source']): string {
  return typeof ep === 'string' ? ep : ep.cell;
}

export function duplicateNodes(
  nodes: AnyNode[],
  edges: GraphEdge[]
): { newNodes: AnyNode[]; newEdges: GraphEdge[] } {
  const offset = 20;
  const nodeIdMap = new Map<string, string>();

  const newNodes = nodes.map(node => {
    const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    nodeIdMap.set(node.id, newId);
    return { ...node, id: newId, x: node.x + offset, y: node.y + offset };
  });

  const newEdges = edges.map((edge, i) => ({
    ...edge,
    id: `edge-${Date.now()}-${i}`,
    source:
      typeof edge.source === 'string'
        ? (nodeIdMap.get(edge.source) ?? edge.source)
        : { ...edge.source, cell: nodeIdMap.get(edge.source.cell) ?? edge.source.cell },
    target:
      typeof edge.target === 'string'
        ? (nodeIdMap.get(edge.target) ?? edge.target)
        : { ...edge.target, cell: nodeIdMap.get(edge.target.cell) ?? edge.target.cell },
  }));

  return { newNodes, newEdges };
}

export function copySelection(): {
  nodes: AnyNode[];
  edges: GraphEdge[];
} | null {
  const { selectedNode, selectedEdgeId, edges } = useGraphStore.getState();
  if (selectedNode) {
    const connectedEdges = edges.filter(
      e => endpointId(e.source) === selectedNode.id || endpointId(e.target) === selectedNode.id
    );
    return { nodes: [selectedNode], edges: connectedEdges };
  }
  if (selectedEdgeId) {
    const edgeToCopy = edges.find(e => e.id === selectedEdgeId);
    if (edgeToCopy) {
      return { nodes: [], edges: [edgeToCopy] };
    }
  }
  return null;
}
