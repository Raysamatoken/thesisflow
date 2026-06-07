import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Graph } from '@antv/x6';
import { Export } from '@antv/x6-plugin-export';
import { Transform } from '@antv/x6-plugin-transform';
import { message, Dropdown, Input } from 'antd';
import { CopyOutlined, DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { useGraphStore, EDGE_PRESETS } from '../../stores/useGraphStore';
import type { AnyNode, GraphEdge } from '../../types';
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
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'node' | 'edge' | 'canvas';
    id: string;
  } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AnyNode[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

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

  // Context menu handlers
  const handleNodeContextMenu = ({ node, e }: { node: any; e: any }) => {
    e.preventDefault();
    // Select the node on right-click
    setSelectedNode(node.toJSON());
    const containerRect = containerRef.current!.getBoundingClientRect();
    setContextMenu({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
      type: 'node',
      id: node.id,
    });
  };

  const handleEdgeContextMenu = ({ edge, e }: { edge: any; e: any }) => {
    e.preventDefault();
    setSelectedEdgeId(edge.id);
    const containerRect = containerRef.current!.getBoundingClientRect();
    setContextMenu({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
      type: 'edge',
      id: edge.id,
    });
  };

  const handleBlankContextMenu = (e: any) => {
    e.preventDefault();
    clearSelection();
    const containerRect = containerRef.current!.getBoundingClientRect();
    setContextMenu({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
      type: 'canvas',
      id: '',
    });
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
              edge =>
                (typeof edge.source === 'string' ? edge.source : edge.source.cell) === id ||
                (typeof edge.target === 'string' ? edge.target : edge.target.cell) === id
            );
            // Store in clipboard via ToolBar's mechanism - we'll use a simple approach
            const data = JSON.stringify({ nodes: [node], edges: connectedEdges });
            navigator.clipboard.writeText(data).catch(() => {});
            message.success('已复制节点');
          }
        } else if (type === 'edge') {
          const edge = edges.find(e => e.id === id);
          if (edge) {
            const data = JSON.stringify({ nodes: [], edges: [edge] });
            navigator.clipboard.writeText(data).catch(() => {});
            message.success('已复制连线');
          }
        }
        break;
      case 'delete':
        if (type === 'node') removeNode(id);
        else if (type === 'edge') removeEdge(id);
        break;
      case 'paste':
        // Paste is handled globally via ToolBar
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
    { type: 'divider' as const },
    { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true },
  ];

  const canvasContextMenuItems = [
    { key: 'paste', label: '粘贴', icon: <EditOutlined />, disabled: true }, // Global paste
  ];
  const updateNode = useGraphStore(s => s.updateNode);
  const edgeCreationMode = useGraphStore(s => s.edgeCreationMode);
  const edgeCreationSourceId = useGraphStore(s => s.edgeCreationSourceId);
  const exitEdgeCreationMode = useGraphStore(s => s.exitEdgeCreationMode);

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
          const preset = EDGE_PRESETS.find(p => p.id === edgeStyleId) ?? EDGE_PRESETS[0];
          const lineAttrs: any = {
            stroke: '#333333',
            strokeWidth: 1.5,
            targetMarker: preset.targetMarker ? { name: 'block', width: 8, height: 6 } : null,
          };
          if (preset.strokeDasharray) lineAttrs.strokeDasharray = preset.strokeDasharray;
          const edgeRouter = preset.router === 'normal' ? undefined : { name: preset.router };
          const edgeConnector =
            preset.connector === 'normal' ? undefined : { name: preset.connector };
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
      ports.forEach(port => {
        port.setAttribute('visibility', 'visible');
      });
    };
    const hidePorts = (ports: NodeListOf<SVGElement>) => {
      ports.forEach(port => {
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
          const preset = EDGE_PRESETS.find(p => p.id === edgeStyleId) ?? EDGE_PRESETS[0];
          const lineAttrs: any = {
            stroke: '#333333',
            strokeWidth: 1.5,
            targetMarker: preset.targetMarker ? { name: 'block', width: 8, height: 6 } : null,
          };
          if (preset.strokeDasharray) lineAttrs.strokeDasharray = preset.strokeDasharray;
          const edgeRouter = preset.router === 'normal' ? undefined : { name: preset.router };
          const edgeConnector =
            preset.connector === 'normal' ? undefined : { name: preset.connector };
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

    // Context menu events
    graph.on('node:contextmenu', handleNodeContextMenu);
    graph.on('edge:contextmenu', handleEdgeContextMenu);
    graph.on('blank:contextmenu', handleBlankContextMenu);

    // Selection events for multi-select alignment
    graph.on('select', ({ selected }: { selected: any[] }) => {
      const nodeIds = selected.filter((cell: any) => cell.isNode?.()).map((cell: any) => cell.id);
      setSelectedNodeIds(nodeIds);
    });

    graph.on('unselect', () => {
      setSelectedNodeIds([]);
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

  // Global search (Ctrl+F) handler
  useEffect(() => {
    const handleOpenSearch = () => {
      setSearchOpen(true);
      setSearchQuery('');
      setSearchResults(nodes);
      setSelectedResultIndex(0);
    };

    window.addEventListener('thesisflow:open-search', handleOpenSearch);
    return () => window.removeEventListener('thesisflow:open-search', handleOpenSearch);
  }, [nodes]);

  // Search filter effect
  useEffect(() => {
    if (!searchOpen) return;
    const timer = requestAnimationFrame(() => {
      const results = nodes.filter(
        node =>
          node.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.data?.remark?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setSelectedResultIndex(0);
    });
    return () => cancelAnimationFrame(timer);
  }, [searchQuery, searchOpen, nodes]);

  // Handle search result selection
  const handleSelectResult = (node: AnyNode) => {
    const graph = graphRef.current;
    if (!graph) return;
    const cell = graph.getCellById(node.id);
    if (cell) {
      graph.centerCell(cell);
      setSelectedNode(node);
      setSearchOpen(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIndex(i => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedResultIndex]) {
        handleSelectResult(searchResults[selectedResultIndex]);
      }
    }
  };

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
      const point = graph.clientToLocal(
        e.clientX - containerRect.left,
        e.clientY - containerRect.top
      );
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
          menu={{ items: edgeContextMenuItems, onClick: handleMenuClick }}
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
      {searchOpen && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: '#fff',
            border: '1px solid #e8e8e8',
            borderRadius: 8,
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            padding: '12px 16px',
            minWidth: 360,
            maxWidth: 500,
          }}
          onKeyDown={handleSearchKeyDown}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <SearchOutlined style={{ color: '#aaa' }} />
            <Input
              placeholder="搜索节点 (标签/备注)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{ width: 280 }}
              size="middle"
            />
            <span style={{ fontSize: 12, color: '#888' }}>{searchResults.length} 个结果</span>
          </div>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {searchResults.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#aaa' }}>
                未找到匹配的节点
              </div>
            ) : (
              searchResults.map((node, index) => (
                <div
                  key={node.id}
                  onClick={() => handleSelectResult(node)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: index === selectedResultIndex ? '#e6f4ff' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderBottom: index < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#333', flex: 1 }}>
                    {node.label || '(无标签)'}
                  </span>
                  {node.data?.remark && (
                    <span
                      style={{
                        fontSize: 11,
                        color: '#888',
                        maxWidth: 200,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {node.data.remark}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GraphCanvas;
