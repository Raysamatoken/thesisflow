import React, { useState } from 'react';
import { Tabs, Input, Dropdown } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useGraphStore } from '../../stores/useGraphStore';
import { GraphType } from '../../types';

const SheetTabs: React.FC = () => {
  const sheets = useGraphStore(s => s.sheets);
  const activeSheetId = useGraphStore(s => s.activeSheetId);
  const setActiveSheet = useGraphStore(s => s.setActiveSheet);
  const addSheet = useGraphStore(s => s.addSheet);
  const removeSheet = useGraphStore(s => s.removeSheet);
  const renameSheet = useGraphStore(s => s.renameSheet);
  const duplicateSheet = useGraphStore(s => s.duplicateSheet);

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenuSheetId, setContextMenuSheetId] = useState<string | null>(null);

  // Context menu items
  const contextMenuItems = [
    {
      key: 'rename',
      label: '重命名',
      icon: <EditOutlined />,
    },
    {
      key: 'duplicate',
      label: '复制',
      icon: <CopyOutlined />,
    },
    {
      key: 'new',
      label: '新建流程图',
      icon: <PlusOutlined />,
    },
    {
      key: 'new-module',
      label: '新建模块图',
      icon: <FileOutlined />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
    },
  ];

  const handleTabChange = (key: string) => {
    setActiveSheet(key);
  };

  const handleAddSheet = () => {
    addSheet();
  };

  const handleAddModuleSheet = () => {
    addSheet('模块图', GraphType.Module);
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

  const handleMenuClick = ({ key }: { key: string }) => {
    const sheetId = contextMenuSheetId;
    if (!sheetId) return;

    switch (key) {
      case 'rename':
        handleRenameStart(sheetId, sheets.find(s => s.id === sheetId)?.name ?? '');
        break;
      case 'duplicate':
        handleDuplicate(sheetId);
        break;
      case 'new':
        handleAddSheet();
        break;
      case 'new-module':
        handleAddModuleSheet();
        break;
      case 'delete':
        handleDelete(sheetId);
        break;
    }
    setContextMenuSheetId(null);
  };

  const renderTab = (sheet: { id: string; name: string; type: GraphType }) => {
    const isActive = sheet.id === activeSheetId;
    const isEditing = editingTabId === sheet.id;

    if (isEditing) {
      return (
        <Input
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onBlur={() => handleRenameConfirm(sheet.id)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleRenameConfirm(sheet.id);
            if (e.key === 'Escape') handleRenameCancel();
          }}
          autoFocus
          style={{ width: 120, margin: 0 }}
          size="small"
        />
      );
    }

    const typeColor = sheet.type === GraphType.Flow ? '#1890ff' : '#52c41a';

    return (
      <Dropdown
        menu={{ items: contextMenuItems, onClick: handleMenuClick }}
        trigger={['contextMenu']}
        onVisibleChange={visible => {
          if (visible) setContextMenuSheetId(sheet.id);
          else setContextMenuSheetId(null);
        }}
      >
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
          onContextMenu={e => e.preventDefault()}
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
      </Dropdown>
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
        items={sheets.map(sheet => ({
          key: sheet.id,
          label: renderTab(sheet),
          children: null,
          closable: sheets.length > 1,
          onClose: () => handleDelete(sheet.id),
        }))}
        style={{ marginBottom: -1, zIndex: 1 }}
      />
    </div>
  );
};

export default SheetTabs;
