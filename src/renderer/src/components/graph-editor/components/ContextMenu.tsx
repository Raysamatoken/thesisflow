import React from 'react';
import { Dropdown } from 'antd';
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { AnyNode, GraphEdge } from '../../../types';
import { useGraphStore } from '../../../stores/useGraphStore';

interface ContextMenuProps {
  contextMenu: { x: number; y: number; type: 'node' | 'edge' | 'canvas'; id: string } | null;
  onClose: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ contextMenu, onClose, containerRef }) => {
  const nodes = useGraphStore(s => s.nodes);
  const edges = useGraphStore(s => s.edges);
  const removeNode = useGraphStore(s => s.removeNode);
  const removeEdge = useGraphStore(s => s.removeEdge);

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
            const data = JSON.stringify({ nodes: [node], edges: connectedEdges });
            navigator.clipboard.writeText(data).catch(() => {});
          }
        } else if (type === 'edge') {
          const edge = edges.find(e => e.id === id);
          if (edge) {
            const data = JSON.stringify({ nodes: [], edges: [edge] });
            navigator.clipboard.writeText(data).catch(() => {});
          }
        }
        break;
      case 'delete':
        if (type === 'node') removeNode(id);
        else if (type === 'edge') removeEdge(id);
        break;
    }
    onClose();
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
    { key: 'paste', label: '粘贴', icon: <EditOutlined />, disabled: true },
  ];

  if (!contextMenu) return null;

  const items =
    contextMenu.type === 'node'
      ? nodeContextMenuItems
      : contextMenu.type === 'edge'
        ? edgeContextMenuItems
        : canvasContextMenuItems;

  return (
    <Dropdown
      menu={{ items, onClick: handleMenuClick }}
      open={true}
      onOpenChange={open => !open && onClose()}
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
  );
};
