# Data Model: 005-brand-design-polish

## Overview

This feature involves no database schema changes. All changes are CSS theme tokens, component styling, and UI behavior.

## Affected Entities

None. No new tables, columns, or relationships.

## Theme Token Changes

The following CSS custom properties in `src/app/globals.css` will be updated:

### Light Mode (`:root`)

| Token | Current Value | New Value | Purpose |
|-------|--------------|-----------|---------|
| `--primary` | `oklch(0.205 0 0)` (black) | `oklch(0.623 0.173 245.28)` (cyan-blue #0693e3) | Brand accent for buttons, links, focus rings |
| `--primary-foreground` | `oklch(0.985 0 0)` (white) | `oklch(1 0 0)` (white) | Text on primary-colored elements |
| `--ring` | `oklch(0.708 0 0)` (gray) | `oklch(0.623 0.173 245.28)` (cyan-blue) | Focus ring color |

### Dark Mode (`.dark`)

| Token | Current Value | New Value | Purpose |
|-------|--------------|-----------|---------|
| `--primary` | `oklch(0.922 0 0)` (light gray) | `oklch(0.68 0.173 245.28)` (lighter cyan-blue) | Brand accent preserved in dark mode |
| `--primary-foreground` | `oklch(0.205 0 0)` (dark) | `oklch(1 0 0)` (white) | Text on primary buttons in dark mode |
| `--ring` | `oklch(0.556 0 0)` (gray) | `oklch(0.68 0.173 245.28)` (cyan-blue) | Focus ring in dark mode |
