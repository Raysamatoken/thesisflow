// =====================================================================
// ThesisFlow - 应用根组件
// 顶部工具栏 + 标签页 + 三栏布局：左侧节点库 | 中间画布 | 右侧属性面板
// =====================================================================

import React from 'react';
import { Layout } from 'antd';
import ToolBar from './components/toolbar/ToolBar';
import SidePanel from './components/sidebar/SidePanel';
import GraphCanvas from './components/graph-editor/GraphCanvas';
import PropertyPanel from './components/property-panel/PropertyPanel';
import SheetTabs from './components/sheet-tabs/SheetTabs';

const { Sider, Content } = Layout;

const LEFT_SIDER_WIDTH = 240;
const RIGHT_SIDER_WIDTH = 300;

const App: React.FC = () => {
  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* ======== 顶部：工具栏 ======== */}
      <ToolBar />

      {/* ======== 标签页栏 ======== */}
      <SheetTabs />

      {/* ======== 下方：三栏主体 ======== */}
      <Layout>
        {/* 左侧：节点组件库 */}
        <Sider
          width={LEFT_SIDER_WIDTH}
          theme="light"
          style={{
            borderRight: '1px solid #f0f0f0',
            overflow: 'auto',
          }}
        >
          <SidePanel />
        </Sider>

        {/* 中间：画布容器 */}
        <Content
          style={{
            position: 'relative',
            background: '#fafafa',
          }}
        >
          <GraphCanvas />
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
