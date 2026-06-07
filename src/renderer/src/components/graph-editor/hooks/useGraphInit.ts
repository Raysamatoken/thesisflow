import { useRef, useCallback } from 'react';
import { Graph } from '@antv/x6';
import { Export } from '@antv/x6-plugin-export';
import { Transform } from '@antv/x6-plugin-transform';
import { registerFlowShapes } from '../../../registerNodes';

let shapesRegistered = false;

export function useGraphInit() {
  const graphRef = useRef<Graph | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initGraph = useCallback(() => {
    if (!shapesRegistered) {
      registerFlowShapes();
      shapesRegistered = true;
    }

    const graph = new Graph({
      container: containerRef.current!,
      autoResize: true,
      panning: { enabled: true, modifiers: [] },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
        factor: 1.1,
        maxScale: 3,
        minScale: 0.25,
      },
      connecting: {
        anchor: 'center',
        connectionPoint: 'boundary',
        allowBlank: false,
        allowMulti: true,
        allowLoop: false,
        highlight: true,
        snap: { radius: 20 },
      },
      selecting: {
        enabled: true,
        rubberband: true,
        showNodeSelectionBox: true,
        modifiers: ['shift'],
      } as any,
      highlighting: {
        default: {
          name: 'stroke',
          args: { padding: 4, attrs: { stroke: '#1890ff', strokeWidth: 2 } },
        },
        magnetAdsorbed: {
          name: 'stroke',
          args: { padding: 4, attrs: { stroke: '#1890ff', strokeWidth: 2 } },
        },
      },
      grid: {
        visible: true,
        type: 'dot',
        size: 10,
        args: { color: '#e0e0e0', thickness: 1 },
      },
      snapline: {
        enabled: true,
        clean: 5,
        filter: (cell: any) => cell.isNode?.(),
      },
      background: { color: '#fafafa' },
    });

    graph.use(new Export());
    graph.use(new Transform({ resizing: { enabled: true }, rotating: { enabled: false } }));
    graphRef.current = graph;

    // Restore zoom from localStorage
    const savedZoom = localStorage.getItem('thesisflow-zoom');
    if (savedZoom) {
      const zoom = parseFloat(savedZoom);
      if (!isNaN(zoom) && zoom >= 0.25 && zoom <= 3) {
        graph.zoom(zoom);
      }
    }

    // Save zoom on change
    graph.on('scale', ({ sx }: { sx: number }) => {
      localStorage.setItem('thesisflow-zoom', String(sx));
    });

    return graph;
  }, []);

  return { graphRef, containerRef, initGraph };
}
