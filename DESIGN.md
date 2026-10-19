---
version: "alpha"
name: Roby Karti S. Portfolio
description: Personal portfolio and writing site for a fullstack developer in Pekanbaru, Indonesia. Quiet, editorial, monochrome with one green accent.
colors:
  background: "oklch(1 0.005 155)"
  foreground: "oklch(0.141 0.005 285.823)"
  card: "oklch(1 0.005 155)"
  card-foreground: "oklch(0.141 0.005 285.823)"
  primary: "oklch(0.21 0.006 285.885)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.967 0.001 286.375)"
  secondary-foreground: "oklch(0.21 0.006 285.885)"
  muted: "oklch(0.967 0.001 286.375)"
  muted-foreground: "oklch(0.552 0.016 285.938)"
  accent: "oklch(0.967 0.001 286.375)"
  accent-foreground: "oklch(0.21 0.006 285.885)"
  brand: "oklch(0.58 0.14 155)"
  brand-text: "oklch(0.44 0.13 155)"
  border: "oklch(0.92 0.004 286.32)"
  destructive: "oklch(0.577 0.245 27.325)"
  warning: "oklch(0.769 0.188 70.08)"
  available: "oklch(0.72 0.19 142)"
  notice: "oklch(0.62 0.19 296)"
typography:
  display:
    fontFamily: Bricolage Grotesque
    fontSize: 56px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.02em
  h1:
    fontFamily: Bricolage Grotesque
    fontSize: 56px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.02em
  h2:
    fontFamily: Bricolage Grotesque
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  h3:
    fontFamily: Bricolage Grotesque
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  body:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.75
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  code:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  pixel:
    fontFamily: Geist Pixel
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.2
rounded:
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
  2xl: 18px
  panel: 14px
  full: 9999px
spacing:
  "2xs": 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 40px
  gutter-sm: 24px
  gutter-md: 32px
  gutter-lg: 40px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 36px
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 36px
  button-ghost:
    backgroundColor: "{colors.background}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 36px
  badge-neutral:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.full}"
    padding: 8px
    height: 20px
  badge-positive:
    backgroundColor: "{colors.available}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: 8px
    height: 20px
  panel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.panel}"
    padding: 24px
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 36px
  link-inline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.brand-text}"
    typography: "{typography.body}"
---

## Overview

Quiet, editorial, and technical. The site reads like a well-set publication rather
than a marketing landing page: generous whitespace, near-monochrome surfaces, and a
single green accent used sparingly for links, focus, and live signals.

The visual identity is warm-neutral (a barely green-tinted white, not pure white) with
near-black ink. Personality comes from typography and small details — pixel-mono
labels, hand-drawn cover art, custom cursors — not from loud gradients or color blocks.
Dark mode is a first-class citizen, not an afterthought.

**Source of truth:** `src/app/global.css`. The tokens above mirror its light-mode
values; the `.dark` block redefines the same variables. If a value changes in CSS this
file must change with it, and vice versa.

## Colors

- **Background / Card:** warm near-white. Cards sit on the same tone and are separated
  by a hairline border rather than elevation.
- **Foreground / Primary:** near-black ink. `primary` is the solid action color for
  filled buttons; it inverts in dark mode (light chip with dark text).
- **Muted / Secondary:** low-contrast surfaces for chips, nested panels, and inactive
  states. `muted-foreground` is the canonical color for metadata and helper text.
- **Brand (green `oklch(0.58 0.14 155)`):** accent only. Use `brand-text` (darker) for
  text on light surfaces to keep contrast; `brand` itself is for rings, borders, and
  small marks.
- **Available / Notice / Warning / Destructive:** semantic status colors, always used
  as a tinted background (`/15`) with the matching readable foreground. Never use them
  as large fills.
- **Border:** light mode uses solid `oklch(0.92 0.004 286.32)`; dark mode uses
  translucent white (`oklch(1 0 0 / 10%)`). Never hardcode a gray — use the token.

Rules: no raw hex/rgb values in components. No gradients as decoration. Contrast must
meet WCAG AA in both themes; check `muted-foreground` on `background` before shipping.

## Typography

- **Display / headings:** Bricolage Grotesque, tight tracking, `leading-[1.1]`,
  optical sizing on. Headings use fluid `clamp()` sizes defined by the `Heading`
  component — do not override font size per page.
- **Body:** Manrope at 16px/1.75 for prose, 14px for UI labels.
- **Mono captions:** Geist Mono at 12px for dates, counts, paths, kbd hints, and
  eyebrow labels. This is the "instrument panel" voice of the site.
- **Pixel:** Geist Pixel, reserved for decorative labels and cover art. Never for body
  copy or anything that must be read at length.

Use the `Typography*` primitives (`TypographyH1`…`TypographyMuted`) instead of raw
`h1`/`p` tags. Uppercase is limited to short labels with wide tracking
(`tracking-mega`); never uppercase sentences.

## Layout

- Content is centered with a readable measure; prose stays near 65–75 characters per
  line. Full-bleed art and diagrams may exceed it.
- Page gutter is responsive via `--gutter`: 24px → 32px (≥40rem) → 40px (≥64rem).
  Use `px-gutter`, never ad-hoc horizontal padding.
- Vertical rhythm: 8px base. Common steps are 8 / 12 / 16 / 24 / 32 / 40. Sections are
  separated by whitespace and optional hairline dividers, not boxes.
- The header is a fixed 56px bar (`--header-height`) with a blurred backdrop; anchors
  must account for it via `scroll-margin-top`.
- Grids collapse to a single column below 640px. Cards use equal-height rows and
  clamp long titles rather than letting layout jump.

## Elevation & Depth

Depth is drawn with borders, not shadows. The default surface is flat: a 1px `border`
plus `bg-card`. Shadows are reserved for floating layers (popover, dropdown, dialog,
command palette, toast) and stay soft and low-opacity. A subtle top/bottom mask fade is
used on scrollable rails instead of hard cut-offs.

## Shapes

Radii come from `--radius` (10px base) with the Tailwind scale (`sm`…`4xl`). Panels use
`rounded-panel` (14px); chips and avatars use `rounded-full`; inputs and buttons use
`rounded-md` (8px). Do not mix radii within one component. Hairline borders use the
`line` token so they adapt to dark mode.

## Components

- **Button** (`src/components/ui/button.tsx`): variants `default`, `outline`,
  `secondary`, `ghost`, `link`, `muted`, `destructive`; sizes `xs`–`lg` plus icon
  sizes. Pick a variant and size — never restyle spacing, radius, typography, or color
  through `className`.
- **Badge**: pill-shaped, `text-xs` default and `tiny` for dense tables. Status
  variants (`positive`, `notice`, `warning`, `danger`, `neutral`) already encode the
  tint; do not add colors.
- **Typography**: `TypographyH1`–`H4`, `TypographyP`, `TypographyLead`,
  `TypographyMuted`, `TypographySmall`, `TypographyBlockquote`. Compose with layout
  classes only.
- **Panel/Card**: `bg-card` + `border` + `rounded-panel` + comfortable padding. Tables
  live inside a panel and use the shared `Table` primitives.
- **Input / Select / Textarea**: 36px control height, visible `ring` on focus, invalid
  state via `aria-invalid`. Labels are required; placeholders are not labels.
- **Command palette / dialogs**: centered floating layer with backdrop blur, keyboard
  first. Focus must be trapped and restored on close.

Lint enforces this: `shadcn/no-restyle` (only layout overrides allowed),
`shadcn/no-raw-colors`, and `shadcn/no-arbitrary-values` (layout/motion/effects only).
When a new visual need appears, add a variant to the component instead of bypassing it.

## Do's and Don'ts

**Do**

- Use design tokens (`bg-card`, `text-muted-foreground`, `border-line`) for every color.
- Keep one accent moment per screen: a link, a live dot, a focus ring.
- Design light and dark together; verify both before shipping.
- Use semantic HTML and visible focus states; every icon-only control needs an
  `aria-label`.
- Reach for the existing component variant first, then extend the component.
- Use `font-mono text-xs` for metadata, counts, and keyboard hints.

**Don't**

- Don't add new colors, gradients, or shadows outside the token set.
- Don't override typography, padding, gap, radius, or color on design-system
  components (Button, Badge, Input, Table cells, Typography).
- Don't use `!important`, inline styles, or arbitrary values for visual styling.
- Don't introduce a second accent hue; status colors are not decoration.
- Don't animate layout properties; animate `transform` and `opacity`, respect
  `prefers-reduced-motion`, and keep transitions under ~250ms with `ease-snappy`.
- Don't use pure black (`#000`) or pure white (`#fff`) for large surfaces.
