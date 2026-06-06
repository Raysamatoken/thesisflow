import React from 'react';
import { Button, Space, Typography, Tooltip, Divider, message } from 'antd';
import {
  FileAddOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  SortAscendingOutlined,
  DownloadOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import { useGraphStore, type AnyNode } from '../../stores/useGraphStore';
import { FlowNodeShape } from '../../types';
import type { FlowNode } from '../../types';
import { getGraph } from '../../utils/getGraph';
import { runAutoLayout } from '../../utils/autoLayout';

const { Text } = Typography;

function getDefaultStartNode(): FlowNode {
  return {
    id: 
ode--,
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
  const projectName = useGraphStore((s) => s.projectName);
  const dirty = useGraphStore((s) => s.dirty);
  const currentFilePath = useGraphStore((s) => s.currentFilePath);
  const nodeCount = useGraphStore((s) => s.nodes.length);

  const clearGraph = useGraphStore((s) => s.clearGraph);
  const addNode = useGraphStore((s) => s.addNode);
  const setProjectName = useGraphStore((s) => s.setProjectName);
  const loadProject = useGraphStore((s) => s.loadProject);
  const buildProjectFile = useGraphStore((s) => s.buildProjectFile);
  const setCurrentFilePath = useGraphStore((s) => s.setCurrentFilePath);
  const markClean = useGraphStore((s) => s.markClean);

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
      const savedPath = await api.saveProject(
        projectFile,
        currentFilePath ?? undefined
      );
      if (savedPath) {
        setCurrentFilePath(savedPath);
        markClean();
        message.success('项目已保存');
      }
    } catch {
      message.error('保存项目失败');
    }
  };

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
        dataUrl = await graph.exportPNG({
          backgroundColor: '#ffffff',
          padding: 20,
          quality: 1,
          ratio: 2,
        });
      } else {
        dataUrl = await graph.exportSVG({
          backgroundColor: '#ffffff',
          padding: 20,
          ratio: 2,
        });
      }
      const ok = await api.exportImage(dataUrl, format);
      if (ok) {
        message.success(`已导出 ${format.toUpperCase()} 文件`);
      }
    } catch {
      message.error('导出失败');
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
        <Text strong style={{ fontSize: 14 }}>{projectName}</Text>
        {dirty && <Text type="secondary" style={{ fontSize: 12 }}>(未保存)</Text>}
      </div>

      <Space size={4} split={<Divider type="vertical" />}>
        <Space size={4}>
          <Tooltip title="新建项目">
            <Button size="small" icon={<FileAddOutlined />} onClick={handleNew}>
              新建
            </Button>
          </Tooltip>
          <Tooltip title="打开项目文件">
            <Button size="small" icon={<FolderOpenOutlined />} onClick={handleOpen}>
              打开
            </Button>
          </Tooltip>
          <Tooltip title={currentFilePath ? '保存到当前路径' : '另存为…'}>
            <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存
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
      </Space>
    </div>
  );
};

export default ToolBar;