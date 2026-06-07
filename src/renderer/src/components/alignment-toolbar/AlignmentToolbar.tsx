import React from 'react';
import { Tooltip, Space } from 'antd';
import {
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignBottomOutlined,
  LayoutOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useGraphStore } from '../../stores/useGraphStore';

const AlignmentToolbar: React.FC = () => {
  const selectedNodeIds = useGraphStore(s => s.selectedNodeIds);
  const alignLeft = useGraphStore(s => s.alignLeft);
  const alignCenter = useGraphStore(s => s.alignCenter);
  const alignRight = useGraphStore(s => s.alignRight);
  const alignTop = useGraphStore(s => s.alignTop);
  const alignMiddle = useGraphStore(s => s.alignMiddle);
  const alignBottom = useGraphStore(s => s.alignBottom);
  const distributeHorizontal = useGraphStore(s => s.distributeHorizontal);
  const distributeVertical = useGraphStore(s => s.distributeVertical);

  const count = selectedNodeIds.length;
  const show = count >= 2;

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Space
        direction="horizontal"
        size={4}
        split={<div style={{ width: 1, height: 20, background: '#e8e8e8' }} />}
      >
        <Tooltip title="左对齐">
          <button type="button" onClick={alignLeft} style={btnStyle}>
            <AlignLeftOutlined />
          </button>
        </Tooltip>
        <Tooltip title="水平居中">
          <button type="button" onClick={alignCenter} style={btnStyle}>
            <AlignCenterOutlined />
          </button>
        </Tooltip>
        <Tooltip title="右对齐">
          <button type="button" onClick={alignRight} style={btnStyle}>
            <AlignRightOutlined />
          </button>
        </Tooltip>
      </Space>

      <Space
        direction="horizontal"
        size={4}
        split={<div style={{ width: 1, height: 20, background: '#e8e8e8' }} />}
      >
        <Tooltip title="顶对齐">
          <button type="button" onClick={alignTop} style={btnStyle}>
            <VerticalAlignTopOutlined />
          </button>
        </Tooltip>
        <Tooltip title="垂直居中">
          <button type="button" onClick={alignMiddle} style={btnStyle}>
            <VerticalAlignMiddleOutlined />
          </button>
        </Tooltip>
        <Tooltip title="底对齐">
          <button type="button" onClick={alignBottom} style={btnStyle}>
            <VerticalAlignBottomOutlined />
          </button>
        </Tooltip>
      </Space>

      <Space
        direction="horizontal"
        size={4}
        split={<div style={{ width: 1, height: 20, background: '#e8e8e8' }} />}
      >
        <Tooltip title={count < 3 ? '水平分布 (需 ≥3 个节点)' : '水平分布'}>
          <button
            type="button"
            onClick={distributeHorizontal}
            disabled={count < 3}
            style={btnStyle}
          >
            <LayoutOutlined />
          </button>
        </Tooltip>
        <Tooltip title={count < 3 ? '垂直分布 (需 ≥3 个节点)' : '垂直分布'}>
          <button type="button" onClick={distributeVertical} disabled={count < 3} style={btnStyle}>
            <MenuUnfoldOutlined />
          </button>
        </Tooltip>
      </Space>

      <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>已选 {count} 个节点</span>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: '4px 8px',
  borderRadius: 4,
  cursor: 'pointer',
  color: '#333',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s, color 0.15s',
};

export default AlignmentToolbar;
