import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTemplateStore } from '../useTemplateStore';

// Mock the types module
vi.mock('../../../types', () => ({
  FlowNodeShape: {
    Terminal: 'flow-terminal',
    Process: 'flow-process',
    Decision: 'flow-decision',
    IO: 'flow-io',
    SubProcess: 'flow-subprocess',
  },
  ModuleNodeShape: {
    Generic: 'module-generic',
    Presentation: 'module-presentation',
    Business: 'module-business',
    DataAccess: 'module-data-access',
    External: 'module-external',
    Database: 'module-database',
  },
}));

describe('useTemplateStore', () => {
  beforeEach(() => {
    useTemplateStore.setState({
      templates: [
        ...useTemplateStore.getState().templates.filter(t => !t.id.startsWith('custom-')),
      ],
    });
  });

  it('should have builtin templates', () => {
    const state = useTemplateStore.getState();
    expect(state.templates.length).toBeGreaterThanOrEqual(3);
    expect(state.templates.some(t => t.id === 'builtin-login-flow')).toBe(true);
    expect(state.templates.some(t => t.id === 'builtin-three-tier')).toBe(true);
    expect(state.templates.some(t => t.id === 'builtin-data-flow')).toBe(true);
  });

  it('should have categories', () => {
    const state = useTemplateStore.getState();
    expect(state.categories).toContain('业务流程');
    expect(state.categories).toContain('系统架构');
    expect(state.categories).toContain('数据流');
    expect(state.categories).toContain('自定义');
  });

  it('should add custom template', () => {
    useTemplateStore.getState().addTemplate({
      name: 'Test Template',
      category: '自定义',
      description: 'Test',
      nodes: [],
      edges: [],
    });

    const state = useTemplateStore.getState();
    const custom = state.templates.find(t => t.name === 'Test Template');
    expect(custom).toBeDefined();
    expect(custom?.category).toBe('自定义');
  });

  it('should not remove builtin templates', () => {
    const before = useTemplateStore.getState().templates.length;
    useTemplateStore.getState().removeTemplate('builtin-login-flow');
    const after = useTemplateStore.getState().templates.length;
    expect(after).toBe(before);
  });

  it('should remove custom templates', () => {
    useTemplateStore.getState().addTemplate({
      name: 'To Remove',
      category: '自定义',
      description: '',
      nodes: [],
      edges: [],
    });

    const added = useTemplateStore.getState().templates.find(t => t.name === 'To Remove');
    expect(added).toBeDefined();

    useTemplateStore.getState().removeTemplate(added!.id);
    const removed = useTemplateStore.getState().templates.find(t => t.id === added!.id);
    expect(removed).toBeUndefined();
  });

  it('should get templates by category', () => {
    const flowTemplates = useTemplateStore.getState().getTemplatesByCategory('业务流程');
    expect(flowTemplates.length).toBeGreaterThanOrEqual(1);
    expect(flowTemplates.every(t => t.category === '业务流程')).toBe(true);
  });

  it('should export template as JSON', () => {
    const json = useTemplateStore.getState().exportTemplate('builtin-login-flow');
    expect(json).not.toBeNull();
    const parsed = JSON.parse(json!);
    expect(parsed.name).toBe('登录流程');
    expect(parsed.nodes).toBeDefined();
    expect(parsed.edges).toBeDefined();
  });

  it('should return null for non-existent template export', () => {
    const json = useTemplateStore.getState().exportTemplate('non-existent');
    expect(json).toBeNull();
  });

  it('should import template from JSON', () => {
    const templateJson = JSON.stringify({
      name: 'Imported Template',
      category: '自定义',
      description: 'Imported',
      nodes: [],
      edges: [],
    });

    const result = useTemplateStore.getState().importTemplate(templateJson);
    expect(result).toBe(true);

    const imported = useTemplateStore
      .getState()
      .templates.find(t => t.name === 'Imported Template');
    expect(imported).toBeDefined();
  });

  it('should reject invalid JSON import', () => {
    const result = useTemplateStore.getState().importTemplate('invalid json');
    expect(result).toBe(false);
  });

  it('should reject import without required fields', () => {
    const result = useTemplateStore.getState().importTemplate(JSON.stringify({ foo: 'bar' }));
    expect(result).toBe(false);
  });
});
