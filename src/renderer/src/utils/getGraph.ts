// =====================================================================
// ThesisFlow - getGraph 工具函数
// 通过 React Context 或 DOM 获取 X6 Graph 实例
// 优先使用 Context，降级使用 DOM 属性
// =====================================================================

import type { Graph } from '@antv/x6';

/**
 * 获取当前画布的 X6 Graph 实例
 * 优先从 React Context 获取，降级从 DOM 属性获取
 */
export function getGraph(): Graph | null {
  const el = document.getElementById('graph-container');
  if (!el) return null;
  return (el as any).__graph__ ?? null;
}