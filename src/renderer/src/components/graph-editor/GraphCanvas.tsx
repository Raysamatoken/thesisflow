import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Cell } from '@antv/x6';
import { Graph } from '@antv/x6';
import { Export } from '@antv/x6-plugin-export';
import { Transform } from '@antv/x6-plugin-transform';
import { message, Dropdown } from 'antd';
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useGraphStore, EDGE_PRESETS } from '../../stores/useGraphStore';
import type { AnyNode, GraphEdge } from '../../types';
import { registerFlowShapes } from '../../registerNodes';
import type { X6NodeEvent, X6EdgeEvent, X6SelectEvent, X6ScaleEvent } from '../../types/x6-events';
import SearchPanel from './SearchPanel';
import EdgeLabelEditor from './EdgeLabelEditor';
import { endpointId } from '../../utils/common';

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

function createEdgeAttrs(edgeStyleId: string) {
  const preset = EDGE_PRESETS.find(p => p.id === edgeStyleId) ?? EDGE_PRESETS[0];
  const lineAttrs: Record<string, unknown> = {
    stroke: '#333333',
    strokeWidth: 1.5,
    targetMarker: preset.targetMarker ? { name: 'block', width: 8, height: 6 } : null,
  };
  if (preset.strokeDasharray) lineAttrs.strokeDasharray = preset.strokeDasharray;
  return {
    lineAttrs,
    edgeRouter: preset.router === 'normal' ? undefined : { name: preset.router },
    edgeConnector: preset.connector === 'normal' ? undefined : { name: preset.connector },
  };
}

const GraphCanvas: React.FC = () => {
  const [graphInstance, setGraphInstance] = useState<Graph | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const syncVersion = useRef(0);
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    type: 'node' | 'edge' | 'canvas';
    id: string;
  } | null>(null);

  const nodes = useGraphStore(s => s.nodes);
  const edges = useGraphStore(s => s.edges);
  const edgeStyleId = useGraphStore(s => s.edgeStyleId);
  const setSelectedNode = useGraphStore(s => s.setSelectedNode);
  const setSelectedNodeIds = useGraphStore(s => s.setSelectedNodeIds);
  const setSelectedEdgeId = useGraphStore(s => s.setSelectedEdgeId);
  const clearSelection = useGraphStore(s => s.clearSelection);
  const removeNode = useGraphStore(s => s.removeNode);
  const removeEdge = useGraphStore(s => s.removeEdge);
  const addEdge = useGraphStore(s => s.addEdge);
  const updateNode = useGraphStore(s => s.updateNode);
  const edgeCreationMode = useGraphStore(s => s.edgeCreationMode);
  const edgeCreationSourceId = useGraphStore(s => s.edgeCreationSourceId);
  const exitEdgeCreationMode = useGraphStore(s => s.exitEdgeCreationMode);

  // Context menu handlers
  const handleNodeContextMenu = ({ node, e }: X6NodeEvent) => {
    e.preventDefault();
    setSelectedNode(node.toJSON() as unknown as AnyNode);
    const rect = containerRef.current!.getBoundingClientRect();
    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      type: 'node',
      id: node.id,
    });
  };

  const handleEdgeContextMenu = ({ edge, e }: X6EdgeEvent) => {
    e.preventDefault();
    setSelectedEdgeId(edge.id);
    const rect = containerRef.current!.getBoundingClientRect();
    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      type: 'edge',
      id: edge.id,
    });
  };

  const handleBlankContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    clearSelection();
    const rect = containerRef.current!.getBoundingClientRect();
    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, type: 'canvas', id: '' });
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    if (!contextMenu) return;
    const { type, id } = contextMenu;
    switch (key) {
      case 'copy':
        if (type === 'node') {
          const node = nodes.find(n => n.id === id);
          if (node) {
            const connectedEdges = edges.filter(
              edge => endpointId(edge.source) === id || endpointId(edge.target) === id
            );
            navigator.clipboard
              .writeText(JSON.stringify({ nodes: [node], edges: connectedEdges }))
              .catch(() => {});
            message.success('已复制节点');
          }
        } else if (type === 'edge') {
          const edge = edges.find(e => e.id === id);
          if (edge) {
            navigator.clipboard
              .writeText(JSON.stringify({ nodes: [], edges: [edge] }))
              .catch(() => {});
            message.success('已复制连线');
          }
        }
        break;
      case 'delete':
        if (type === 'node') removeNode(id);
        else if (type === 'edge') removeEdge(id);
        break;
    }
    setContextMenu(null);
  };

  const nodeContextMenuItems = [
    { key: 'copy', label: '复制', icon: <CopyOutlined /> },
    { type: 'divider' as const },
    { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true },
  ];

  const edgeContextMenuItems = [
    { key: 'copy', label: '复制', icon: <CopyOutlined /> },
    { key: 'editLabel', label: '编辑标签', icon: <EditOutlined /> },
    { type: 'divider' as const },
    { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true },
  ];

  const canvasContextMenuItems = [
    { key: 'paste', label: '粘贴', icon: <EditOutlined />, disabled: true },
  ];

  useEffect(() => {
    registerFlowShapes();

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
          const { lineAttrs, edgeRouter, edgeConnector } = createEdgeAttrs(edgeStyleId);
          return this.createEdge({
            attrs: { line: lineAttrs },
            router: edgeRouter,
            connector: edgeConnector,
            labels: [],
            zIndex: 0,
          });
        },
      },
      // @ts-expect-error - selecting is valid but not typed in X6 2.x
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
      grid: { visible: true, type: 'dot', size: 10, args: { color: '#e0e0e0', thickness: 1 } },
      snapline: { enabled: true, clean: 5, filter: (cell: Cell) => cell.isNode?.() },
      background: { color: '#fafafa' },
    });

    graph.use(new Export());
    graph.use(new Transform({ resizing: { enabled: true }, rotating: { enabled: false } }));
    setGraphInstance(graph);

    const showPorts = (ports: NodeListOf<SVGElement>) =>
      ports.forEach(p => p.setAttribute('visibility', 'visible'));
    const hidePorts = (ports: NodeListOf<SVGElement>) =>
      ports.forEach(p => p.setAttribute('visibility', 'hidden'));

    graph.on('node:mouseenter', ({ node }: X6NodeEvent) => {
      showPorts(containerRef.current!.querySelectorAll('.x6-port-body'));
      if (edgeCreationMode) node.setAttrs({ body: { stroke: '#1890ff', strokeWidth: 2 } });
    });
    graph.on('node:mouseleave', ({ node }: X6NodeEvent) => {
      hidePorts(containerRef.current!.querySelectorAll('.x6-port-body'));
      if (edgeCreationMode) node.setAttrs({ body: { stroke: '#333333', strokeWidth: 1.5 } });
    });

    graph.on('node:click', ({ node }: X6NodeEvent) => {
      syncVersion.current++;
      if (edgeCreationMode && edgeCreationSourceId && node.id !== edgeCreationSourceId) {
        const { lineAttrs, edgeRouter, edgeConnector } = createEdgeAttrs(edgeStyleId);
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
        exitEdgeCreationMode();
      } else {
        setSelectedNode(node.toJSON() as unknown as AnyNode);
      }
    });

    graph.on('node:moved', ({ node }) => {
      syncVersion.current++;
      const { x, y } = node.position();
      const { width, height } = node.size();
      updateNode(node.id, { x, y, width, height });
    });

    graph.on('blank:click', () => {
      syncVersion.current++;
      clearSelection();
    });

    graph.on('edge:connected', ({ edge }) => {
      syncVersion.current++;
      addEdge(edge.toJSON() as unknown as GraphEdge);
    });

    graph.on('node:contextmenu', handleNodeContextMenu);
    graph.on('edge:contextmenu', handleEdgeContextMenu);
    graph.on('blank:contextmenu', handleBlankContextMenu);

    graph.on('select', ({ selected }: X6SelectEvent) => {
      const nodeIds = selected.filter((cell: Cell) => cell.isNode?.()).map((cell: Cell) => cell.id);
      setSelectedNodeIds(nodeIds);
    });
    graph.on('unselect', () => setSelectedNodeIds([]));

    graph.on('edge:click', ({ edge }: X6EdgeEvent) => {
      syncVersion.current++;
      setSelectedEdgeId(edge.id);
    });

    graph.on('edge:dblclick', ({ edge }: X6EdgeEvent) => {
      const currentLabels = edge.getLabels();
      const currentLabel =
        currentLabels.length > 0
          ? ((currentLabels[0] as { attrs?: { label?: { text?: string } } }).attrs?.label?.text ??
            '')
          : '';
      window.dispatchEvent(
        new CustomEvent('thesisflow:edit-edge-label', {
          detail: {
            edgeId: edge.id,
            currentLabel: typeof currentLabel === 'string' ? currentLabel : '',
          },
        })
      );
    });

    const savedZoom = localStorage.getItem('thesisflow-zoom');
    if (savedZoom) {
      const zoom = parseFloat(savedZoom);
      if (!isNaN(zoom) && zoom >= 0.25 && zoom <= 3) graph.zoom(zoom);
    }
    graph.on('scale', ({ sx }: X6ScaleEvent) =>
      localStorage.setItem('thesisflow-zoom', String(sx))
    );

    graph.on('node:removed', () => {
      syncVersion.current++;
    });
    graph.on('edge:removed', () => {
      syncVersion.current++;
    });

    return () => {
      graph.dispose();
      setGraphInstance(null);
    };
  }, []);

  // Zustand -> X6 incremental sync
  const syncStoreToGraph = useCallback(() => {
    const graph = graphInstance;
    if (!graph) return;
    const currentVersion = ++syncVersion.current;
    const storeNodes = useGraphStore.getState().nodes;
    const storeEdges = useGraphStore.getState().edges;
    const graphNodeMap = new Map(graph.getNodes().map(n => [n.id, n]));
    const storeNodeMap = new Map(storeNodes.map(n => [n.id, n]));

    for (const [id] of graphNodeMap) {
      if (!storeNodeMap.has(id)) graph.removeNode(id);
    }
    if (currentVersion !== syncVersion.current) return;

    for (const node of storeNodes) {
      const existing = graph.getCellById(node.id);
      if (existing && existing.isNode()) {
        const pos = existing.position();
        const size = existing.size();
        if (pos.x !== node.x || pos.y !== node.y) existing.position(node.x, node.y);
        if (size.width !== node.width || size.height !== node.height)
          existing.resize(node.width, node.height);
        if (node.label !== undefined) existing.setAttrByPath('label/text', node.label ?? '');
      } else {
        graph.addNode(toX6NodeMeta(node));
      }
    }
    if (currentVersion !== syncVersion.current) return;

    const graphEdgeMap = new Map(graph.getEdges().map(e => [e.id, e]));
    for (const [id] of graphEdgeMap) {
      if (!storeEdges.find(e => e.id === id)) graph.removeEdge(id);
    }
    if (currentVersion !== syncVersion.current) return;

    for (const edge of storeEdges) {
      if (!graphEdgeMap.has(edge.id)) graph.addEdge(toX6EdgeMeta(edge));
    }
  }, []);

  useEffect(() => {
    syncStoreToGraph();
  }, [nodes, edges, syncStoreToGraph, graphInstance]);

  useEffect(() => {
    const el = containerRef.current;
    if (el && graphInstance) (el as any).__graph__ = graphInstance;
  }, [graphInstance]);

  // Edge style drag-and-drop
  useEffect(() => {
    const container = document.getElementById('graph-container');
    if (!container) return;
    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('application/thesisflow-edge')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const edgePresetId = e.dataTransfer?.getData('application/thesisflow-edge');
      if (!edgePresetId) return;
      const graph = graphInstance;
      if (!graph) return;
      const rect = container.getBoundingClientRect();
      const point = graph.clientToLocal(e.clientX - rect.left, e.clientY - rect.top);
      const cell = graph
        .getCells()
        .find((c: Cell) => c.isNode?.() && c.getBBox().containsPoint(point));
      if (cell) {
        useGraphStore.getState().setEdgeStyleId(edgePresetId);
        useGraphStore.getState().enterEdgeCreationMode(cell.id);
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
    <>
      <div ref={containerRef} id="graph-container" style={{ width: '100%', height: '100%' }} />
      {contextMenu && contextMenu.type === 'node' && (
        <Dropdown
          menu={{ items: nodeContextMenuItems, onClick: handleMenuClick }}
          open={true}
          onOpenChange={open => !open && setContextMenu(null)}
          placement="bottomLeft"
          overlayStyle={{ zIndex: 1000 }}
          getPopupContainer={() => containerRef.current!}
        >
          <div
            style={{
              position: 'absolute',
              left: contextMenu.x,
              top: contextMenu.y,
              width: 0,
              height: 0,
              pointerEvents: 'none',
            }}
          />
        </Dropdown>
      )}
      {contextMenu && contextMenu.type === 'edge' && (
        <Dropdown
          menu={{
            items: edgeContextMenuItems,
            onClick: ({ key }) => {
              if (key === 'editLabel') {
                const edge = edges.find(e => e.id === contextMenu.id);
                window.dispatchEvent(
                  new CustomEvent('thesisflow:edit-edge-label', {
                    detail: { edgeId: contextMenu.id, currentLabel: edge?.label ?? '' },
                  })
                );
              } else {
                handleMenuClick({ key });
              }
            },
          }}
          open={true}
          onOpenChange={open => !open && setContextMenu(null)}
          placement="bottomLeft"
          overlayStyle={{ zIndex: 1000 }}
          getPopupContainer={() => containerRef.current!}
        >
          <div
            style={{
              position: 'absolute',
              left: contextMenu.x,
              top: contextMenu.y,
              width: 0,
              height: 0,
              pointerEvents: 'none',
            }}
          />
        </Dropdown>
      )}
      {contextMenu && contextMenu.type === 'canvas' && (
        <Dropdown
          menu={{ items: canvasContextMenuItems, onClick: handleMenuClick }}
          open={true}
          onOpenChange={open => !open && setContextMenu(null)}
          placement="bottomLeft"
          overlayStyle={{ zIndex: 1000 }}
          getPopupContainer={() => containerRef.current!}
        >
          <div
            style={{
              position: 'absolute',
              left: contextMenu.x,
              top: contextMenu.y,
              width: 0,
              height: 0,
              pointerEvents: 'none',
            }}
          />
        </Dropdown>
      )}
      <SearchPanel graph={graphInstance} />
      <EdgeLabelEditor graph={graphInstance} />
    </>
  );
};

export default GraphCanvas;
