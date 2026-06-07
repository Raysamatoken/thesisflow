import React, { useEffect, useState } from 'react';
import { Button, Space, Typography, Tooltip, Divider, message, Dropdown } from 'antd';
import {
  FileAddOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  SortAscendingOutlined,
  DownloadOutlined,
  FileImageOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  UndoOutlined,
  RedoOutlined,
  CopyOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useGraphStore } from '../../stores/useGraphStore';
import { FlowNodeShape } from '../../types';
import type { FlowNode, AnyNode, GraphEdge } from '../../types';
import { getGraph } from '../../utils/getGraph';
import { runAutoLayout } from '../../utils/autoLayout';

const { Text } = Typography;

function getDefaultStartNode(): FlowNode {
  return {
    id: `node-${Date.now()}`,
    shape: FlowNodeShape.Terminal,
    x: 300,
    y: 120,
    width: 120,
    height: 50,
    label: '开始',
    data: {
      shape: FlowNodeShape.Terminal,
      color: '#ffffff',
      borderColor: '#333333',
      fontColor: '#333333',
      fontSize: 12,
      remark: '',
    },
  };
}

const ToolBar: React.FC = () => {
  const projectName = useGraphStore(s => s.projectName);
  const dirty = useGraphStore(s => s.dirty);
  const currentFilePath = useGraphStore(s => s.currentFilePath);
  const nodeCount = useGraphStore(s => s.nodes.length);

  const clearGraph = useGraphStore(s => s.clearGraph);
  const addNode = useGraphStore(s => s.addNode);
  const setProjectName = useGraphStore(s => s.setProjectName);
  const loadProject = useGraphStore(s => s.loadProject);
  const buildProjectFile = useGraphStore(s => s.buildProjectFile);
  const setCurrentFilePath = useGraphStore(s => s.setCurrentFilePath);
  const markClean = useGraphStore(s => s.markClean);
  const undo = useGraphStore(s => s.undo);
  const redo = useGraphStore(s => s.redo);
  const canUndo = useGraphStore(s => s.canUndo);
  const canRedo = useGraphStore(s => s.canRedo);
  const nodes = useGraphStore(s => s.nodes);
  const edges = useGraphStore(s => s.edges);
  const selectedNode = useGraphStore(s => s.selectedNode);
  const selectedEdgeId = useGraphStore(s => s.selectedEdgeId);
  const copyNode = useGraphStore(s => s.addNode);
  const addEdge = useGraphStore(s => s.addEdge);
  const removeNode = useGraphStore(s => s.removeNode);
  const removeEdge = useGraphStore(s => s.removeEdge);

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = React.useState<{ nodes: AnyNode[]; edges: GraphEdge[] } | null>(
    null
  );
  const [recentFiles, setRecentFiles] = useState<string[]>([]);

  // 新建项目：在渲染进程内直接完成，不依赖 IPC
  const handleNew = () => {
    clearGraph();
    setProjectName('未命名项目');
    const startNode = getDefaultStartNode();
    addNode(startNode);
    markClean();
    message.success('已创建新项目');
  };

  const handleOpen = async () => {
    const api = window.thesisFlow;
    if (!api) {
      message.warning('请在 Electron 环境中运行');
      return;
    }
    try {
      const project = await api.openProject();
      if (!project) return;
      loadProject(project);
      message.success(`已打开「${project.name}」`);
    } catch {
      message.error('打开项目失败');
    }
  };

  const handleSave = async () => {
    const api = window.thesisFlow;
    if (!api) {
      message.warning('请在 Electron 环境中运行');
      return;
    }
    try {
      const projectFile = buildProjectFile();
      const savedPath = await api.saveProject(projectFile, currentFilePath ?? undefined);
      if (savedPath) {
        setCurrentFilePath(savedPath);
        markClean();
        message.success('项目已保存');
      }
    } catch {
      message.error('保存项目失败');
    }
  };

  // Load recent files on mount
  useEffect(() => {
    const api = window.thesisFlow;
    if (api?.getRecentFiles) {
      api.getRecentFiles().then(setRecentFiles);
    }
  }, []);

  // Auto-save listener
  useEffect(() => {
    const api = window.thesisFlow;
    if (api?.onAutoSave) {
      const cleanup = api.onAutoSave(() => {
        if (dirty && currentFilePath) {
          void handleSave();
        }
      });
      return cleanup;
    }
  }, [dirty, currentFilePath, handleSave]);

  const handleAutoLayout = async () => {
    if (nodeCount === 0) {
      message.warning('画布为空，请先添加节点');
      return;
    }
    await runAutoLayout({ rankdir: 'TB', nodesep: 60, ranksep: 80 });
    message.success('排版完成');
  };

  const handleExport = async (format: 'png' | 'svg') => {
    const api = window.thesisFlow;
    if (!api) {
      message.warning('请在 Electron 环境中运行');
      return;
    }
    const graph = getGraph();
    if (!graph) {
      message.error('画布未初始化');
      return;
    }
    if (nodeCount === 0) {
      message.warning('画布为空，请先添加节点');
      return;
    }
    try {
      let dataUrl: string;
      if (format === 'png') {
        dataUrl = await (graph.exportPNG({
          backgroundColor: '#ffffff',
          padding: 20,
          quality: 1,
          ratio: 2,
        } as any) as unknown as Promise<string>);
      } else {
        dataUrl = await (graph.exportSVG({
          backgroundColor: '#ffffff',
          padding: 20,
          ratio: 2,
        } as any) as unknown as Promise<string>);
      }
      const ok = await api.exportImage(dataUrl, format);
      if (ok) {
        message.success(`已导出 ${format.toUpperCase()} 文件`);
      }
    } catch {
      message.error('导出失败');
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    const graph = getGraph();
    if (graph) {
      graph.zoom(1.2);
    }
  };

  const handleZoomOut = () => {
    const graph = getGraph();
    if (graph) {
      graph.zoom(0.8);
    }
  };

  const handleZoomReset = () => {
    const graph = getGraph();
    if (graph) {
      graph.zoom(1);
    }
  };

  const handleZoomFit = () => {
    const graph = getGraph();
    if (graph && nodeCount > 0) {
      graph.zoomToFit({ padding: 40 });
    }
  };

  // Undo/Redo
  const handleUndo = () => {
    if (canUndo()) {
      undo();
      message.success('已撤销');
    }
  };

  const handleRedo = () => {
    if (canRedo()) {
      redo();
      message.success('已重做');
    }
  };

  // Copy/Paste
  const handleCopy = () => {
    if (selectedNode) {
      // Copy selected node
      const nodeToCopy = selectedNode;
      const connectedEdges = edges.filter(
        e => endpointId(e.source) === nodeToCopy.id || endpointId(e.target) === nodeToCopy.id
      );
      setClipboard({ nodes: [nodeToCopy], edges: connectedEdges });
      message.success('已复制节点');
    } else if (selectedEdgeId) {
      const edgeToCopy = edges.find(e => e.id === selectedEdgeId);
      if (edgeToCopy) {
        setClipboard({ nodes: [], edges: [edgeToCopy] });
        message.success('已复制连线');
      }
    }
  };

  const handlePaste = () => {
    if (!clipboard) return;

    const offset = 20;
    const newNodes: AnyNode[] = clipboard.nodes.map(node => ({
      ...node,
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: node.x + offset,
      y: node.y + offset,
    }));

    const nodeIdMap = new Map<string, string>();
    newNodes.forEach((newNode, i) => {
      nodeIdMap.set(clipboard.nodes[i].id, newNode.id);
    });

    const newEdges: GraphEdge[] = clipboard.edges.map((edge, i) => ({
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

    newNodes.forEach(node => copyNode(node));
    newEdges.forEach(edge => addEdge(edge));

    message.success('已粘贴');
  };

  function endpointId(ep: GraphEdge['source']): string {
    return typeof ep === 'string' ? ep : ep.cell;
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      if (isCtrl && e.key === 'z' && !isShift) {
        e.preventDefault();
        handleUndo();
      } else if (isCtrl && e.key === 'z' && isShift) {
        e.preventDefault();
        handleRedo();
      } else if (isCtrl && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (isCtrl && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      } else if (isCtrl && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) {
          e.preventDefault();
          removeNode(selectedNode.id);
        } else if (selectedEdgeId) {
          e.preventDefault();
          removeEdge(selectedEdgeId);
        }
      } else if (isCtrl && e.key === '0') {
        e.preventDefault();
        handleZoomReset();
      } else if (isCtrl && e.key === '9') {
        e.preventDefault();
        handleZoomFit();
      } else if ((isCtrl && e.key === '=') || (isCtrl && e.key === '+')) {
        e.preventDefault();
        handleZoomIn();
      } else if (isCtrl && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (isCtrl && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (isCtrl && e.key === 'n') {
        e.preventDefault();
        handleNew();
      } else if (isCtrl && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      } else if (isCtrl && e.key === 'f') {
        e.preventDefault();
        // Open search in GraphCanvas via custom event
        window.dispatchEvent(new CustomEvent('thesisflow:open-search'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, selectedNode, selectedEdgeId, clipboard, nodes, edges]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
        padding: '0 16px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text strong style={{ fontSize: 14 }}>
          {projectName}
        </Text>
        {dirty && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            (未保存)
          </Text>
        )}
      </div>

      <Space size={4} split={<Divider type="vertical" />}>
        <Space size={4}>
          <Tooltip title="新建项目 (Ctrl+N)">
            <Button size="small" icon={<FileAddOutlined />} onClick={handleNew}>
              新建
            </Button>
          </Tooltip>
          <Tooltip title="打开项目文件 (Ctrl+O)">
            <Button size="small" icon={<FolderOpenOutlined />} onClick={handleOpen}>
              打开
            </Button>
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                ...recentFiles.map((file, index) => ({
                  key: `recent-${index}`,
                  label: file.split(/[\\/]/).pop() || file,
                  title: file,
                  onClick: async () => {
                    const api = window.thesisFlow;
                    if (api) {
                      // We need to open the specific file - for now just show message
                      message.info(`打开: ${file}`);
                    }
                  },
                })),
                { type: 'divider' as const },
                {
                  key: 'clear-recent',
                  label: '清空最近文件',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: async () => {
                    const api = window.thesisFlow;
                    if (api?.clearRecentFiles) {
                      await api.clearRecentFiles();
                      setRecentFiles([]);
                      message.success('已清空最近文件');
                    }
                  },
                },
              ],
            }}
            trigger={['click']}
            placement="bottomLeft"
          >
            <Tooltip title="最近文件">
              <Button size="small" icon={<ClockCircleOutlined />}>
                最近
              </Button>
            </Tooltip>
          </Dropdown>
          <Tooltip title={currentFilePath ? '保存到当前路径 (Ctrl+S)' : '另存为… (Ctrl+S)'}>
            <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存
            </Button>
          </Tooltip>
        </Space>
        <Space size={4}>
          <Tooltip title="撤销 (Ctrl+Z)">
            <Button size="small" icon={<UndoOutlined />} onClick={handleUndo} disabled={!canUndo()}>
              撤销
            </Button>
          </Tooltip>
          <Tooltip title="重做 (Ctrl+Y / Ctrl+Shift+Z)">
            <Button size="small" icon={<RedoOutlined />} onClick={handleRedo} disabled={!canRedo()}>
              重做
            </Button>
          </Tooltip>
          <Tooltip title="复制 (Ctrl+C)">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={!selectedNode && !selectedEdgeId}
            >
              复制
            </Button>
          </Tooltip>
          <Tooltip title="粘贴 (Ctrl+V)">
            <Button size="small" onClick={handlePaste} disabled={!clipboard}>
              粘贴
            </Button>
          </Tooltip>
        </Space>
        <Space size={4}>
          <Tooltip title="使用 Dagre 算法自动排版（上→下）">
            <Button size="small" icon={<SortAscendingOutlined />} onClick={handleAutoLayout}>
              自动排版
            </Button>
          </Tooltip>
        </Space>
        <Space size={4}>
          <Tooltip title="导出为高清 PNG（2x 像素密度）">
            <Button size="small" icon={<FileImageOutlined />} onClick={() => handleExport('png')}>
              导出 PNG
            </Button>
          </Tooltip>
          <Tooltip title="导出为矢量 SVG">
            <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport('svg')}>
              导出 SVG
            </Button>
          </Tooltip>
        </Space>
        <Space size={4}>
          <Tooltip title="放大 (Ctrl++)">
            <Button size="small" icon={<ZoomInOutlined />} onClick={handleZoomIn}>
              放大
            </Button>
          </Tooltip>
          <Tooltip title="缩小 (Ctrl+-)">
            <Button size="small" icon={<ZoomOutOutlined />} onClick={handleZoomOut}>
              缩小
            </Button>
          </Tooltip>
          <Tooltip title="适应画布 (Ctrl+0)">
            <Button size="small" icon={<FullscreenOutlined />} onClick={handleZoomFit}>
              适应
            </Button>
          </Tooltip>
          <Tooltip title="实际大小 (Ctrl+9)">
            <Button size="small" icon={<FullscreenExitOutlined />} onClick={handleZoomReset}>
              100%
            </Button>
          </Tooltip>
        </Space>
      </Space>
    </div>
  );
};

export default ToolBar;
