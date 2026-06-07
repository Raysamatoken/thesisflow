import React, { useEffect, useRef, useCallback } from 'react';
import { Graph } from '@antv/x6';
import { Export } from '@antv/x6-plugin-export';
import { Transform } from '@antv/x6-plugin-transform';
import { message } from 'antd';
import { useGraphStore, EDGE_PRESETS } from '../../stores/useGraphStore';
import { AnyNode, GraphEdge } from '../../types';
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
  const syncVersion = useRef(0);

  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const edgeStyleId = useGraphStore((s) => s.edgeStyleId);
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
        snap: { radius: 20 },
        createEdge() {
          const preset = EDGE_PRESETS.find((p) => p.id === edgeStyleId) ?? EDGE_PRESETS[0];
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

      // selecting config - using type assertion for X6 2.x compatibility
      // @ts-expect-error - selecting is a valid X6 option but not in types
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

      // Improved grid for finer snapping
      grid: {
        visible: true,
        type: 'dot',
        size: 10, // Reduced from 20 to 10 for finer control
        args: { color: '#e0e0e0', thickness: 1 },
      },

      // Enable snaplines for alignment guides between nodes
      snapline: {
        enabled: true,
        clean: 5, // Distance to trigger snapline
        filter: (cell: any) => cell.isNode?.(),
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
      if (edgeCreationMode) {
        node.setAttrs({ body: { stroke: '#1890ff', strokeWidth: 2 } });
      }
    });
    graph.on('node:mouseleave', ({ node }) => {
      const ports = containerRef.current!.querySelectorAll('.x6-port-body');
      hidePorts(ports as NodeListOf<SVGElement>);
      // Remove edge creation highlight
      if (edgeCreationMode) {
        node.setAttrs({ body: { stroke: '#333333', strokeWidth: 1.5 } });
      }
    });

    // ---- Canvas events ----

    graph.on('node:click', ({ node }) => {
      const currentVersion = ++syncVersion.current;
      if (edgeCreationMode && edgeCreationSourceId) {
        // Create edge from source to this node
        if (node.id !== edgeCreationSourceId) {
          const preset = EDGE_PRESETS.find((p) => p.id === edgeStyleId) ?? EDGE_PRESETS[0];
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
            source: edgeCreationSourceId,
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
      // Version check not strictly needed here since we don't await, but kept for consistency
      if (currentVersion !== syncVersion.current) return;
    });

    graph.on('node:moved', ({ node }) => {
      const currentVersion = ++syncVersion.current;
      const { x, y } = node.position();
      const { width, height } = node.size();
      updateNode(node.id, { x, y, width, height });
      if (currentVersion !== syncVersion.current) return;
    });

    graph.on('blank:click', () => {
      const currentVersion = ++syncVersion.current;
      clearSelection();
      if (currentVersion !== syncVersion.current) return;
    });

    graph.on('edge:connected', ({ edge }) => {
      const currentVersion = ++syncVersion.current;
      addEdge(edge.toJSON() as unknown as GraphEdge);
      if (currentVersion !== syncVersion.current) return;
    });

    graph.on('edge:click', ({ edge }) => {
      const currentVersion = ++syncVersion.current;
      setSelectedEdgeId(edge.id);
      if (currentVersion !== syncVersion.current) return;
    });

    graph.on('node:removed', ({ node }) => {
      const currentVersion = ++syncVersion.current;
      removeNode(node.id);
      if (currentVersion !== syncVersion.current) return;
    });

    graph.on('edge:removed', ({ edge }) => {
      const currentVersion = ++syncVersion.current;
      removeEdge(edge.id);
      if (currentVersion !== syncVersion.current) return;
    });

    return () => {
      graph.dispose();
      graphRef.current = null;
    };
  }, []);

  // ---- Zustand -> X6 incremental sync ----
  const syncStoreToGraph = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;

    const currentVersion = ++syncVersion.current;
    const storeNodes = useGraphStore.getState().nodes;
    const storeEdges = useGraphStore.getState().edges;

    const graphNodeMap = new Map(graph.getNodes().map((n) => [n.id, n]));
    const storeNodeMap = new Map(storeNodes.map((n) => [n.id, n]));

    for (const [id] of graphNodeMap) {
      if (!storeNodeMap.has(id)) {
        graph.removeNode(id);
      }
    }
    if (currentVersion !== syncVersion.current) return;

    for (const node of storeNodes) {
      const existing = graph.getCellById(node.id);
      if (existing && existing.isNode()) {
        const nodeCell = existing as any; // Node type
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
        graph.addNode(toX6NodeMeta(node));
      }
    }
    if (currentVersion !== syncVersion.current) return;

    const graphEdgeMap = new Map(graph.getEdges().map((e) => [e.id, e]));
    const storeEdgeMap = new Map(storeEdges.map((e) => [e.id, e]));

    for (const [id] of graphEdgeMap) {
      if (!storeEdgeMap.has(id)) {
        graph.removeEdge(id);
      }
    }
    if (currentVersion !== syncVersion.current) return;

    for (const edge of storeEdges) {
      if (!graphEdgeMap.has(edge.id)) {
        graph.addEdge(toX6EdgeMeta(edge));
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

    const setEdgeStyleId = useGraphStore.getState().setEdgeStyleId;
    const enterEdgeCreationMode = useGraphStore.getState().enterEdgeCreationMode;

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
      const cells = graph.getCells();
      const node = cells.find((c: any) => c.isNode?.() && c.getBBox().containsPoint(point)) as any;

      if (node) {
        // Set the edge style and enter creation mode
        setEdgeStyleId(edgePresetId);
        enterEdgeCreationMode(node.id);
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