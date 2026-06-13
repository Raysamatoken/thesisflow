// =====================================================================
// ThesisFlow - 应用根组件
// 顶部工具栏 + 标签页 + 三栏布局：左侧节点库 | 中间画布 | 右侧属性面板
// 底部：对齐工具栏（多选时显示）
// =====================================================================

import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Modal } from 'antd';
import ToolBar from './components/toolbar/ToolBar';
import SidePanel from './components/sidebar/SidePanel';
import GraphCanvas from './components/graph-editor/GraphCanvas';
import PropertyPanel from './components/property-panel/PropertyPanel';
import SheetTabs from './components/sheet-tabs/SheetTabs';
import AlignmentToolbar from './components/alignment-toolbar/AlignmentToolbar';
import TemplatePanel from './components/template-panel/TemplatePanel';
import { useGraphStore } from './stores/useGraphStore';

const { Sider, Content } = Layout;

const LEFT_SIDER_WIDTH = 240;
const RIGHT_SIDER_WIDTH = 300;

const App: React.FC = () => {
  const [leftTab, setLeftTab] = useState('nodes');
  const dirty = useGraphStore(s => s.dirty);

  // Handle renderer-side beforeunload for tab/window close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Handle IPC close confirmation from main process
  useEffect(() => {
    const cleanup = window.thesisFlow?.onCheckUnsavedBeforeClose(() => {
      if (!dirty) {
        window.thesisFlow?.confirmClose();
        return;
      }
      Modal.confirm({
        title: '未保存的更改',
        content: '当前项目有未保存的更改，是否关闭？',
        okText: '关闭',
        cancelText: '取消',
        onOk: () => {
          window.thesisFlow?.confirmClose();
        },
      });
    });
    return () => cleanup?.();
  }, [dirty]);

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* ======== 顶部：工具栏 ======== */}
      <ToolBar />

      {/* ======== 标签页栏 ======== */}
      <SheetTabs />

      {/* ======== 下方：三栏主体 ======== */}
      <Layout>
        {/* 左侧：节点库 + 模板 */}
        <Sider
          width={LEFT_SIDER_WIDTH}
          theme="light"
          style={{
            borderRight: '1px solid #f0f0f0',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Tabs
            activeKey={leftTab}
            onChange={setLeftTab}
            size="small"
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            items={[
              {
                key: 'nodes',
                label: '节点',
                children: <SidePanel />,
              },
              {
                key: 'templates',
                label: '模板',
                children: <TemplatePanel />,
              },
            ]}
          />
        </Sider>

        {/* 中间：画布容器 */}
        <Content
          style={{
            position: 'relative',
            background: '#fafafa',
          }}
        >
          <GraphCanvas />
          <AlignmentToolbar />
        </Content>

        {/* 右侧：属性面板 */}
        <Sider
          width={RIGHT_SIDER_WIDTH}
          theme="light"
          style={{
            borderLeft: '1px solid #f0f0f0',
            overflow: 'auto',
          }}
        >
          <PropertyPanel />
        </Sider>
      </Layout>
    </Layout>
  );
};

export default App;
