// =====================================================================
// ThesisFlow Renderer - 类型索引文件
// 统一导出 shared 类型，供渲染进程使用
// =====================================================================

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
} from '../../../shared/types';

export {
  FlowNodeShape,
  ModuleNodeShape,
  GraphType,
} from '../../../shared/types';

export type { ThesisFlowAPI } from '../../../shared/ipc';

// -------------------------------------------------------------------
//  渲染进程专用辅助类型
// -------------------------------------------------------------------

/** 统一的节点类型，用于需要同时处理流程图/模块图节点的场景 */
export type AnyNode = import('../../../shared/types').FlowNode | import('../../../shared/types').ModuleNode;

/** Graph.fromJSON 的兼容入参 */
export type GraphJSONData = {
  nodes: AnyNode[];
  edges: import('../../../shared/types').GraphEdge[];
};
