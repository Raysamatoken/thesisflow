import type { GraphEdge } from '../types';

export function endpointId(ep: GraphEdge['source']): string {
  return typeof ep === 'string' ? ep : ep.cell;
}
