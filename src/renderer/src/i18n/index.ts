import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Inline translations to avoid JSON import issues
const zh = {
  app: { name: 'ThesisFlow', untitled: '未命名项目' },
  toolbar: {
    new: '新建', open: '打开', save: '保存', recent: '最近',
    undo: '撤销', redo: '重做', copy: '复制', paste: '粘贴',
    autoLayout: '自动排版', exportPng: '导出 PNG', exportSvg: '导出 SVG',
    zoomIn: '放大', zoomOut: '缩小', zoomFit: '适应', zoomReset: '100%',
  },
  message: {
    created: '已创建新项目', saved: '项目已保存', undone: '已撤销',
    redone: '已重做', layoutDone: '排版完成', emptyCanvas: '画布为空，请先添加节点',
  },
};

const en = {
  app: { name: 'ThesisFlow', untitled: 'Untitled Project' },
  toolbar: {
    new: 'New', open: 'Open', save: 'Save', recent: 'Recent',
    undo: 'Undo', redo: 'Redo', copy: 'Copy', paste: 'Paste',
    autoLayout: 'Auto Layout', exportPng: 'Export PNG', exportSvg: 'Export SVG',
    zoomIn: 'Zoom In', zoomOut: 'Zoom Out', zoomFit: 'Fit', zoomReset: '100%',
  },
  message: {
    created: 'New project created', saved: 'Project saved', undone: 'Undone',
    redone: 'Redone', layoutDone: 'Layout complete', emptyCanvas: 'Canvas is empty',
  },
};

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: localStorage.getItem('thesisflow-lang') || 'zh',
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
