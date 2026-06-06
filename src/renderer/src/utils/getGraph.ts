// =====================================================================
// ThesisFlow - getGraph 工具函数
// 从 DOM 获取 GraphCanvas 暴露的 X6 Graph 实例
// =====================================================================

import type { Graph } from '@antv/x6';

/**
 * 获取当前画布的 X6 Graph 实例
 * GraphCanvas 组件在挂载时将实例挂到 #graph-container 的 __graph__ 属性上
 */
export function getGraph(): Graph | null {
  const el = document.getElementById('graph-container');
  if (!el) return null;
  return (el as any).__graph__ ?? null;
}
