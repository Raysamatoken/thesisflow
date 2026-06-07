import React, { useState } from 'react';
import { Collapse, Button, Empty, Tooltip, message, Input, Modal, Select } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useTemplateStore, type Template } from '../../stores/useTemplateStore';
import { useGraphStore } from '../../stores/useGraphStore';

const { Panel } = Collapse;
const { TextArea } = Input;

const TemplatePanel: React.FC = () => {
  const { templates, categories, addTemplate, removeTemplate, importTemplate, exportTemplate } =
    useTemplateStore();
  const addNode = useGraphStore(s => s.addNode);
  const addEdge = useGraphStore(s => s.addEdge);
  const nodes = useGraphStore(s => s.nodes);
  const edges = useGraphStore(s => s.edges);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveCategory, setSaveCategory] = useState('自定义');

  const handleApplyTemplate = (template: Template) => {
    const idMap = new Map<string, string>();

    template.nodes.forEach(node => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      idMap.set(node.id, newId);
      addNode({
        ...node,
        id: newId,
        x: node.x + 20,
        y: node.y + 20,
      });
    });

    template.edges.forEach(edge => {
      const newSource =
        typeof edge.source === 'string'
          ? (idMap.get(edge.source) ?? edge.source)
          : { ...edge.source, cell: idMap.get(edge.source.cell) ?? edge.source.cell };
      const newTarget =
        typeof edge.target === 'string'
          ? (idMap.get(edge.target) ?? edge.target)
          : { ...edge.target, cell: idMap.get(edge.target.cell) ?? edge.target.cell };
      addEdge({
        ...edge,
        id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        source: newSource,
        target: newTarget,
      });
    });

    message.success(`已应用模板「${template.name}」`);
  };

  const handleSaveAsTemplate = () => {
    if (!saveName.trim()) {
      message.warning('请输入模板名称');
      return;
    }
    if (nodes.length === 0) {
      message.warning('画布为空，无法保存为模板');
      return;
    }
    addTemplate({
      name: saveName,
      category: saveCategory,
      description: `自定义模板 - ${nodes.length} 个节点`,
      nodes: [...nodes],
      edges: [...edges],
    });
    setSaveModalOpen(false);
    setSaveName('');
    message.success('模板已保存');
  };

  const handleImport = () => {
    if (importTemplate(importJson)) {
      setImportModalOpen(false);
      setImportJson('');
      message.success('模板导入成功');
    } else {
      message.error('模板格式无效');
    }
  };

  const handleExport = (template: Template) => {
    const json = exportTemplate(template.id);
    if (json) {
      navigator.clipboard.writeText(json).then(() => {
        message.success('模板已复制到剪贴板');
      });
    }
  };

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ padding: '0 12px 8px', display: 'flex', gap: 4 }}>
        <Tooltip title="保存当前画布为模板">
          <Button size="small" icon={<PlusOutlined />} onClick={() => setSaveModalOpen(true)}>
            保存模板
          </Button>
        </Tooltip>
        <Tooltip title="导入模板">
          <Button size="small" icon={<ImportOutlined />} onClick={() => setImportModalOpen(true)}>
            导入
          </Button>
        </Tooltip>
      </div>

      <Collapse ghost defaultActiveKey={categories}>
        {categories.map(category => {
          const categoryTemplates = templates.filter(t => t.category === category);
          if (categoryTemplates.length === 0) return null;
          return (
            <Panel
              key={category}
              header={
                <span style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>
                  {category} ({categoryTemplates.length})
                </span>
              }
            >
              {categoryTemplates.map(template => (
                <div
                  key={template.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    marginBottom: 4,
                    borderRadius: 4,
                    border: '1px solid #e8e8e8',
                    background: '#fff',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onClick={() => handleApplyTemplate(template)}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#91caff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#e8e8e8';
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{template.name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>
                      {template.nodes.length} 节点 · {template.edges.length} 连线
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Tooltip title="导出">
                      <Button
                        size="small"
                        type="text"
                        icon={<ExportOutlined />}
                        onClick={e => {
                          e.stopPropagation();
                          handleExport(template);
                        }}
                      />
                    </Tooltip>
                    {!template.id.startsWith('builtin-') && (
                      <Tooltip title="删除">
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={e => {
                            e.stopPropagation();
                            removeTemplate(template.id);
                          }}
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
              ))}
            </Panel>
          );
        })}
      </Collapse>

      {templates.length === 0 && (
        <Empty
          description="暂无模板"
          style={{ padding: '24px 0' }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      {/* Save Template Modal */}
      <Modal
        title="保存为模板"
        open={saveModalOpen}
        onOk={handleSaveAsTemplate}
        onCancel={() => setSaveModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            placeholder="模板名称"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
          />
          <Select
            value={saveCategory}
            onChange={setSaveCategory}
            options={categories.map(c => ({ label: c, value: c }))}
          />
        </div>
      </Modal>

      {/* Import Template Modal */}
      <Modal
        title="导入模板"
        open={importModalOpen}
        onOk={handleImport}
        onCancel={() => setImportModalOpen(false)}
        okText="导入"
        cancelText="取消"
      >
        <TextArea
          rows={6}
          placeholder="粘贴模板 JSON..."
          value={importJson}
          onChange={e => setImportJson(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default TemplatePanel;
