---
name: Where to Live
description: Dark product landing whose hero is the real app at work; one blue voice, green only where something fits.
colors:
  ground: "#0a0d12"
  ground-raised: "#10141b"
  ground-soft: "#161b22"
  ink: "#e6edf3"
  ink-strong: "#ffffff"
  ink-soft: "#b4bcc6"
  ink-muted: "#9198a1"
  hairline: "#262c36"
  hairline-strong: "#3a424e"
  signal-blue: "#4493f8"
  signal-blue-hover: "#6aa8fa"
  signal-blue-ink: "#051226"
  fits-green: "#57c26b"
  error-coral: "#f47067"
typography:
  display:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.6rem, 1.4rem + 5.2vw, 5rem)"
    fontWeight: 560
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.2rem + 2.6vw, 3.25rem)"
    fontWeight: 560
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 540
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1rem + 0.3vw, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "'ss01', 'cv11'"
  label:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  field: "12px"
  md: "14px"
  lg: "22px"
  pill: "999px"
spacing:
  gutter: "clamp(20px, 5vw, 40px)"
  wrap: "1180px"
  section: "clamp(80px, 12vw, 152px)"
  column-gap: "clamp(40px, 6vw, 96px)"
  heading-to-lead: "24px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.signal-blue-ink}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.signal-blue-hover}"
    textColor: "{colors.signal-blue-ink}"
  button-primary-sm:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.signal-blue-ink}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "40px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "48px"
  button-quiet-hover:
    textColor: "{colors.signal-blue-hover}"
  input-field:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.field}"
    padding: "0 16px"
    height: "52px"
  layer-tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  layer-tab-selected:
    backgroundColor: "{colors.ink-strong}"
    textColor: "{colors.ground}"
  status-pill:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  card:
    backgroundColor: "{colors.ground-raised}"
    rounded: "{rounded.lg}"
    padding: "clamp(24px, 4vw, 40px)"
---

# Design System: Where to Live

## Overview

**Creative North Star: "The App, Shown Working"**

The category standard for a modern dark product landing, played straight. The ground is the app's own near-black dark theme, so the landing and the Luxembourg demo read as one product. The hero is the real demo screenshot in a hairline browser frame, rising into the fold over a soft green-blue glow; everything else is quiet type on dark ground, hairline rules and pill controls.

Density is generous at the top (centred hero, wide section padding) and tighter in the evidence sections (city grid, sources table), where hairline grids carry structure instead of cards. Colour is almost entirely neutral; one blue speaks for every action, and green appears only where it means "fits" or "live", exactly as it does on the app's zone map.

Rejected by the build: fake device mockups, stock photography, invented stats, eyebrows above headings, icon chips.

**Key Characteristics:**
- Near-black tonal layering (ground, raised, soft) instead of coloured surfaces.
- One accent, Signal Blue, for every action and link.
- Fits Green carries meaning, never decoration.
- Geist Variable throughout, tight negative tracking on headings.
- Pill-shaped interactive controls; 22px-radius frames for screenshots and the form card.
- Hairline grids (1px rules) for lists, tables and the city grid.

## Colors

A near-black, GitHub-dark family of neutrals with a single blue voice and a semantic green.

### Primary
- **Signal Blue** (signal-blue): primary buttons, links, focus outlines, checked checkbox, input focus ring, caret, text selection tint. Hover lifts to **Signal Blue Hover**; text on blue fills is **Signal Blue Ink**, a near-black navy, never white.

### Secondary
- **Fits Green** (fits-green): the app's "this zone fits" colour. Used for the live status dot, the "Demo live" pill and its city cell tint, the success check, and the green half of the hero glow. Nothing else.

### Neutral
- **Ground** (ground): page background, input fill, text on the selected layer tab. Also the browser `theme-color`.
- **Ground Raised** (ground-raised): screenshot frames, form card, the sources band, the iOS row in the city grid, the privacy table of contents.
- **Ground Soft** (ground-soft): third tonal step; frame halo ring, wordmark tile, select options, inline code.
- **Ink** (ink): default body text.
- **Ink Strong** (ink-strong): headings, strong runs, quiet-button text, selected tab fill.
- **Ink Soft** (ink-soft): hero sub and long-form privacy prose; a step brighter than muted where reading length demands it.
- **Ink Muted** (ink-muted): leads, secondary nav, captions, table cells, footer.
- **Hairline** (hairline): 1px rules for lists, tables, grids, section bands, footer.
- **Hairline Strong** (hairline-strong): borders of frames, cards, inputs, pills, the tab dock; frame-bar dots; scrollbar thumb.
- **Error Coral** (error-coral): field errors and invalid borders only.

### Named Rules
**The One Voice Rule.** Signal Blue is the only colour that means "act". If something is clickable and primary, it is blue; nothing decorative is blue except the hero glow.

**The Green Means Fits Rule.** Fits Green is reserved for "fits", "live" and "done". Never use it as a second brand accent.

## Typography

**Display Font:** Geist Variable (with ui-sans-serif, system-ui, -apple-system, Segoe UI)
**Body Font:** Geist Variable, same stack, with stylistic sets `ss01` and `cv11` on.

**Character:** One variable sans at fractional weights (520 to 600). Headings are tight (-0.035em to -0.04em, line-height 1 to 1.05) and balanced; body is relaxed at 1.6.

### Hierarchy
- **Display** (560, clamp 2.6rem to 5rem, 1): the hero H1 only, max 14ch, centred.
- **Headline** (560, clamp 2rem to 3.25rem, 1.05): section H2s; always followed by a muted lead 24px below.
- **Title** (540, 1.375rem, -0.025em): city names; privacy H2s use 1.5rem at the same tracking.
- **Lead** (400, clamp 1.0625rem to 1.1875rem): muted paragraph under each headline, max 62ch.
- **Body** (400, 1.0625rem, 1.6): default text; long prose capped at 72ch.
- **Label** (400, 0.875rem): captions, sources, status line, errors. Fine print and pills step down to 0.8125rem. Form labels are 0.9375rem at 520.

### Named Rules
**The Heading Stands Alone Rule.** Headings carry no eyebrow, kicker or icon chip above them. A heading is followed by its lead, nothing precedes it.

## Layout

A single centred wrap (1180px content, fluid gutter of 20 to 40px). Sections breathe with fluid vertical padding (80px to 152px). The hero is centred; every later section is a two-column split (roughly 1.1fr / 0.9fr, gap 40 to 96px) with copy on one side and evidence (screenshot, table, form card) on the other. The city list is a 4-column hairline grid with a full-width iOS row.

Responsive: at 960px all splits stack and the city grid drops to 2 columns; at 640px it drops to 1, the hero frame narrows to 400px with the mobile screenshot, and the layer tabs become a 5-column grid of stacked icon-over-label buttons. The header hides section links below 760px and the demo link below 440px, keeping the Join button.

## Elevation & Depth

Depth comes mostly from tonal layering (ground to raised to soft) and hairline borders. Shadows are soft, long and dark, used only to lift the hero frame, the panel screenshot, the form card and the floating tab dock off the ground. No hard or offset shadows.

### Shadow Vocabulary
- **Frame lift** (`box-shadow: 0 40px 80px -30px rgb(0 0 0 / 0.75), 0 0 0 6px color-mix(in srgb, var(--bg-soft) 60%, transparent)`): the hero screenshot frame, with a soft halo ring.
- **Card lift** (`box-shadow: 0 40px 80px -40px rgb(0 0 0 / 0.9)`): panel screenshot and form card.
- **Dock lift** (`box-shadow: 0 16px 40px -16px rgb(0 0 0 / 0.8)`): the layer-tab dock, with a 12px backdrop blur.
- **Focus ring** (`box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent)`): inputs on focus. Status dots use the same 4px ring in green.

### Named Rules
**The Glow Once Rule.** The blurred green-blue radial glow lives behind the hero screenshot only. It is the page's single atmospheric effect.

## Shapes

Two families: everything you press is a full pill (999px); everything that holds content is a soft rounded rectangle (22px for frames and cards, 14px for the inner screenshot and minor panels, 12px for inputs, 6px for checkboxes, code and focus outlines). Borders are always 1px. Lists, tables and the city grid use straight hairlines with no radius at all.

## Components

### Buttons
Calm and confident pills.
- **Shape:** full pill (999px), min height 48px (40px small, 54px for the form submit).
- **Primary:** Signal Blue fill, Signal Blue Ink text, weight 560, 0 24px padding.
- **Hover / Focus:** fill lifts to Signal Blue Hover over 0.2s on the out-expo ease; press nudges down 1px; focus shows a 2px blue outline offset 3px.
- **Quiet:** transparent, Ink Strong text, hover to blue; inline links use it with zero padding and blue text.
- **Arrow disc:** a trailing 22px circle tinted 14% of current colour holding an arrow or external icon; it slides 3px right on hover.

### Chips (status pills)
- **Style:** 1px Hairline Strong border, muted 0.8125rem text, 6px 12px padding.
- **State:** the live variant is a link, green-bordered and green-tinted (12%, 20% on hover) with a 6px green dot.

### Cards / Containers
- **Corner Style:** 22px.
- **Background:** Ground Raised with a Hairline Strong border.
- **Shadow Strategy:** Card lift (see Elevation).
- **Internal Padding:** fluid 24px to 40px.

### Inputs / Fields
- **Style:** Ground fill, 1px Hairline Strong border, 12px radius, 52px tall, 16px inline padding, blue caret. Selects use a drawn chevron, not a native arrow.
- **Focus:** border turns Signal Blue with a 4px 22% blue ring; no outline.
- **Error:** border Error Coral, message below in 0.875rem coral. Checkbox is a custom 22px box that fills blue when checked.

### Navigation
Sticky header, 68px tall, ground at 82% with saturate-and-blur backdrop and a faint hairline below. Wordmark left (pin glyph in blue with a green centre on a soft tile). Links are muted 0.9375rem, turn Ink Strong on hover, and end in a small primary Join button. Footer repeats the wordmark with a column of plain links.

### Browser Frame with Layer Dock (signature)
The demo screenshot sits in a raised 22px frame with a 40px bar (three dots, centred "Luxembourg · demo" label) and an inner 14px hairline-bordered image. A pill dock of five layer tabs overlaps the frame's lower edge by 32px; the selected tab inverts to Ink Strong fill with Ground text, and switching tabs fades in a centred caption with its source line beneath.

## Do's and Don'ts

### Do:
- **Do** build every surface on Ground and lift containers with Ground Raised plus a 1px hairline, not with colour.
- **Do** use Signal Blue for every primary action and link, with Signal Blue Ink as the text on blue.
- **Do** show the real app (screenshots of the demo) as the evidence, framed at 22px radius.
- **Do** keep a source line next to any data claim, in muted 0.875rem text.
- **Do** make interactive controls full pills and honour `prefers-reduced-motion` for the rise and smooth-scroll.

### Don't:
- **Don't** put an eyebrow, kicker or icon chip above a heading.
- **Don't** use Fits Green for anything that does not mean "fits", "live" or "done".
- **Don't** use fake device mockups, stock photos or invented stats.
- **Don't** introduce a second accent hue or hard offset shadows.
