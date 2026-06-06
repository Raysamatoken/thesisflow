// =====================================================================
// ThesisFlow - IPC 通信类型定义
// 定义 main ↔ renderer 的所有通信接口
// =====================================================================

import type { ProjectFile } from './types';

/** 从主进程暴露到渲染进程的 API */
export interface ThesisFlowAPI {
  // ---- 文件操作 ----
  /** 新建项目，返回默认 ProjectFile */
  createProject(): Promise<ProjectFile>;
  /** 打开 .thesisflow 文件 */
  openProject(): Promise<ProjectFile | null>;
  /**
   * 保存项目
   * @param filePath 已知路径时直接写入；省略则弹出系统对话框
   * @returns 写入路径或 null
   */
  saveProject(data: ProjectFile, filePath?: string): Promise<string | null>;
  /** 导出为图片（PNG / SVG） */
  exportImage(data: string, format: 'png' | 'svg'): Promise<boolean>;

  // ---- 窗口操作 ----
  minimize(): void;
  maximize(): void;
  close(): void;

  // ---- 菜单事件监听 ----
  onMenuNewProject(callback: () => void): () => void;
  onMenuOpenProject(callback: () => void): () => void;
  onMenuSaveProject(callback: () => void): () => void;
  onMenuExportImage(callback: (format: 'png' | 'svg') => void): () => void;
}

declare global {
  interface Window {
    thesisFlow: ThesisFlowAPI;
  }
}
