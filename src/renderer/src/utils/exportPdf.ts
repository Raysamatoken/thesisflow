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

  // Create PDF with matching aspect ratio (A4 width, proportional height)
  const pdfWidth = 210; // A4 width in mm
  const pdfHeight = (height / width) * pdfWidth;
  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfWidth, Math.max(pdfHeight, 100)],
  });

  // Embed SVG into PDF
  await pdf.svg(svgEl, {
    x: 0,
    y: 0,
    width: pdfWidth,
    height: pdfHeight,
  });

  // Get PDF as data URI
  const pdfData = pdf.output('datauristring');

  // Save via IPC
  return api.exportPdf(pdfData, projectName);
}
