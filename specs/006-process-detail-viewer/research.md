# Research: 006-process-detail-viewer

## R1: Side-by-Side Layout Pattern

**Decision**: Use a flexbox layout with the BPMN viewer as `flex-1` (taking remaining space) and the text summary as a fixed-width sidebar (`w-96` = 384px). On desktop (lg+), both display side by side. Below lg, switch to tabbed view.

**Rationale**: This pattern is already proven in the interview page (`src/app/[locale]/interview/[interviewId]/page.tsx`), where the chat area takes `flex-1` and the summary sidebar is `w-80`. For the process detail page, the diagram needs even more space, so using `flex-1` for the diagram and a slightly wider sidebar (`w-96`) for the documentation text provides the best balance.

**Alternatives considered**:
- CSS Grid with fixed percentages (70/30): Rejected — less flexible, doesn't adapt well to different viewport widths
- Resizable split pane: Rejected — adds complexity (new dependency) with marginal UX benefit for a read-only view
- Full-width diagram with overlay panel: Rejected — hides content behind a toggle, less useful for side-by-side comparison

---

## R2: BPMN Viewer Height Strategy

**Decision**: Set the BPMN viewer to fill available vertical space using `h-[calc(100vh-<header-offset>)]`. The header area (process title, metadata, back button) is approximately 8rem, so the content area becomes `h-[calc(100vh-10rem)]` to account for header + padding.

**Rationale**: The spec requires the diagram to "fill the available vertical space" (FR-008). A viewport-relative height ensures the diagram dominates the page without requiring scroll to see it. The `NavigatedViewer` from bpmn-js already supports pan/zoom, so a large fixed-height container works well.

**Alternatives considered**:
- Auto height based on diagram content: Rejected — bpmn-js requires explicit container dimensions; auto-height leads to rendering issues
- Fixed pixel height (e.g., 700px): Rejected — wastes space on large screens, overflows on small ones

---

## R3: Mobile Layout Strategy

**Decision**: Use the same state-based tab switching pattern from the interview page. On viewports below `lg` (1024px), show "Diagram" and "Documentation" tabs. Use CSS `hidden`/`block` to toggle visibility while keeping both components mounted (avoids re-rendering the BPMN viewer).

**Rationale**: The interview page already uses this exact pattern (`activeTab` state + `cn()` for conditional CSS classes). Reusing the same approach gives users a consistent experience and avoids introducing new UI patterns.

**Alternatives considered**:
- Vertical stack (diagram above text): Rejected — the diagram would need to be very short, defeating the purpose of a "big" viewer
- Radix Tabs component: Rejected — Radix TabsContent unmounts non-active content, which would destroy the BPMN viewer state

---

## R4: Handling Missing Content

**Decision**: When only one content type exists, show it at full width (no sidebar/tabs). When neither exists, show an empty state card with a message. The layout conditionally renders based on `hasBpmn` and `hasMarkdown` flags.

**Rationale**: Simple conditional rendering handles all 4 cases (both, BPMN only, markdown only, neither) without complex layout logic. This matches the current page's conditional card rendering approach.

---

## R5: i18n Keys Needed

**Decision**: Add new i18n keys for the tab labels and empty state.

**Keys needed**:
- `processes.tabDiagram`: "Diagram" / "Diagramm"
- `processes.tabDocumentation`: "Documentation" / "Dokumentation"
- `processes.noContent`: "This process has not been documented yet." / "Dieser Prozess wurde noch nicht dokumentiert."
