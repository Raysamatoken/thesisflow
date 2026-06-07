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
  openProject(): Promise<ProjectFile | null> {
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

  // ---- 最近文件 ----

  /** 获取最近文件列表 */
  getRecentFiles(): Promise<string[]> {
    return ipcRenderer.invoke('get-recent-files');
  },

  /** 清空最近文件列表 */
  clearRecentFiles(): Promise<void> {
    return ipcRenderer.invoke('clear-recent-files');
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

  // ---- 菜单事件监听 ----

  onMenuNewProject(callback: () => void): () => void {
    const listener = () => callback();
    ipcRenderer.on('menu:new-project', listener);
    return () => ipcRenderer.removeListener('menu:new-project', listener);
  },
  onMenuOpenProject(callback: () => void): () => void {
    const listener = () => callback();
    ipcRenderer.on('menu:open-project', listener);
    return () => ipcRenderer.removeListener('menu:open-project', listener);
  },
  onMenuSaveProject(callback: () => void): () => void {
    const listener = () => callback();
    ipcRenderer.on('menu:save-project', listener);
    return () => ipcRenderer.removeListener('menu:save-project', listener);
  },
  onMenuExportImage(callback: (format: 'png' | 'svg') => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, format: 'png' | 'svg') => callback(format);
    ipcRenderer.on('menu:export-image', listener);
    return () => ipcRenderer.removeListener('menu:export-image', listener);
  },

  // ---- 自动保存 ----

  /** 监听自动保存触发事件 */
  onAutoSave(callback: () => void): () => void {
    const listener = () => callback();
    ipcRenderer.on('auto-save-trigger', listener);
    return () => ipcRenderer.removeListener('auto-save-trigger', listener);
  },
};

contextBridge.exposeInMainWorld('thesisFlow', thesisFlowApi);
