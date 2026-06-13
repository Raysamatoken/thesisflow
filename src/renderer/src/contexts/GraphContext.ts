import { createContext, useContext } from 'react';
import type { Graph } from '@antv/x6';

export const GraphContext = createContext<Graph | null>(null);

export function useGraphContext(): Graph | null {
  return useContext(GraphContext);
}