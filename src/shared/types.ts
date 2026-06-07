// =====================================================================
// ThesisFlow - 核心类型定义
// 共享类型：main / preload / renderer 三个进程共用
// =====================================================================

import type { Node, Edge } from '@antv/x6';

// -------------------------------------------------------------------
//  1. 通用基础类型
// -------------------------------------------------------------------

/** 自定义业务属性的通用载体，挂载在 x6 节点/边的 data 字段上 */
export interface BusinessData {
  /** 节点/边的填充色，合法 CSS 颜色值 */
  color?: string;
  /** 节点/边的边框色 */
  borderColor?: string;
  /** 字体颜色 */
  fontColor?: string;
  /** 字号（px） */
  fontSize?: number;
  /** 用户备注 */
  remark?: string;
  /** 用户可扩展的键值对 */
  extra?: Record<string, unknown>;
}

// -------------------------------------------------------------------
//  2. 流程图节点（FlowNode）
// -------------------------------------------------------------------

/** 流程图节点形状枚举 */
export enum FlowNodeShape {
  /** 开始 / 结束（圆角矩形） */
  Terminal = 'flow-terminal',
  /** 处理步骤（矩形） */
  Process = 'flow-process',
  /** 判断 / 条件（菱形） */
  Decision = 'flow-decision',
  /** 输入/输出（平行四边形） */
  IO = 'flow-io',
  /** 子流程引用（带双竖线的矩形） */
  SubProcess = 'flow-subprocess',
}

/** 流程图节点的业务数据 */
export interface FlowNodeData extends BusinessData {
  shape: FlowNodeShape;
}

/**
 * 流程图节点 —— 对齐 X6 Node.Metadata
 * 用于 Graph.fromJSON / toJSON 的 nodes 数组
 */
export interface FlowNode extends Omit<Node.Metadata, 'data'> {
  id: string;
  shape: FlowNodeShape;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  data?: FlowNodeData;
}

// -------------------------------------------------------------------
//  3. 模块图节点（ModuleNode）
// -------------------------------------------------------------------

/** 模块图节点形状枚举 */
export enum ModuleNodeShape {
  /** 展示层 */
  Presentation = 'module-presentation',
  /** 业务逻辑层 */
  Business = 'module-business',
  /** 数据访问层 */
  DataAccess = 'module-data-access',
  /** 外部系统 / 第三方服务 */
  External = 'module-external',
  /** 数据库 */
  Database = 'module-database',
  /** 通用模块（矩形） */
  Generic = 'module-generic',
}

/** 模块图节点的业务数据 */
export interface ModuleNodeData extends BusinessData {
  shape: ModuleNodeShape;
  /** 所属层级索引，越小越靠上 */
  layerIndex?: number;
}

/**
 * 模块图节点 —— 对齐 X6 Node.Metadata
 */
export interface ModuleNode extends Omit<Node.Metadata, 'data'> {
  id: string;
  shape: ModuleNodeShape;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  data?: ModuleNodeData;
}

// -------------------------------------------------------------------
//  3b. 判别联合类型 —— 类型安全的节点联合
// -------------------------------------------------------------------

/** 通过 shape 字段进行类型收窄的判别联合 */
export type AnyNode = FlowNode | ModuleNode;

/** 类型守卫：判断是否为流程图节点 */
export function isFlowNode(node: AnyNode): node is FlowNode {
  return node.shape.startsWith('flow-');
}

/** 类型守卫：判断是否为模块图节点 */
export function isModuleNode(node: AnyNode): node is ModuleNode {
  return node.shape.startsWith('module-');
}

/** 获取节点的业务数据（类型安全） */
export function getNodeData(node: AnyNode): FlowNodeData | ModuleNodeData | undefined {
  return node.data;
}

// -------------------------------------------------------------------
//  4. 连线（GraphEdge）
// -------------------------------------------------------------------

/** 连线标签位置（相对于连线路径） */
export type EdgeLabelPosition = 'start' | 'middle' | 'end';

/** 连线业务数据 */
export interface EdgeData extends BusinessData {
  /** 连线上的文字标签 */
  label?: string;
  /** 标签位置 */
  labelPosition?: EdgeLabelPosition;
}

/**
 * 连线 —— 对齐 X6 Edge.Metadata
 * source / target 可以是节点 id，也可以是 { cell, port } 精确定位
 */
export type EdgeEndpoint = string | { cell: string; port?: string };

export interface GraphEdge extends Omit<Edge.Metadata, 'data' | 'source' | 'target'> {
  id: string;
  source: EdgeEndpoint;
  target: EdgeEndpoint;
  label?: string;
  data?: EdgeData;
}

// -------------------------------------------------------------------
//  5. 项目文件（ProjectFile）—— 完整的保存结构
// -------------------------------------------------------------------

/** 图的类型 */
export enum GraphType {
  /** 流程图 */
  Flow = 'flow',
  /** 模块图 */
  Module = 'module',
}

/**
 * 单张画布（Sheet），对应 X6 的一个 Graph 实例
 */
export interface GraphSheet {
  /** 画布唯一 id */
  id: string;
  /** 画布名称，如"系统登录流程" */
  name: string;
  /** 图类型 */
  type: GraphType;
  /** 节点列表 */
  nodes: AnyNode[];
  /** 连线列表 */
  edges: GraphEdge[];
}

/**
 * 项目文件 —— 顶层保存结构
 * 一个 .thesisflow 文件对应一个 ProjectFile
 */
export interface ProjectFile {
  /** 文件格式版本号，便于未来迁移 */
  version: string;
  /** 项目名称 */
  name: string;
  /** 最后编辑时间（ISO 8601） */
  updatedAt: string;
  /** 项目下的所有画布 */
  sheets: GraphSheet[];
}

// -------------------------------------------------------------------
//  6. X6 Graph 配置的泛型辅助
// -------------------------------------------------------------------

/**
 * X6 Graph.fromJSON() 所需的数据结构
 * 区分流程图和模块图的节点类型
 */
export interface FlowGraphJSON {
  nodes: FlowNode[];
  edges: GraphEdge[];
}

export interface ModuleGraphJSON {
  nodes: ModuleNode[];
  edges: GraphEdge[];
}
