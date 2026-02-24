/**
 * Diagram export utilities for BPMN diagrams.
 * Supports PNG (via Canvas API) and PDF (via jsPDF + svg2pdf.js).
 */

/** Convert a process title to a safe file name */
export function sanitizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

interface BpmnViewer {
  saveSVG: () => Promise<{ svg: string }>;
}

function parseSvgDimensions(svgString: string): {
  width: number;
  height: number;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgEl = doc.documentElement;

  // Try viewBox first
  const viewBox = svgEl.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }

  // Fall back to width/height attributes
  const w = parseFloat(svgEl.getAttribute("width") || "0");
  const h = parseFloat(svgEl.getAttribute("height") || "0");
  if (w > 0 && h > 0) {
    return { width: w, height: h };
  }

  return { width: 1920, height: 1080 };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Export the BPMN diagram as a high-resolution PNG (2x scale) */
export async function exportDiagramAsPng(
  viewer: unknown,
  title: string
): Promise<void> {
  const bpmnViewer = viewer as BpmnViewer;
  const { svg } = await bpmnViewer.saveSVG();
  const { width, height } = parseSvgDimensions(svg);

  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load SVG as image"));
    img.src = svgUrl;
  });

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(svgUrl);

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))),
      "image/png"
    );
  });

  triggerDownload(pngBlob, `${sanitizeTitle(title)}.png`);
}

export type PaperSize = "a0" | "a1" | "a2" | "a3" | "a4";

const PAPER_DIMENSIONS: Record<PaperSize, [number, number]> = {
  a0: [1189, 841],
  a1: [841, 594],
  a2: [594, 420],
  a3: [420, 297],
  a4: [297, 210],
};

/** Export the BPMN diagram as a vector PDF with selectable paper size (landscape) */
export async function exportDiagramAsPdf(
  viewer: unknown,
  title: string,
  paperSize: PaperSize
): Promise<void> {
  const bpmnViewer = viewer as BpmnViewer;
  const { svg } = await bpmnViewer.saveSVG();

  const { jsPDF } = await import("jspdf");
  const { svg2pdf } = await import("svg2pdf.js");

  const [pageWidth, pageHeight] = PAPER_DIMENSIONS[paperSize];
  const margin = 10;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pageWidth, pageHeight],
  });

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svg, "image/svg+xml");
  const svgElement = svgDoc.documentElement;

  const { width: svgW, height: svgH } = parseSvgDimensions(svg);

  const availW = pageWidth - margin * 2;
  const availH = pageHeight - margin * 2;
  const scale = Math.min(availW / svgW, availH / svgH);

  const renderedW = svgW * scale;
  const renderedH = svgH * scale;
  const offsetX = margin + (availW - renderedW) / 2;
  const offsetY = margin + (availH - renderedH) / 2;

  await svg2pdf(svgElement, pdf, {
    x: offsetX,
    y: offsetY,
    width: renderedW,
    height: renderedH,
  });

  pdf.save(`${sanitizeTitle(title)}.pdf`);
}
