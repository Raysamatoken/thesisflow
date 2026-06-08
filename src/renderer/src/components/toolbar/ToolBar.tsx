import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button, Space, Typography, Tooltip, Divider, message, Dropdown } from 'antd';
import {
  FileAddOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  SortAscendingOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
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
import { exportPdf } from '../../utils/exportPdf';
import { copySelection, duplicateNodes } from '../../utils/common';

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
  const selectedNode = useGraphStore(s => s.selectedNode);
  const selectedEdgeId = useGraphStore(s => s.selectedEdgeId);

  const [clipboard, setClipboard] = useState<{ nodes: AnyNode[]; edges: GraphEdge[] } | null>(null);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const clipboardRef = useRef(clipboard);
  useEffect(() => {
    clipboardRef.current = clipboard;
  }, [clipboard]);

  const handleNew = () => {
    const store = useGraphStore.getState();
    store.clearGraph();
    store.setProjectName('未命名项目');
    const startNode = getDefaultStartNode();
    store.addNode(startNode);
    store.markClean();
    message.success('已创建新项目');
  };

  const handleOpen = async () => {
    const api = window.thesisFlow;
    if (!api) {
      message.warning('请在 Electron 环境中运行');
      return;
    }
    try {
      const result = await api.openProject();
      if (!result) return;
      useGraphStore.getState().loadProject(result.project);
      useGraphStore.getState().setCurrentFilePath(result.filePath);
      setRecentFiles(await api.getRecentFiles());
      message.success(`已打开「${result.project.name}」`);
    } catch {
      message.error('打开项目失败');
    }
  };

  const handleSave = useCallback(async () => {
    const api = window.thesisFlow;
    if (!api) {
      message.warning('请在 Electron 环境中运行');
      return;
    }
    try {
      const projectFile = useGraphStore.getState().buildProjectFile();
      const savedPath = await api.saveProject(projectFile, currentFilePath ?? undefined);
      if (savedPath) {
        useGraphStore.getState().setCurrentFilePath(savedPath);
        useGraphStore.getState().markClean();
        setRecentFiles(await api.getRecentFiles());
        message.success('项目已保存');
      }
    } catch {
      message.error('保存项目失败');
    }
  }, [currentFilePath]);

  useEffect(() => {
    const api = window.thesisFlow;
    if (api?.getRecentFiles) {
      api.getRecentFiles().then(setRecentFiles);
    }
  }, []);

  useEffect(() => {
    const api = window.thesisFlow;
    if (api?.onAutoSave) {
      const cleanup = api.onAutoSave(() => {
        const { dirty: isDirty, currentFilePath: fp } = useGraphStore.getState();
        if (isDirty && fp) {
          void handleSave();
        }
      });
      return cleanup;
    }
  }, [handleSave]);

  const handleAutoLayout = async () => {
    if (useGraphStore.getState().nodes.length === 0) {
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
    if (useGraphStore.getState().nodes.length === 0) {
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

  const handleExportPdf = async () => {
    if (useGraphStore.getState().nodes.length === 0) {
      message.warning('画布为空，请先添加节点');
      return;
    }
    try {
      const ok = await exportPdf(useGraphStore.getState().projectName);
      if (ok) {
        message.success('已导出 PDF 文件');
      }
    } catch {
      message.error('PDF 导出失败');
    }
  };

  const handleZoomIn = () => {
    getGraph()?.zoom(1.2);
  };
  const handleZoomOut = () => {
    getGraph()?.zoom(0.8);
  };
  const handleZoomReset = () => {
    getGraph()?.zoom(1);
  };
  const handleZoomFit = () => {
    const graph = getGraph();
    if (graph && useGraphStore.getState().nodes.length > 0) {
      graph.zoomToFit({ padding: 40 });
    }
  };

  // Keyboard shortcuts - all use getState() to avoid stale closures
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      if (isCtrl && e.key === 'z' && !isShift) {
        e.preventDefault();
        if (useGraphStore.getState().canUndo()) {
          useGraphStore.getState().undo();
        }
      } else if (isCtrl && e.key === 'z' && isShift) {
        e.preventDefault();
        if (useGraphStore.getState().canRedo()) {
          useGraphStore.getState().redo();
        }
      } else if (isCtrl && e.key === 'y') {
        e.preventDefault();
        if (useGraphStore.getState().canRedo()) {
          useGraphStore.getState().redo();
        }
      } else if (isCtrl && e.key === 'c') {
        e.preventDefault();
        const sel = copySelection();
        if (sel) setClipboard(sel);
      } else if (isCtrl && e.key === 'v') {
        e.preventDefault();
        const clip = clipboardRef.current;
        if (!clip) return;
        const { newNodes, newEdges } = duplicateNodes(clip.nodes, clip.edges);
        const store = useGraphStore.getState();
        newNodes.forEach(node => store.addNode(node));
        newEdges.forEach(edge => store.addEdge(edge));
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedNode, selectedEdgeId } = useGraphStore.getState();
        if (selectedNode) {
          e.preventDefault();
          useGraphStore.getState().removeNode(selectedNode.id);
        } else if (selectedEdgeId) {
          e.preventDefault();
          useGraphStore.getState().removeEdge(selectedEdgeId);
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
        void handleSave();
      } else if (isCtrl && e.key === 'n') {
        e.preventDefault();
        handleNew();
      } else if (isCtrl && e.key === 'o') {
        e.preventDefault();
        void handleOpen();
      } else if (isCtrl && e.key === 'f') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('thesisflow:open-search'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleOpenRecent = async (filePath: string) => {
    const api = window.thesisFlow;
    if (!api?.openFileByPath) {
      message.warning('请在 Electron 环境中运行');
      return;
    }
    try {
      const result = await api.openFileByPath(filePath);
      if (result) {
        useGraphStore.getState().loadProject(result.project);
        useGraphStore.getState().setCurrentFilePath(result.filePath);
        message.success(`已打开「${result.project.name}」`);
      } else {
        message.error('无法打开该文件');
      }
    } catch {
      message.error('打开文件失败');
    }
  };

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
                  onClick: () => void handleOpenRecent(file),
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
            <Button
              size="small"
              icon={<UndoOutlined />}
              onClick={() => {
                if (useGraphStore.getState().canUndo()) useGraphStore.getState().undo();
              }}
              disabled={!useGraphStore.getState().canUndo()}
            >
              撤销
            </Button>
          </Tooltip>
          <Tooltip title="重做 (Ctrl+Y / Ctrl+Shift+Z)">
            <Button
              size="small"
              icon={<RedoOutlined />}
              onClick={() => {
                if (useGraphStore.getState().canRedo()) useGraphStore.getState().redo();
              }}
              disabled={!useGraphStore.getState().canRedo()}
            >
              重做
            </Button>
          </Tooltip>
          <Tooltip title="复制 (Ctrl+C)">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                const sel = copySelection();
                if (sel) setClipboard(sel);
              }}
              disabled={!selectedNode && !selectedEdgeId}
            >
              复制
            </Button>
          </Tooltip>
          <Tooltip title="粘贴 (Ctrl+V)">
            <Button
              size="small"
              onClick={() => {
                const clip = clipboardRef.current;
                if (!clip) return;
                const { newNodes, newEdges } = duplicateNodes(clip.nodes, clip.edges);
                const store = useGraphStore.getState();
                newNodes.forEach(node => store.addNode(node));
                newEdges.forEach(edge => store.addEdge(edge));
              }}
              disabled={!clipboard}
            >
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
          <Tooltip title="导出为 PDF 文档">
            <Button size="small" icon={<FilePdfOutlined />} onClick={handleExportPdf}>
              导出 PDF
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
