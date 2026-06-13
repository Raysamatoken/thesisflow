import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron APIs
Object.defineProperty(window, 'thesisFlow', {
  value: {
    createProject: vi.fn(),
    openProject: vi.fn(),
    saveProject: vi.fn(),
    exportImage: vi.fn(),
    exportPdf: vi.fn(),
    getRecentFiles: vi.fn(),
    clearRecentFiles: vi.fn(),
    openFileByPath: vi.fn(),
    onAutoSave: vi.fn(),
    onCheckUnsavedBeforeClose: vi.fn(),
    confirmClose: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
});
