import React, { useEffect, useState } from 'react';
import { Space, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Graph } from '@antv/x6';
import { useGraphStore, EDGE_PRESETS } from '../../stores/useGraphStore';
import type { AnyNode, ModuleNodeShape } from '../../types';
import { FlowNodeShape } from '../../types';

interface NodeTemplate {
  shape: string;
  label: string;
  width: number;
  height: number;
  preview: 'ellipse' | 'rect' | 'roundRect' | 'diamond' | 'parallelogram';
}

const FLOW_TEMPLATES: NodeTemplate[] = [
  {
    shape: FlowNodeShape.Terminal,
    label: '开始 / 结束',
    width: 120,
    height: 50,
    preview: 'ellipse',
  },
  { shape: FlowNodeShape.Process, label: '处理步骤', width: 140, height: 60, preview: 'roundRect' },
  { shape: FlowNodeShape.Decision, label: '判断条件', width: 120, height: 80, preview: 'diamond' },
  {
    shape: FlowNodeShape.IO,
    label: '输入 / 输出',
    width: 140,
    height: 60,
    preview: 'parallelogram',
  },
  { shape: FlowNodeShape.SubProcess, label: '子流程', width: 140, height: 60, preview: 'rect' },
];

const MODULE_TEMPLATES: NodeTemplate[] = [
  { shape: 'module-component', label: '系统模块', width: 200, height: 80, preview: 'rect' },
];

const PreviewSVG: React.FC<{ type: NodeTemplate['preview'] }> = ({ type }) => {
  const common = { fill: '#ffffff', stroke: '#333333', strokeWidth: 1.5 };
  switch (type) {
    case 'ellipse':
      return (
        <svg width="48" height="28" viewBox="0 0 48 28">
          <ellipse cx="24" cy="14" rx="23" ry="13" {...common} />
        </svg>
      );
    case 'roundRect':
      return (
        <svg width="48" height="28" viewBox="0 0 48 28">
          <rect x="1" y="1" width="46" height="26" rx="4" ry="4" {...common} />
        </svg>
      );
    case 'diamond':
      return (
        <svg width="48" height="36" viewBox="0 0 48 36">
          <polygon points="24,1 47,18 24,35 1,18" {...common} />
        </svg>
      );
    case 'parallelogram':
      return (
        <svg width="48" height="28" viewBox="0 0 48 28">
          <polygon points="8,1 47,1 40,27 1,27" {...common} />
        </svg>
      );
    default:
      return (
        <svg width="48" height="28" viewBox="0 0 48 28">
          <rect x="1" y="1" width="46" height="26" {...common} />
        </svg>
      );
  }
};

// Edge style preview SVG
const EdgePreviewSVG: React.FC<{ presetId: string }> = ({ presetId }) => {
  const s = { stroke: '#333', strokeWidth: 1.5, fill: 'none' };
  switch (presetId) {
    case 'straight-arrow':
      return (
        <svg width="48" height="20" viewBox="0 0 48 20">
          <line x1="4" y1="10" x2="38" y2="10" {...s} />
          <polygon points="38,5 46,10 38,15" fill="#333" stroke="none" />
        </svg>
      );
    case 'adaptive-arrow':
      return (
        <svg width="48" height="20" viewBox="0 0 48 20">
          <path d="M4,10 C4,10 16,10 20,4 C24,-2 30,-2 34,4 C38,10 40,10 40,10" {...s} />
          <polygon points="39,7 46,10 39,13" fill="#333" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
};

function useDragToCanvas() {
  useEffect(() => {
    const container = document.getElementById('graph-container');
    if (!container) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const shapeName = e.dataTransfer?.getData('application/thesisflow-shape');
      if (!shapeName) return;
      const allTemplates = [...FLOW_TEMPLATES, ...MODULE_TEMPLATES];
      const tpl = allTemplates.find(t => t.shape === shapeName);
      if (!tpl) return;
      const graph: Graph | undefined = (container as any).__graph__;
      if (!graph) return;
      const graphPoint = graph.clientToLocal(
        e.clientX - container.getBoundingClientRect().left,
        e.clientY - container.getBoundingClientRect().top
      );
      const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const isFlow = shapeName.startsWith('flow-');
      const newNode: AnyNode = isFlow
        ? {
            id,
            shape: shapeName as FlowNodeShape,
            x: graphPoint.x - tpl.width / 2,
            y: graphPoint.y - tpl.height / 2,
            width: tpl.width,
            height: tpl.height,
            label: tpl.label,
            data: {
              shape: shapeName as FlowNodeShape,
              color: '#ffffff',
              borderColor: '#333333',
              fontColor: '#333333',
              fontSize: 12,
              remark: '',
            },
          }
        : {
            id,
            shape: shapeName as ModuleNodeShape,
            x: graphPoint.x - tpl.width / 2,
            y: graphPoint.y - tpl.height / 2,
            width: tpl.width,
            height: tpl.height,
            label: tpl.label,
            data: {
              shape: shapeName as ModuleNodeShape,
              color: '#ffffff',
              borderColor: '#333333',
              fontColor: '#333333',
              fontSize: 12,
              remark: '',
            },
          };
      useGraphStore.getState().addNode(newNode);
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, []);
}

const NodeCard: React.FC<{ template: NodeTemplate }> = ({ template }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/thesisflow-shape', template.shape);
    e.dataTransfer.effectAllowed = 'copy';
  };
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        marginBottom: 6,
        borderRadius: 6,
        border: '1px solid #e8e8e8',
        background: '#fff',
        cursor: 'grab',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#91caff';
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#e8e8e8';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <PreviewSVG type={template.preview} />
      <span style={{ fontSize: 13, color: '#333', lineHeight: 1.3 }}>{template.label}</span>
    </div>
  );
};

const SidePanel: React.FC = () => {
  useDragToCanvas();
  const edgeStyleId = useGraphStore(s => s.edgeStyleId);
  const setEdgeStyleId = useGraphStore(s => s.setEdgeStyleId);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFlowTemplates = FLOW_TEMPLATES.filter(tpl =>
    tpl.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredModuleTemplates = MODULE_TEMPLATES.filter(tpl =>
    tpl.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ---- Search box ---- */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
        <Input
          placeholder="搜索节点..."
          prefix={<SearchOutlined style={{ color: '#aaa' }} />}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          size="small"
          style={{ width: '100%' }}
        />
      </div>

      {/* ---- Flow nodes ---- */}
      <div style={{ padding: '12px 12px 0' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#888',
            marginBottom: 8,
            letterSpacing: 1,
          }}
        >
          流程图
        </div>
        {filteredFlowTemplates.map(tpl => (
          <NodeCard key={tpl.shape} template={tpl} />
        ))}
      </div>

      {/* ---- Module nodes ---- */}
      <div style={{ padding: '16px 12px 0' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#888',
            marginBottom: 8,
            letterSpacing: 1,
          }}
        >
          模块图
        </div>
        {filteredModuleTemplates.map(tpl => (
          <NodeCard key={tpl.shape} template={tpl} />
        ))}
      </div>

      {/* ---- Edge styles ---- */}
      <div style={{ padding: '16px 12px 0', borderTop: '1px solid #f0f0f0', marginTop: 12 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#888',
            marginBottom: 8,
            letterSpacing: 1,
          }}
        >
          连线样式（拖拽到节点上创建连线）
        </div>
        <Space direction="vertical" style={{ width: '100%' }}>
          {EDGE_PRESETS.map(preset => (
            <div
              key={preset.id}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('application/thesisflow-edge', preset.id);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                border: edgeStyleId === preset.id ? '1px solid #91caff' : '1px solid #e8e8e8',
                background: edgeStyleId === preset.id ? '#e6f4ff' : '#fff',
                cursor: 'grab',
                userSelect: 'none',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={ev => {
                ev.currentTarget.style.borderColor = '#91caff';
                ev.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={ev => {
                ev.currentTarget.style.borderColor =
                  edgeStyleId === preset.id ? '#91caff' : '#e8e8e8';
                ev.currentTarget.style.boxShadow = 'none';
              }}
              onClick={() => setEdgeStyleId(preset.id)}
            >
              <EdgePreviewSVG presetId={preset.id} />
              <span style={{ fontSize: 12 }}>{preset.label}</span>
            </div>
          ))}
        </Space>
      </div>

      {/* ---- Usage tip ---- */}
      <div style={{ padding: '12px 12px 16px', marginTop: 'auto' }}>
        <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
          拖拽节点到画布·从端口拖拽连线·Shift+拖拽框选
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
