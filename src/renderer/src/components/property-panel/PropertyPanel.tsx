import React, { useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  ColorPicker,
  Empty,
  Typography,
  Divider,
  Button,
  Select,
  Popconfirm,
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useGraphStore } from '../../stores/useGraphStore';
import type { AnyNode } from '../../types';
import { isFlowNode } from '../../types';

const { Text, Title } = Typography;
const { TextArea } = Input;

const PropertyPanel: React.FC = () => {
  const selectedNode = useGraphStore(s => s.selectedNode);
  const selectedEdgeId = useGraphStore(s => s.selectedEdgeId);
  const edges = useGraphStore(s => s.edges);
  const updateNode = useGraphStore(s => s.updateNode);
  const updateEdge = useGraphStore(s => s.updateEdge);
  const removeEdge = useGraphStore(s => s.removeEdge);
  const removeNode = useGraphStore(s => s.removeNode);
  const clearSelection = useGraphStore(s => s.clearSelection);

  const [form] = Form.useForm();
  const selectedEdge = selectedEdgeId ? (edges.find(e => e.id === selectedEdgeId) ?? null) : null;

  useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue({
        label: selectedNode.label ?? '',
        fontSize: selectedNode.data?.fontSize ?? 12,
        color: selectedNode.data?.color ?? '#ffffff',
        borderColor: selectedNode.data?.borderColor ?? '#333333',
        fontColor: selectedNode.data?.fontColor ?? '#333333',
        remark: selectedNode.data?.remark ?? '',
      });
    } else if (selectedEdge) {
      form.setFieldsValue({
        label: selectedEdge.label ?? '',
        remark: selectedEdge.data?.remark ?? '',
      });
    } else {
      form.resetFields();
    }
  }, [selectedNode, selectedEdge, form]);

  const handleFieldChange = (field: string, value: unknown) => {
    if (selectedNode) {
      if (field === 'label') {
        updateNode(selectedNode.id, { label: value as string });
      } else {
        updateNode(selectedNode.id, {
          data: { ...selectedNode.data, [field]: value },
        } as Partial<AnyNode>);
      }
    } else if (selectedEdgeId) {
      if (field === 'label') {
        updateEdge(selectedEdgeId, { label: value as string });
      } else {
        updateEdge(selectedEdgeId, {
          data: { ...selectedEdge?.data, [field]: value },
        });
      }
    }
  };

  const handleDelete = () => {
    if (selectedNode) {
      removeNode(selectedNode.id);
    } else if (selectedEdgeId) {
      removeEdge(selectedEdgeId);
    }
    clearSelection();
  };

  // No selection
  if (!selectedNode && !selectedEdge) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 24,
        }}
      >
        <Empty
          description={
            <Text type="secondary" style={{ fontSize: 13 }}>
              点击画布中的节点或连线以编辑属性
            </Text>
          }
        />
      </div>
    );
  }

  // Edge selected
  if (selectedEdge && !selectedNode) {
    return (
      <div style={{ padding: '12px 12px 24px', overflow: 'auto', height: '100%' }}>
        <Title level={5} style={{ margin: '0 0 4px' }}>
          属性面板
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          连线
        </Text>
        <Divider style={{ margin: '12px 0' }} />
        <Form form={form} layout="vertical" size="small" requiredMark={false}>
          <Form.Item label="连线文字" name="label">
            <Input
              placeholder="如 是 / 否"
              onChange={e => handleFieldChange('label', e.target.value)}
            />
          </Form.Item>
          <Form.Item label="连线颜色" name="color">
            <ColorPicker
              format="hex"
              showText
              onChange={(_, hex) => handleFieldChange('color', hex)}
            />
          </Form.Item>
          <Form.Item label="线型" name="strokeDasharray">
            <Select
              defaultValue=""
              onChange={val => handleFieldChange('strokeDasharray', val)}
              options={[
                { label: '实线', value: '' },
                { label: '虚线', value: '5,5' },
                { label: '点线', value: '2,2' },
                { label: '点划线', value: '10,5,2,5' },
              ]}
            />
          </Form.Item>
          <Form.Item label="线宽" name="strokeWidth">
            <InputNumber
              min={1}
              max={5}
              style={{ width: '100%' }}
              onChange={val => handleFieldChange('strokeWidth', val ?? 1.5)}
            />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <TextArea
              rows={2}
              placeholder="添加备注…"
              onChange={e => handleFieldChange('remark', e.target.value)}
            />
          </Form.Item>
        </Form>
        <Popconfirm
          title="确定删除该连线？"
          onConfirm={handleDelete}
          okText="删除"
          cancelText="取消"
        >
          <Button danger icon={<DeleteOutlined />} block size="small">
            删除连线
          </Button>
        </Popconfirm>
      </div>
    );
  }

  // Node selected
  const nodeType = isFlowNode(selectedNode!) ? '流程图节点' : '模块图节点';
  return (
    <div style={{ padding: '12px 12px 24px', overflow: 'auto', height: '100%' }}>
      <Title level={5} style={{ margin: '0 0 4px' }}>
        属性面板
      </Title>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {nodeType} · {selectedNode!.shape}
      </Text>
      <Divider style={{ margin: '12px 0' }} />
      <Form form={form} layout="vertical" size="small" requiredMark={false}>
        <Form.Item label="文本内容" name="label">
          <Input
            placeholder="输入节点文字"
            onChange={e => handleFieldChange('label', e.target.value)}
          />
        </Form.Item>
        <Form.Item label="字号 (px)" name="fontSize">
          <InputNumber
            min={8}
            max={36}
            style={{ width: '100%' }}
            onChange={val => handleFieldChange('fontSize', val ?? 12)}
          />
        </Form.Item>
        <Form.Item label="填充色" name="color">
          <ColorPicker
            format="hex"
            showText
            onChange={(_, hex) => handleFieldChange('color', hex)}
          />
        </Form.Item>
        <Form.Item label="边框色" name="borderColor">
          <ColorPicker
            format="hex"
            showText
            onChange={(_, hex) => handleFieldChange('borderColor', hex)}
          />
        </Form.Item>
        <Form.Item label="字体颜色" name="fontColor">
          <ColorPicker
            format="hex"
            showText
            onChange={(_, hex) => handleFieldChange('fontColor', hex)}
          />
        </Form.Item>
        <Form.Item label="备注" name="remark">
          <TextArea
            rows={3}
            placeholder="添加备注信息…"
            onChange={e => handleFieldChange('remark', e.target.value)}
          />
        </Form.Item>
      </Form>
      <Popconfirm title="确定删除该节点？" onConfirm={handleDelete} okText="删除" cancelText="取消">
        <Button danger icon={<DeleteOutlined />} block size="small">
          删除节点
        </Button>
      </Popconfirm>
    </div>
  );
};

export default PropertyPanel;
