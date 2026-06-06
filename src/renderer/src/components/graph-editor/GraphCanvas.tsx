import React, { useEffect, useRef, useCallback } from 'react';
import { Graph } from '@antv/x6';
import { Export } from '@antv/x6-plugin-export';
import { Transform } from '@antv/x6-plugin-transform';
import { message } from 'antd';
import { useGraphStore, EDGE_PRESETS, type AnyNode, type GraphState } from '../../stores/useGraphStore';
import type { GraphEdge } from '../../types';
import { registerFlowShapes } from '../../registerNodes';

let shapesRegistered = false;

function toX6NodeMeta(n: AnyNode) {
  return {
    id: n.id,
    shape: n.shape,
    x: n.x,
    y: n.y,
    width: n.width,
    height: n.height,
    label: n.label ?? '',
    data: n.data,
    attrs: n.attrs,
    ports: n.ports,
  };
}

function toX6EdgeMeta(e: GraphEdge) {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label ?? '',
    data: e.data,
    attrs: e.attrs,
    labels: e.labels,
    router: e.router ?? { name: 'manhattan' },
    connector: e.connector ?? { name: 'rounded' },
  };
}

const GraphCanvas: React.FC = () => {
  const graphRef = useRef<Graph | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suppressSync = useRef(false);

  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const setSelectedEdgeId = useGraphStore((s) => s.setSelectedEdgeId);
  const clearSelection = useGraphStore((s) => s.clearSelection);
  const addEdge = useGraphStore((s) => s.addEdge);
  const removeNode = useGraphStore((s) => s.removeNode);
  const removeEdge = useGraphStore((s) => s.removeEdge);
  const updateNode = useGraphStore((s) => s.updateNode);
  const edgeCreationMode = useGraphStore((s) => s.edgeCreationMode);
  const edgeCreationSourceId = useGraphStore((s) => s.edgeCreationSourceId);
  const enterEdgeCreationMode = useGraphStore((s) => s.enterEdgeCreationMode);
  const exitEdgeCreationMode = useGraphStore((s) => s.exitEdgeCreationMode);

  useEffect(() => {
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
        snap: { radius: 30 },
        createEdge() {
          const state = useGraphStore.getState();
          const preset = EDGE_PRESETS.find((p) => p.id === state.edgeStyleId) ?? EDGE_PRESETS[0];
          const lineAttrs: any = {
            stroke: '#333333',
            strokeWidth: 1.5,
            targetMarker: preset.targetMarker
              ? { name: 'block', width: 8, height: 6 }
              : null,
          };
          if (preset.strokeDasharray) lineAttrs.strokeDasharray = preset.strokeDasharray;
          const edgeRouter = preset.router === 'normal' ? undefined : { name: preset.router };
          const edgeConnector = preset.connector === 'normal' ? undefined : { name: preset.connector };
          return this.createEdge({
            attrs: { line: lineAttrs },
            router: edgeRouter,
            connector: edgeConnector,
            labels: [],
            zIndex: 0,
          });
        },
      },

      selecting: {
        enabled: true,
        rubberband: true,
        showNodeSelectionBox: true,
        modifiers: ['shift'],
      },

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
        size: 20,
        args: { color: '#d0d0d0', thickness: 1 },
      },

      background: { color: '#fafafa' },
    });

    graph.use(new Export());
    graph.use(new Transform({ resizing: { enabled: true }, rotating: { enabled: false } }));
    graphRef.current = graph;

    // ---- Port visibility: show on hover, hide on leave ----
    const showPorts = (ports: NodeListOf<SVGElement>) => {
      ports.forEach((port) => {
        port.setAttribute('visibility', 'visible');
      });
    };
    const hidePorts = (ports: NodeListOf<SVGElement>) => {
      ports.forEach((port) => {
        port.setAttribute('visibility', 'hidden');
      });
    };

    graph.on('node:mouseenter', ({ node }) => {
      const ports = containerRef.current!.querySelectorAll('.x6-port-body');
      showPorts(ports as NodeListOf<SVGElement>);
      // Highlight node in edge creation mode
      const state = useGraphStore.getState();
      if (state.edgeCreationMode) {
        node.addAttr({ body: { stroke: '#1890ff', strokeWidth: 2 } });
      }
    });
    graph.on('node:mouseleave', ({ node }) => {
      const ports = containerRef.current!.querySelectorAll('.x6-port-body');
      hidePorts(ports as NodeListOf<SVGElement>);
      // Remove edge creation highlight
      const state = useGraphStore.getState();
      if (state.edgeCreationMode) {
        node.addAttr({ body: { stroke: '#333333', strokeWidth: 1.5 } });
      }
    });

    // ---- Canvas events ----

    graph.on('node:click', ({ node }) => {
      suppressSync.current = true;
      const state = useGraphStore.getState();
      if (state.edgeCreationMode && state.edgeCreationSourceId) {
        // Create edge from source to this node
        if (node.id !== state.edgeCreationSourceId) {
          const preset = EDGE_PRESETS.find((p) => p.id === state.edgeStyleId) ?? EDGE_PRESETS[0];
          const lineAttrs: any = {
            stroke: '#333333',
            strokeWidth: 1.5,
            targetMarker: preset.targetMarker
              ? { name: 'block', width: 8, height: 6 }
              : null,
          };
          if (preset.strokeDasharray) lineAttrs.strokeDasharray = preset.strokeDasharray;
          const edgeRouter = preset.router === 'normal' ? undefined : { name: preset.router };
          const edgeConnector = preset.connector === 'normal' ? undefined : { name: preset.connector };
          const newEdge = graph.addEdge({
            source: state.edgeCreationSourceId,
            target: node.id,
            attrs: { line: lineAttrs },
            router: edgeRouter,
            connector: edgeConnector,
            labels: [],
            zIndex: 0,
          });
          // Sync to store
          const edgeData = newEdge.toJSON() as unknown as GraphEdge;
          addEdge(edgeData);
        }
        exitEdgeCreationMode();
      } else {
        setSelectedNode(node.toJSON() as unknown as AnyNode);
      }
      suppressSync.current = false;
    });

    graph.on('node:moved', ({ node }) => {
      suppressSync.current = true;
      const { x, y } = node.position();
      const { width, height } = node.size();
      updateNode(node.id, { x, y, width, height });
      suppressSync.current = false;
    });

    graph.on('blank:click', () => {
      suppressSync.current = true;
      clearSelection();
      suppressSync.current = false;
    });

    graph.on('edge:connected', ({ edge }) => {
      suppressSync.current = true;
      addEdge(edge.toJSON() as unknown as GraphEdge);
      suppressSync.current = false;
    });

    graph.on('edge:click', ({ edge }) => {
      suppressSync.current = true;
      setSelectedEdgeId(edge.id);
      suppressSync.current = false;
    });

    graph.on('node:removed', ({ node }) => {
      suppressSync.current = true;
      removeNode(node.id);
      suppressSync.current = false;
    });

    graph.on('edge:removed', ({ edge }) => {
      suppressSync.current = true;
      removeEdge(edge.id);
      suppressSync.current = false;
    });

    return () => {
      graph.dispose();
      graphRef.current = null;
    };
  }, []);

  // ---- Zustand -> X6 incremental sync ----
  const syncStoreToGraph = useCallback(() => {
    const graph = graphRef.current;
    if (!graph || suppressSync.current) return;

    const storeNodes = useGraphStore.getState().nodes;
    const storeEdges = useGraphStore.getState().edges;

    const graphNodeMap = new Map(graph.getNodes().map((n) => [n.id, n]));
    const storeNodeMap = new Map(storeNodes.map((n) => [n.id, n]));

    for (const [id] of graphNodeMap) {
      if (!storeNodeMap.has(id)) {
        suppressSync.current = true;
        graph.removeNode(id);
        suppressSync.current = false;
      }
    }

    for (const node of storeNodes) {
      const existing = graph.getCellById(node.id);
      if (existing) {
        suppressSync.current = true;
        const pos = existing.position();
        const size = existing.size();
        if (pos.x !== node.x || pos.y !== node.y) {
          existing.position(node.x, node.y);
        }
        if (size.width !== node.width || size.height !== node.height) {
          existing.resize(node.width, node.height);
        }
        if (node.label !== undefined) {
          existing.setAttrByPath('label/text', node.label ?? '');
        }
        suppressSync.current = false;
      } else {
        suppressSync.current = true;
        graph.addNode(toX6NodeMeta(node));
        suppressSync.current = false;
      }
    }

    const graphEdgeMap = new Map(graph.getEdges().map((e) => [e.id, e]));
    const storeEdgeMap = new Map(storeEdges.map((e) => [e.id, e]));

    for (const [id] of graphEdgeMap) {
      if (!storeEdgeMap.has(id)) {
        suppressSync.current = true;
        graph.removeEdge(id);
        suppressSync.current = false;
      }
    }

    for (const edge of storeEdges) {
      if (!graphEdgeMap.has(edge.id)) {
        suppressSync.current = true;
        graph.addEdge(toX6EdgeMeta(edge));
        suppressSync.current = false;
      }
    }
  }, []);

  useEffect(() => {
    syncStoreToGraph();
  }, [nodes, edges, syncStoreToGraph]);

  useEffect(() => {
    const el = containerRef.current;
    if (el && graphRef.current) {
      (el as any).__graph__ = graphRef.current;
    }
  }, []);

  // Handle edge style drag-and-drop onto nodes
  useEffect(() => {
    const container = document.getElementById('graph-container');
    if (!container) return;

    const handleDragOver = (e: DragEvent) => {
      const hasEdgeData = e.dataTransfer?.types.includes('application/thesisflow-edge');
      if (hasEdgeData) {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'copy';
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const edgePresetId = e.dataTransfer?.getData('application/thesisflow-edge');
      if (!edgePresetId) return;

      const graph = graphRef.current;
      if (!graph) return;

      // Find which node was dropped on
      const containerRect = container.getBoundingClientRect();
      const point = graph.clientToLocal(e.clientX - containerRect.left, e.clientY - containerRect.top);
      const node = graph.getNodeAt(point);

      if (node) {
        // Set the edge style and enter creation mode
        useGraphStore.getState().setEdgeStyleId(edgePresetId);
        useGraphStore.getState().enterEdgeCreationMode(node.id);
        message.info('请点击目标节点完成连线');
      }
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="graph-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default GraphCanvas;