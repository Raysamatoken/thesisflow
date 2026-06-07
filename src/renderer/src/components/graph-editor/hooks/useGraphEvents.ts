import { useEffect } from 'react';
import type { Graph } from '@antv/x6';
import { message } from 'antd';
import { useGraphStore, EDGE_PRESETS } from '../../../stores/useGraphStore';
import type { AnyNode, GraphEdge } from '../../../types';

export function useGraphEvents(graphRef: React.MutableRefObject<Graph | null>) {
  const setSelectedNode = useGraphStore(s => s.setSelectedNode);
  const setSelectedNodeIds = useGraphStore(s => s.setSelectedNodeIds);
  const setSelectedEdgeId = useGraphStore(s => s.setSelectedEdgeId);
  const clearSelection = useGraphStore(s => s.clearSelection);
  const removeNode = useGraphStore(s => s.removeNode);
  const removeEdge = useGraphStore(s => s.removeEdge);
  const addEdge = useGraphStore(s => s.addEdge);
  const updateNode = useGraphStore(s => s.updateNode);
  const updateEdge = useGraphStore(s => s.updateEdge);
  const edgeStyleId = useGraphStore(s => s.edgeStyleId);
  const edgeCreationMode = useGraphStore(s => s.edgeCreationMode);
  const edgeCreationSourceId = useGraphStore(s => s.edgeCreationSourceId);
  const exitEdgeCreationMode = useGraphStore(s => s.exitEdgeCreationMode);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    // Port visibility
    const showPorts = (ports: NodeListOf<SVGElement>) => {
      ports.forEach(port => port.setAttribute('visibility', 'visible'));
    };
    const hidePorts = (ports: NodeListOf<SVGElement>) => {
      ports.forEach(port => port.setAttribute('visibility', 'hidden'));
    };

    graph.on('node:mouseenter', ({ node }) => {
      const container = document.getElementById('graph-container');
      if (!container) return;
      const ports = container.querySelectorAll('.x6-port-body');
      showPorts(ports as NodeListOf<SVGElement>);
      if (edgeCreationMode) {
        node.setAttrs({ body: { stroke: '#1890ff', strokeWidth: 2 } });
      }
    });

    graph.on('node:mouseleave', ({ node }) => {
      const container = document.getElementById('graph-container');
      if (!container) return;
      const ports = container.querySelectorAll('.x6-port-body');
      hidePorts(ports as NodeListOf<SVGElement>);
      if (edgeCreationMode) {
        node.setAttrs({ body: { stroke: '#333333', strokeWidth: 1.5 } });
      }
    });

    // Node click
    graph.on('node:click', ({ node }) => {
      if (edgeCreationMode && edgeCreationSourceId) {
        if (node.id !== edgeCreationSourceId) {
          const preset = EDGE_PRESETS.find(p => p.id === edgeStyleId) ?? EDGE_PRESETS[0];
          const lineAttrs: any = {
            stroke: '#333333',
            strokeWidth: 1.5,
            targetMarker: preset.targetMarker ? { name: 'block', width: 8, height: 6 } : null,
          };
          if (preset.strokeDasharray) lineAttrs.strokeDasharray = preset.strokeDasharray;
          const edgeRouter = preset.router === 'normal' ? undefined : { name: preset.router };
          const edgeConnector = preset.connector === 'normal' ? undefined : { name: preset.connector };
          const newEdge = graph.addEdge({
            source: edgeCreationSourceId,
            target: node.id,
            attrs: { line: lineAttrs },
            router: edgeRouter,
            connector: edgeConnector,
            labels: [],
            zIndex: 0,
          });
          addEdge(newEdge.toJSON() as unknown as GraphEdge);
        }
        exitEdgeCreationMode();
      } else {
        setSelectedNode(node.toJSON() as unknown as AnyNode);
      }
    });

    // Node moved
    graph.on('node:moved', ({ node }) => {
      const { x, y } = node.position();
      const { width, height } = node.size();
      updateNode(node.id, { x, y, width, height });
    });

    // Blank click
    graph.on('blank:click', () => {
      clearSelection();
    });

    // Edge connected
    graph.on('edge:connected', ({ edge }) => {
      addEdge(edge.toJSON() as unknown as GraphEdge);
    });

    // Edge click
    graph.on('edge:click', ({ edge }) => {
      setSelectedEdgeId(edge.id);
    });

    // Edge double-click for inline label editing
    graph.on('edge:dblclick', ({ edge }) => {
      const currentLabels = edge.getLabels();
      const currentLabel = currentLabels.length > 0 ? (currentLabels[0] as any).attrs?.label?.text ?? '' : '';
      const newLabel = prompt('输入连线标签:', typeof currentLabel === 'string' ? currentLabel : '');
      if (newLabel !== null) {
        updateEdge(edge.id, { label: newLabel });
        edge.setLabels([{ attrs: { label: { text: newLabel } } }]);
      }
    });

    // Selection events
    graph.on('select', ({ selected }: { selected: any[] }) => {
      const nodeIds = selected.filter((cell: any) => cell.isNode?.()).map((cell: any) => cell.id);
      setSelectedNodeIds(nodeIds);
    });

    graph.on('unselect', () => {
      setSelectedNodeIds([]);
    });

    // Removed events
    graph.on('node:removed', ({ node }) => {
      removeNode(node.id);
    });

    graph.on('edge:removed', ({ edge }) => {
      removeEdge(edge.id);
    });
  }, [graphRef, edgeCreationMode, edgeCreationSourceId, edgeStyleId]);
}
