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
  openProject(): Promise<{ project: ProjectFile; filePath: string } | null>;
  /**
   * 保存项目
   * @param filePath 已知路径时直接写入；省略则弹出系统对话框
   * @returns 写入路径或 null
   */
  saveProject(data: ProjectFile, filePath?: string): Promise<string | null>;
  /** 导出为图片（PNG / SVG） */
  exportImage(data: string, format: 'png' | 'svg'): Promise<boolean>;
  /** 导出为 PDF */
  exportPdf(pdfData: string, projectName: string): Promise<boolean>;

  // ---- 最近文件 ----
  /** 获取最近文件列表 */
  getRecentFiles(): Promise<string[]>;
  /** 清空最近文件列表 */
  clearRecentFiles(): Promise<void>;
  /** 通过绝对路径打开项目文件（用于最近文件） */
  openFileByPath(filePath: string): Promise<{ project: ProjectFile; filePath: string } | null>;

  // ---- 窗口操作 ----
  minimize(): void;
  maximize(): void;
  close(): void;

  // ---- 自动保存 ----
  /** 监听自动保存触发事件 */
  onAutoSave(callback: () => void): () => void;

  // ---- 关闭前未保存确认 ----
  /** 监听关闭前未保存检查事件 */
  onCheckUnsavedBeforeClose(callback: () => void): () => void;
  /** 通知主进程可以关闭窗口 */
  confirmClose(): void;
}

declare global {
  interface Window {
    thesisFlow: ThesisFlowAPI;
  }
}
