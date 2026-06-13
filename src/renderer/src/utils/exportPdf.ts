import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { getGraph } from './getGraph';

export async function exportPdf(projectName: string): Promise<boolean> {
  const graph = getGraph();
  if (!graph) return false;

  const api = window.thesisFlow;
  if (!api) return false;

  // Get SVG from graph
  const svgData = await (graph.exportSVG({
    backgroundColor: '#ffffff',
    padding: 20,
  } as any) as unknown as Promise<string>);

  // Parse SVG to get dimensions
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
  const svgEl = svgDoc.querySelector('svg');
  if (!svgEl) return false;

  const width = parseFloat(svgEl.getAttribute('width') || '800');
  const height = parseFloat(svgEl.getAttribute('height') || '600');

  // Create PDF with matching aspect ratio
  const isLandscape = width > height;
  // For landscape: page width = longer dimension, page height = shorter dimension
  const pageWidth = isLandscape ? 297 : 210; // A4 dimensions in mm
  const pageHeight = isLandscape ? 210 : 297;
  const scaleX = pageWidth / width;
  const scaleY = pageHeight / height;
  const scale = Math.min(scaleX, scaleY) * 0.9; // 0.9 for padding
  const contentWidth = width * scale;
  const contentHeight = height * scale;

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Embed SVG into PDF (centered on page)
  await pdf.svg(svgEl, {
    x: (pageWidth - contentWidth) / 2,
    y: (pageHeight - contentHeight) / 2,
    width: contentWidth,
    height: contentHeight,
  });

  // Get PDF as data URI
  const pdfData = pdf.output('datauristring');

  // Save via IPC
  return api.exportPdf(pdfData, projectName);
}
