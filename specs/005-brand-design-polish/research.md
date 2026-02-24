# Research: 005-brand-design-polish

## R1: Brand Color Mapping to OKLch Theme System

**Decision**: Map Eggers & Partner brand colors to the existing OKLch CSS custom properties system in `globals.css`.

**Rationale**: The project uses Tailwind CSS v4 with shadcn/ui's OKLch-based theme variables. All color changes flow through CSS custom properties (e.g., `--primary`, `--accent`), meaning a single file edit to `globals.css` updates the entire application. No per-component changes needed for color adoption.

**Color mapping** (hex → OKLch):
- Brand primary accent (#0693e3, cyan-blue): `oklch(0.623 0.173 245.28)` → maps to `--primary` (light mode)
- Brand text (#212121, dark charcoal): `oklch(0.205 0 0)` — already the current `--primary` value in light mode, close to current `--foreground` (`oklch(0.145 0 0)`)
- Brand background (#ffffff, white): `oklch(1 0 0)` — already the current `--background`
- Brand secondary gray (#abb8c3, cyan-bluish-gray): `oklch(0.764 0.019 224.97)` — maps to muted/secondary tones

**Key change**: Current `--primary` is pure dark charcoal (achromatic). Shifting `--primary` to the cyan-blue accent makes all primary buttons, links, and interactive elements adopt the brand accent automatically. The `--foreground` stays dark charcoal for text.

**Alternatives considered**:
- Per-component color overrides: Rejected — would be fragile and miss new components
- New custom CSS classes: Rejected — duplicates the existing theme system
- Keep primary dark + add custom accent variable: Rejected — would require touching many components that use `text-primary` or `bg-primary`

---

## R2: Button Border Radius (Pill Shape)

**Decision**: Increase the base `--radius` CSS custom property from `0.625rem` to `9999px` would make everything pill-shaped (inputs too). Instead, override button-specific border-radius in `button.tsx` to use `rounded-full` for default and destructive variants only. Keep `rounded-md` for outline, ghost, and secondary variants to maintain form consistency.

**Rationale**: The Eggers & Partner website uses `border-radius: 9999px` on CTA buttons, but not on all elements. Increasing the global `--radius` would affect inputs, cards, and other components undesirably. Targeted button changes match the website pattern.

**Alternatives considered**:
- Global `--radius: 9999px`: Rejected — affects all components (inputs, cards, dropdowns)
- Global `--radius: 1rem`: Rejected — more rounded globally but doesn't match the pill-shaped CTA style
- All buttons pill-shaped: Rejected — outline/ghost buttons on the website are not pill-shaped

---

## R3: BPMN Diagram Regeneration Behavior

**Decision**: The current `handleGenerateBpmn` function in `summary-panel.tsx` already reads from the `summary` prop directly (not cached). The diagram regeneration works correctly — each click calls `generateBpmnXml(summary)` with the latest prop value. The main improvement needed: add a loading state and error display in the UI, and ensure the button is clearly re-clickable after the first generation.

**Rationale**: Reviewing the code at `summary-panel.tsx:47-56`, `handleGenerateBpmn` reads `summary` from the closure which always reflects the latest prop. The function is synchronous (no async/await), so it's effectively instant. The improvement is UX: show that clicking again will regenerate, and handle error states visually.

**Alternatives considered**:
- Add explicit "stale" tracking (compare summary hash): Rejected — over-engineering since the function already reads the current prop
- Auto-regenerate on summary change: Rejected — spec explicitly wants on-demand via button click
- Make generation async with loading spinner: The function is synchronous (~instant), so a loading spinner is unnecessary. Keep it simple.

---

## R4: Typography Approach

**Decision**: Keep the current Geist font family. Geist is a clean, modern sans-serif that aligns well with the Eggers & Partner website's system sans-serif aesthetic. No font change needed.

**Rationale**: The company website uses a system sans-serif stack. Geist is a professional sans-serif that matches this tone. Switching to a system font stack would lose the consistent cross-platform rendering that Geist provides. The spec asks for "consistent with the company website" — the _tone_ matches (clean, professional sans-serif), not a pixel-perfect font match.

**Alternatives considered**:
- Switch to system font stack: Rejected — would look different across OS, losing consistency
- Import a specific branded font: Rejected — spec says "no custom font licensing"
- Use Inter or similar: Rejected — Geist is already excellent and already installed

---

## R5: Dark Mode Brand Adaptation

**Decision**: In dark mode, keep `--primary` as the cyan-blue accent color (same hue, slightly adjusted lightness for dark backgrounds). Keep `--foreground` as light text on dark backgrounds. The brand accent (#0693e3) is already high-contrast enough for dark backgrounds.

**Rationale**: The cyan-blue accent at `oklch(0.623 0.173 245.28)` has sufficient contrast against dark backgrounds (passes WCAG AA). For dark mode, the primary color can remain the same or be slightly lightened for better visibility.

**Alternatives considered**:
- Different accent color for dark mode: Rejected — brand consistency requires same accent
- Desaturated accent for dark mode: Rejected — the cyan-blue already works well on dark backgrounds
