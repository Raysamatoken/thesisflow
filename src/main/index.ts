// =====================================================================
// ThesisFlow - Electron main process entry
// =====================================================================

import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { ProjectFile } from '../shared/types';
import { GraphType } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let autoSaveTimer: ReturnType<typeof setInterval> | null = null;
const RECENT_FILES_MAX = 10;
const RECENT_FILES_PATH = path.join(app.getPath('userData'), 'recent-files.json');

// Recent files management
async function loadRecentFiles(): Promise<string[]> {
  try {
    const content = await fs.readFile(RECENT_FILES_PATH, 'utf-8');
    return JSON.parse(content) as string[];
  } catch {
    return [];
  }
}

async function saveRecentFiles(files: string[]): Promise<void> {
  await fs.writeFile(RECENT_FILES_PATH, JSON.stringify(files, null, 2), 'utf-8');
}

async function addRecentFile(filePath: string): Promise<void> {
  const recent = await loadRecentFiles();
  const filtered = recent.filter(f => f !== filePath);
  filtered.unshift(filePath);
  await saveRecentFiles(filtered.slice(0, RECENT_FILES_MAX));
}

function clearAutoSaveTimer(): void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
}

function startAutoSaveTimer(): void {
  clearAutoSaveTimer();
  // Auto-save every 30 seconds if dirty
  autoSaveTimer = setInterval(() => {
    if (mainWindow) {
      mainWindow.webContents.send('auto-save-trigger');
    }
  }, 30000);
}

function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'ThesisFlow',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    clearAutoSaveTimer();
  });

  // Start auto-save timer after window loads
  mainWindow.webContents.on('did-finish-load', () => {
    startAutoSaveTimer();
  });

  return mainWindow;
}

function registerIpcHandlers(): void {
  ipcMain.handle('create-project', (): ProjectFile => {
    return {
      version: '1.0.0',
      name: '未命名项目',
      updatedAt: new Date().toISOString(),
      sheets: [
        {
          id: `sheet-${Date.now()}`,
          name: '流程图 1',
          type: GraphType.Flow,
          nodes: [],
          edges: [],
        },
      ],
    };
  });

  ipcMain.handle('open-project', async () => {
    if (!mainWindow) return null;
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: '打开项目',
        filters: [{ name: 'ThesisFlow 项目', extensions: ['thesisflow'] }],
        properties: ['openFile'],
      });
      if (result.canceled || result.filePaths.length === 0) return null;
      const filePath = result.filePaths[0];
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content) as ProjectFile;
      if (!parsed.version || !Array.isArray(parsed.sheets)) {
        dialog.showErrorBox('文件格式错误', '所选文件不是有效的 ThesisFlow 项目文件。');
        return null;
      }
      await addRecentFile(filePath);
      return { project: parsed, filePath };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      dialog.showErrorBox('打开失败', `无法读取项目文件：${msg}`);
      return null;
    }
  });

  ipcMain.handle(
    'save-project',
    async (_event, data: ProjectFile, filePath?: string): Promise<string | null> => {
      if (!mainWindow) return null;
      try {
        let targetPath = filePath;
        if (!targetPath) {
          const result = await dialog.showSaveDialog(mainWindow, {
            title: '保存项目',
            filters: [{ name: 'ThesisFlow 项目', extensions: ['thesisflow'] }],
            defaultPath: `${data.name}.thesisflow`,
          });
          if (result.canceled || !result.filePath) return null;
          targetPath = result.filePath;
        }
        await fs.writeFile(targetPath, JSON.stringify(data, null, 2), 'utf-8');
        await addRecentFile(targetPath);
        return targetPath;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        dialog.showErrorBox('保存失败', `无法写入项目文件：${msg}`);
        return null;
      }
    }
  );

  ipcMain.handle(
    'export-image',
    async (_event, imageData: string, format: 'png' | 'svg'): Promise<boolean> => {
      if (!mainWindow) return false;
      try {
        const result = await dialog.showSaveDialog(mainWindow, {
          title: '导出图片',
          filters: [
            format === 'png'
              ? { name: 'PNG 图片', extensions: ['png'] }
              : { name: 'SVG 矢量图', extensions: ['svg'] },
          ],
          defaultPath: `export.${format}`,
        });
        if (result.canceled || !result.filePath) return false;
        if (format === 'png') {
          const base64 = imageData.replace(/^data:image\/\w+;base64/, '');
          await fs.writeFile(result.filePath, Buffer.from(base64, 'base64'));
        } else {
          await fs.writeFile(result.filePath, imageData, 'utf-8');
        }
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        dialog.showErrorBox('导出失败', msg);
        return false;
      }
    }
  );

  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.close());

  // Recent files
  ipcMain.handle('get-recent-files', async (): Promise<string[]> => {
    return loadRecentFiles();
  });

  ipcMain.handle('clear-recent-files', async (): Promise<void> => {
    await saveRecentFiles([]);
  });

  // Export PDF
  ipcMain.handle(
    'export-pdf',
    async (_event, svgData: string, projectName: string): Promise<boolean> => {
      if (!mainWindow) return false;
      try {
        const result = await dialog.showSaveDialog(mainWindow, {
          title: '导出 PDF',
          filters: [{ name: 'PDF 文件', extensions: ['pdf'] }],
          defaultPath: `${projectName || 'export'}.pdf`,
        });
        if (result.canceled || !result.filePath) return false;
        // PDF export is handled in renderer using jspdf
        // This handler just provides the save dialog
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        dialog.showErrorBox('导出失败', msg);
        return false;
      }
    }
  );
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerIpcHandlers();
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
