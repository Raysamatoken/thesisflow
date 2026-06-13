import React, { useState, useCallback } from 'react';
import { Input, Modal } from 'antd';
import { useGraphStore } from '../../stores/useGraphStore';
import { useGraphContext } from '../../contexts/GraphContext';

const EdgeLabelEditor: React.FC = () => {
  const graph = useGraphContext();
  const updateEdge = useGraphStore(s => s.updateEdge);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);

  const openEditor = useCallback((edgeId: string, currentLabel: string) => {
    setValue(currentLabel);
    setEditingEdgeId(edgeId);
    setOpen(true);
  }, []);

  const handleOk = () => {
    if (editingEdgeId) {
      updateEdge(editingEdgeId, { label: value });
      if (graph) {
        const edge = graph.getCellById(editingEdgeId);
        if (edge && edge.isEdge()) {
          edge.setLabels([{ attrs: { label: { text: value } } }]);
        }
      }
    }
    setOpen(false);
    setEditingEdgeId(null);
  };

  const handleCancel = () => {
    setOpen(false);
    setEditingEdgeId(null);
  };

  // Expose openEditor via custom event
  React.useEffect(() => {
    const handler = ((e: CustomEvent) => {
      const { edgeId, currentLabel } = e.detail;
      openEditor(edgeId, currentLabel);
    }) as EventListener;
    window.addEventListener('thesisflow:edit-edge-label', handler);
    return () => window.removeEventListener('thesisflow:edit-edge-label', handler);
  }, [openEditor]);

  return (
    <Modal
      title="编辑连线标签"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确定"
      cancelText="取消"
    >
      <Input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="输入连线标签"
        autoFocus
        onPressEnter={handleOk}
      />
    </Modal>
  );
};

export default EdgeLabelEditor;
