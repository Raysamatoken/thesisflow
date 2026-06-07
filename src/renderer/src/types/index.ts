// =====================================================================
// ThesisFlow Renderer - 类型索引文件
// 统一导出 shared 类型，供渲染进程使用
// =====================================================================

import type { AnyNode, GraphEdge } from '../../../shared/types';

export type {
  BusinessData,
  FlowNodeData,
  ModuleNodeData,
  EdgeData,
  EdgeEndpoint,
  FlowNode,
  ModuleNode,
  GraphEdge,
  GraphSheet,
  ProjectFile,
  FlowGraphJSON,
  ModuleGraphJSON,
  AnyNode,
} from '../../../shared/types';

export {
  FlowNodeShape,
  ModuleNodeShape,
  GraphType,
  isFlowNode,
  isModuleNode,
  getNodeData,
} from '../../../shared/types';

export type { ThesisFlowAPI } from '../../../shared/ipc';

// -------------------------------------------------------------------
//  渲染进程专用辅助类型
// -------------------------------------------------------------------

/** Graph.fromJSON 的兼容入参 */
export type GraphJSONData = {
  nodes: AnyNode[];
  edges: GraphEdge[];
};
