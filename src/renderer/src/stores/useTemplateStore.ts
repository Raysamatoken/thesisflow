import { create } from 'zustand';
import type { AnyNode, GraphEdge } from '../types';
import { FlowNodeShape, ModuleNodeShape } from '../types';

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  nodes: AnyNode[];
  edges: GraphEdge[];
  thumbnail?: string;
  createdAt: string;
}

interface TemplateState {
  templates: Template[];
  categories: string[];
  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => void;
  removeTemplate: (id: string) => void;
  getTemplatesByCategory: (category: string) => Template[];
  importTemplate: (json: string) => boolean;
  exportTemplate: (id: string) => string | null;
}

const BUILTIN_TEMPLATES: Template[] = [
  {
    id: 'builtin-login-flow',
    name: '登录流程',
    category: '业务流程',
    description: '用户登录验证流程图',
    nodes: [
      { id: 't1', shape: FlowNodeShape.Terminal, x: 200, y: 50, width: 120, height: 50, label: '开始', data: { shape: FlowNodeShape.Terminal } },
      { id: 't2', shape: FlowNodeShape.IO, x: 200, y: 150, width: 140, height: 60, label: '输入账号密码', data: { shape: FlowNodeShape.IO } },
      { id: 't3', shape: FlowNodeShape.Process, x: 200, y: 260, width: 140, height: 60, label: '验证信息', data: { shape: FlowNodeShape.Process } },
      { id: 't4', shape: FlowNodeShape.Decision, x: 200, y: 370, width: 120, height: 80, label: '验证通过？', data: { shape: FlowNodeShape.Decision } },
      { id: 't5', shape: FlowNodeShape.Process, x: 200, y: 500, width: 140, height: 60, label: '进入主页', data: { shape: FlowNodeShape.Process } },
      { id: 't6', shape: FlowNodeShape.IO, x: 400, y: 370, width: 140, height: 60, label: '提示错误', data: { shape: FlowNodeShape.IO } },
      { id: 't7', shape: FlowNodeShape.Terminal, x: 200, y: 610, width: 120, height: 50, label: '结束', data: { shape: FlowNodeShape.Terminal } },
    ],
    edges: [
      { id: 'e1', source: 't1', target: 't2', data: {} },
      { id: 'e2', source: 't2', target: 't3', data: {} },
      { id: 'e3', source: 't3', target: 't4', data: {} },
      { id: 'e4', source: 't4', target: 't5', label: '是', data: {} },
      { id: 'e5', source: 't4', target: 't6', label: '否', data: {} },
      { id: 'e6', source: 't6', target: 't2', data: {} },
      { id: 'e7', source: 't5', target: 't7', data: {} },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-three-tier',
    name: '三层架构',
    category: '系统架构',
    description: '经典的三层系统架构图',
    nodes: [
      { id: 'm1', shape: ModuleNodeShape.Generic, x: 200, y: 50, width: 200, height: 80, label: '表示层', data: { shape: ModuleNodeShape.Generic } },
      { id: 'm2', shape: ModuleNodeShape.Generic, x: 200, y: 180, width: 200, height: 80, label: '业务逻辑层', data: { shape: ModuleNodeShape.Generic } },
      { id: 'm3', shape: ModuleNodeShape.Generic, x: 200, y: 310, width: 200, height: 80, label: '数据访问层', data: { shape: ModuleNodeShape.Generic } },
    ],
    edges: [
      { id: 'e1', source: 'm1', target: 'm2', data: {} },
      { id: 'e2', source: 'm2', target: 'm3', data: {} },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-data-flow',
    name: '数据流图',
    category: '数据流',
    description: '基本数据处理流程',
    nodes: [
      { id: 'd1', shape: FlowNodeShape.IO, x: 50, y: 200, width: 140, height: 60, label: '数据输入', data: { shape: FlowNodeShape.IO } },
      { id: 'd2', shape: FlowNodeShape.Process, x: 250, y: 200, width: 140, height: 60, label: '数据处理', data: { shape: FlowNodeShape.Process } },
      { id: 'd3', shape: FlowNodeShape.Process, x: 450, y: 200, width: 140, height: 60, label: '数据存储', data: { shape: FlowNodeShape.Process } },
      { id: 'd4', shape: FlowNodeShape.IO, x: 650, y: 200, width: 140, height: 60, label: '数据输出', data: { shape: FlowNodeShape.IO } },
    ],
    edges: [
      { id: 'e1', source: 'd1', target: 'd2', data: {} },
      { id: 'e2', source: 'd2', target: 'd3', data: {} },
      { id: 'e3', source: 'd3', target: 'd4', data: {} },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

export const useTemplateStore = create<TemplateState>()((set, get) => ({
  templates: [...BUILTIN_TEMPLATES],
  categories: ['业务流程', '系统架构', '数据流', '自定义'],

  addTemplate: (template) => {
    const newTemplate: Template = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    set(state => ({
      templates: [...state.templates, newTemplate],
    }));
  },

  removeTemplate: (id) => {
    if (id.startsWith('builtin-')) return; // Can't remove built-in templates
    set(state => ({
      templates: state.templates.filter(t => t.id !== id),
    }));
  },

  getTemplatesByCategory: (category) => {
    return get().templates.filter(t => t.category === category);
  },

  importTemplate: (json) => {
    try {
      const data = JSON.parse(json);
      if (data.name && data.nodes && data.edges) {
        get().addTemplate({
          name: data.name,
          category: data.category || '自定义',
          description: data.description || '',
          nodes: data.nodes,
          edges: data.edges,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  exportTemplate: (id) => {
    const template = get().templates.find(t => t.id === id);
    if (!template) return null;
    return JSON.stringify(template, null, 2);
  },
}));
