# Research: 007-diagram-export

## R1: SVG Extraction from bpmn-js

**Decision**: Use `viewer.saveSVG()` — a built-in async method on all bpmn-js viewer instances (Viewer, NavigatedViewer, Modeler) that returns a complete standalone SVG XML string.

**Rationale**: This is the official API. The SVG output uses `<tspan>` for labels (not foreignObject), uses the system font `Arial, sans-serif`, and includes proper `xmlns` attributes. No CORS issues since the SVG is generated locally.

**Alternatives considered**:
- `canvas.toDataURL()` on the bpmn-js canvas: Rejected — the bpmn-js `canvas` is NOT an HTML5 canvas element
- Screenshot/html2canvas: Rejected — captures DOM, not SVG; wrong tool for the job

---

## R2: SVG to PNG Conversion

**Decision**: Use the native Canvas API with no additional library. Create a Blob URL from the SVG string, load it as an Image, draw onto a Canvas at 2x scale, then export via `canvas.toBlob('image/png')`.

**Rationale**: bpmn-js SVG is clean (no foreignObject, no external fonts, no external images), so the pure canvas approach works reliably across all modern browsers. Zero dependency cost.

**Alternatives considered**:
- canvg (4.0.3): Rejected — adds ~200KB for no benefit since native approach works with bpmn-js SVG
- html2canvas: Rejected — designed for HTML DOM capture, not SVG string conversion

---

## R3: SVG to PDF with Paper Sizes

**Decision**: Use `jsPDF` + `svg2pdf.js`. jsPDF creates the PDF document with paper size/orientation. svg2pdf.js is a jsPDF plugin that converts SVG elements to native PDF vector drawing commands.

**Rationale**: This is the standard client-side SVG-to-PDF solution. Produces vector PDFs (not rasterized), supports all A-series paper sizes natively (`'a0'` through `'a10'`), and runs entirely in the browser. svg2pdf.js is maintained by yWorks (diagramming experts). Combined size is ~300KB.

**Alternatives considered**:
- pdf-lib: Rejected — no built-in SVG rendering; would require rasterizing to PNG first, losing vector quality
- Puppeteer/server-side: Rejected — spec requires client-side only; adds server dependency

---

## R4: Exposing the Viewer for Export

**Decision**: Use a callback prop `onViewerReady?: (viewer) => void` so the parent page can hold a reference to the viewer instance and call `saveSVG()` when export is triggered.

**Rationale**: Minimal change to the existing BpmnViewer component. The parent page already has the process title for file naming. Adding a callback prop avoids complex forwardRef/useImperativeHandle patterns and keeps the component simple.

**Alternatives considered**:
- forwardRef + useImperativeHandle: Rejected — more complex, exposes internal API surface
- Headless/offscreen viewer for export: Rejected — wasteful to create a second viewer when one already has the XML loaded
- Store viewer in module-level ref: Rejected — fragile, doesn't work with multiple viewers

---

## R5: i18n Keys Needed

**Decision**: Add new i18n keys for the export UI.

**Keys needed**:
- `processes.export`: "Export" / "Exportieren"
- `processes.exportPng`: "Export as PNG" / "Als PNG exportieren"
- `processes.exportPdf`: "Export as PDF" / "Als PDF exportieren"
- `processes.exportPaperSize`: "Paper Size" / "Papierformat"
- `processes.exporting`: "Exporting..." / "Wird exportiert..."
- `processes.exportError`: "Export failed. Please try again." / "Export fehlgeschlagen. Bitte erneut versuchen."
