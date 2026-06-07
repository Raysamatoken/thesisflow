import React, { useState } from 'react';
import { Tabs, Button, Input, Menu, Tooltip, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { useGraphStore } from '../../stores/useGraphStore';
import { GraphType } from '../../types';

const { TabPane } = Tabs;

const SheetTabs: React.FC = () => {
  const sheets = useGraphStore((s) => s.sheets);
  const activeSheetId = useGraphStore((s) => s.activeSheetId);
  const setActiveSheet = useGraphStore((s) => s.setActiveSheet);
  const addSheet = useGraphStore((s) => s.addSheet);
  const removeSheet = useGraphStore((s) => s.removeSheet);
  const renameSheet = useGraphStore((s) => s.renameSheet);
  const duplicateSheet = useGraphStore((s) => s.duplicateSheet);

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleTabChange = (key: string) => {
    setActiveSheet(key);
  };

  const handleAddSheet = () => {
    addSheet();
  };

  const handleRenameStart = (sheetId: string, currentName: string) => {
    setEditingTabId(sheetId);
    setEditName(currentName);
  };

  const handleRenameConfirm = (sheetId: string) => {
    if (editName.trim()) {
      renameSheet(sheetId, editName.trim());
    }
    setEditingTabId(null);
    setEditName('');
  };

  const handleRenameCancel = () => {
    setEditingTabId(null);
    setEditName('');
  };

  const handleDuplicate = (sheetId: string) => {
    duplicateSheet(sheetId);
  };

  const handleDelete = (sheetId: string) => {
    removeSheet(sheetId);
  };

  const renderTab = (sheet: { id: string; name: string; type: GraphType }) => {
    const isActive = sheet.id === activeSheetId;
    const isEditing = editingTabId === sheet.id;

    if (isEditing) {
      return (
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={() => handleRenameConfirm(sheet.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameConfirm(sheet.id);
            if (e.key === 'Escape') handleRenameCancel();
          }}
          autoFocus
          style={{ width: 120, margin: 0 }}
          size="small"
        />
      );
    }

    const typeLabel = sheet.type === GraphType.Flow ? '流程图' : '模块图';
    const typeColor = sheet.type === GraphType.Flow ? '#1890ff' : '#52c41a';

    return (
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '2px 4px',
          borderRadius: 4,
          background: isActive ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
        }}
        onDoubleClick={() => handleRenameStart(sheet.id, sheet.name)}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: typeColor,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400 }}>{sheet.name}</span>
      </span>
    );
  };

  return (
    <div style={{ borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
      <Tabs
        activeKey={activeSheetId ?? undefined}
        onChange={handleTabChange}
        type="editable-card"
        hideAdd={false}
        onEdit={handleAddSheet}
        items={sheets.map((sheet) => ({
          key: sheet.id,
          label: renderTab(sheet),
          children: null, // Content is rendered separately in GraphCanvas
          closable: sheets.length > 1,
          onClose: () => handleDelete(sheet.id),
        }))}
        style={{ marginBottom: -1, zIndex: 1 }}
      />
      {/* Context menu would be nice but requires more setup */}
    </div>
  );
};

export default SheetTabs;