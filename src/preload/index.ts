// =====================================================================
// ThesisFlow - Preload 脚本
// 通过 contextBridge 安全地暴露 IPC API 到渲染进程
// =====================================================================

import { contextBridge, ipcRenderer } from 'electron';
import type { ProjectFile } from '../shared/types';

const thesisFlowApi = {
  // ---- 文件操作 ----

  /** 新建项目，返回默认 ProjectFile */
  createProject(): Promise<ProjectFile> {
    return ipcRenderer.invoke('create-project');
  },

  /** 打开 .thesisflow 文件 */
  openProject(): Promise<{ project: ProjectFile; filePath: string } | null> {
    return ipcRenderer.invoke('open-project');
  },

  /**
   * 保存项目
   * @param data    项目数据
   * @param filePath 已知路径时直接写入；省略则弹出系统对话框
   * @returns 写入路径或 null
   */
  saveProject(data: ProjectFile, filePath?: string): Promise<string | null> {
    return ipcRenderer.invoke('save-project', data, filePath);
  },

  /** 导出为图片 */
  exportImage(imageData: string, format: 'png' | 'svg'): Promise<boolean> {
    return ipcRenderer.invoke('export-image', imageData, format);
  },

  /** 导出为 PDF */
  exportPdf(pdfData: string, projectName: string): Promise<boolean> {
    return ipcRenderer.invoke('export-pdf', pdfData, projectName);
  },

  // ---- 最近文件 ----

  /** 获取最近文件列表 */
  getRecentFiles(): Promise<string[]> {
    return ipcRenderer.invoke('get-recent-files');
  },

  /** 清空最近文件列表 */
  clearRecentFiles(): Promise<void> {
    return ipcRenderer.invoke('clear-recent-files');
  },

  /** 通过绝对路径打开项目文件（用于最近文件） */
  openFileByPath(filePath: string): Promise<{ project: ProjectFile; filePath: string } | null> {
    return ipcRenderer.invoke('open-file-by-path', filePath);
  },

  // ---- 窗口控制 ----

  minimize(): void {
    ipcRenderer.send('window:minimize');
  },
  maximize(): void {
    ipcRenderer.send('window:maximize');
  },
  close(): void {
    ipcRenderer.send('window:close');
  },

  // ---- 自动保存 ----

  /** 监听自动保存触发事件 */
  onAutoSave(callback: () => void): () => void {
    const listener = () => callback();
    ipcRenderer.on('auto-save-trigger', listener);
    return () => ipcRenderer.removeListener('auto-save-trigger', listener);
  },

  // ---- 关闭前未保存确认 ----

  /** 监听关闭前未保存检查事件 */
  onCheckUnsavedBeforeClose(callback: () => void): () => void {
    const listener = () => callback();
    ipcRenderer.on('check-unsaved-before-close', listener);
    return () => ipcRenderer.removeListener('check-unsaved-before-close', listener);
  },

  /** 通知主进程可以关闭窗口 */
  confirmClose(): void {
    ipcRenderer.send('confirm-close');
  },
};

contextBridge.exposeInMainWorld('thesisFlow', thesisFlowApi);
