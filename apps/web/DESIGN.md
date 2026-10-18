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
    padding: "0 14px"
    height: "40px"
  layer-tab-current:
    backgroundColor: "{colors.ink-strong}"
    textColor: "{colors.ground}"
  toggle-pill:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "36px"
  toggle-pill-pressed:
    backgroundColor: "{colors.ink-strong}"
    textColor: "{colors.ground}"
  step-card:
    backgroundColor: "{colors.ground-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
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

The category standard for a modern dark product landing, played straight. The ground is the app's own near-black dark theme, so the landing and the Luxembourg demo read as one product. Under the centred hero copy, the demo's real Luxembourg data runs as a live dark map in a hairline browser frame that stays pinned while five layer cards scroll over it, above a soft green-blue glow; everything else is quiet type on dark ground, hairline rules and pill controls.

Density is generous at the top (centred hero, the scroll-driven map story, wide section padding) and tighter in the evidence sections (city grid, sources table), where hairline grids carry structure instead of cards. Colour is almost entirely neutral; one blue speaks for every action, and green appears only where it means "fits" or "live", exactly as it does on the app's zone map.

Rejected by the build: fake device mockups, stock photography, invented stats, eyebrows above headings, icon chips.

**Key Characteristics:**
- Near-black tonal layering (ground, raised, soft) instead of coloured surfaces.
- One accent, Signal Blue, for every action and link.
- Fits Green carries meaning, never decoration.
- Geist Variable throughout, tight negative tracking on headings.
- Pill-shaped interactive controls; 22px-radius frames for the live map, screenshots, step cards and the form card.
- Hairline grids (1px rules) for lists, tables and the city grid.

## Colors

A near-black, GitHub-dark family of neutrals with a single blue voice and a semantic green.

### Primary
- **Signal Blue** (signal-blue): primary buttons, links, focus outlines, checked checkbox, input focus ring, caret, text selection tint. Hover lifts to **Signal Blue Hover**; text on blue fills is **Signal Blue Ink**, a near-black navy, never white.

### Secondary
- **Fits Green** (fits-green): the app's "this zone fits" colour. Used for the live status dot, the frame bar's live dot (40% until the map loads), the "Demo live" pill and its city cell tint, the success check, the fitting cells on the map, and the green half of the story glow. Nothing else.

### Neutral
- **Ground** (ground): page background, input fill, text on the current layer tab and on pressed toggle pills. Also the browser `theme-color`.
- **Ground Raised** (ground-raised): the map frame, step cards (at 94%), map controls, popups and tooltips, the panel screenshot, form card, the sources band, the iOS row in the city grid, the privacy table of contents.
- **Ground Soft** (ground-soft): third tonal step; frame halo ring, wordmark tile, select options, inline code.
- **Ink** (ink): default body text.
- **Ink Strong** (ink-strong): headings, strong runs, quiet-button text, readouts and slider values, the current tab and pressed toggle fill.
- **Ink Soft** (ink-soft): hero sub, step-card body and long-form privacy prose; a step brighter than muted where reading length demands it.
- **Ink Muted** (ink-muted): leads, secondary nav, captions, table cells, footer.
- **Hairline** (hairline): 1px rules for lists, tables, grids, section bands, footer.
- **Hairline Strong** (hairline-strong): borders of frames, cards, inputs, pills, the layer dock, legend and map controls; frame-bar dots; scrollbar thumb.
- **Error Coral** (error-coral): field errors and invalid borders only.

### Data on the map
The live map carries the prototype's own data-visualisation colours, literal in `src/scripts/live-map.ts` and never used as accents elsewhere: the rent budget ramp (rgb 26 127 55, 124 201 106, 240 180 41, 209 73 91), noise bands at 55/60/65/70 dB (rgb 240 200 90, 240 150 60, 226 96 72, 196 54 84), nightlife amber (rgb 240 180 41), planes-at-night violet (rgb 150 140 235), Fits Green for fitting cells (35% for the "near" band), and white-ringed Signal Blue pins for the commute origins, as in the app. The base map is geoportail's gray topo tiles inverted to dark by CSS filter (`invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.86) saturate(0.4)`) on a #0d1116 shell.

### Named Rules
**The One Voice Rule.** Signal Blue is the only colour that means "act". If something is clickable and primary, it is blue; nothing decorative is blue except the story glow (the map's commute pins are data, mirroring the app).

**The Data Stays on the Map Rule.** The data-viz colours live inside the map and its legend only; they never become UI accents.

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

A single centred wrap (1180px content, fluid gutter of 20 to 40px). Sections breathe with fluid vertical padding (80px to 152px). The hero copy is centred. Below it the story section stacks two layers in one grid cell: a sticky stage (top 80px, height up to the viewport minus the header, max 860px) holding the map frame, and a column of 384px step cards that scrolls over the map's left side. Each step is 88svh tall (intro 62svh, last 100svh); the step whose card crosses a reading line at 60% of the viewport (85% on mobile) picks the layer. Every later section is a two-column split (roughly 1.1fr / 0.9fr, gap 40 to 96px) with copy on one side and evidence (screenshot, table, form card) on the other. The city list is a 4-column hairline grid with a full-width iOS row.

Responsive: below 900px the story stage shrinks to 46svh with 12px side padding, the frame bar drops its dots, zoom and attribution hide, the legend moves bottom-left, step cards go full-width and sit below the map (each step 100svh, bottom-aligned, card source lines hidden except the safety note), and the layer dock moves to the top of the map as a 5-column grid of icon-over-label tabs. At 960px all splits stack and the city grid drops to 2 columns; at 640px it drops to 1 and the poster swaps to the mobile screenshot. The header hides section links below 760px and the demo link below 440px, keeping the Join button.

## Elevation & Depth

Depth comes mostly from tonal layering (ground to raised to soft) and hairline borders. Shadows are soft, long and dark, used only to lift the map frame, step cards, panel screenshot, form card, the floating layer dock and the map's controls and popups off the ground. Translucent overlays on the map (dock, legend, step cards) add backdrop blur. No hard or offset shadows.

### Shadow Vocabulary
- **Frame lift** (`box-shadow: 0 40px 80px -30px rgb(0 0 0 / 0.75), 0 0 0 6px color-mix(in srgb, var(--bg-soft) 60%, transparent)`): the live-map frame, with a soft halo ring.
- **Card lift** (`box-shadow: 0 40px 80px -40px rgb(0 0 0 / 0.9)`): step cards, panel screenshot and form card. Step cards sit at 94% Ground Raised with a 14px backdrop blur.
- **Dock lift** (`box-shadow: 0 16px 40px -16px rgb(0 0 0 / 0.8)`): the layer dock (12px backdrop blur), the Leaflet zoom control, popups and tooltips.
- **Focus ring** (`box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent)`): inputs on focus. Status dots use the same 4px ring in green.

### Named Rules
**The Glow Once Rule.** The blurred green-blue radial glow lives behind the top of the story's map frame only, masked to fade out top and bottom. It is the page's single atmospheric effect.

## Shapes

Two families: everything you press is a full pill (999px); everything that holds content is a soft rounded rectangle (22px for frames and cards, 14px for the inner map shell, popups and minor panels, 12px for inputs, 6px for checkboxes, code and focus outlines). Borders are always 1px. Lists, tables and the city grid use straight hairlines with no radius at all.

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

### Live Map Story (signature)
The demo's real Luxembourg data on a Leaflet map, framed and pinned while the explanation scrolls past it.
- **Frame:** raised 22px frame with Frame lift and the rise entrance; a 40px bar (three dots, a centred "Luxembourg · live" label led by a 6px green dot that brightens when the map is live, and a muted "Open the full demo" link on the right); inside, a 14px hairline-bordered map shell on #0d1116.
- **Stage:** `position: sticky` below the header. The poster screenshot shows until the map loads and stays as the fallback; a centred status pill reports loading and failure.
- **Map chrome:** dark-inverted gray tiles; zoom control at 12px radius on Ground Raised; popups and tooltips on Ground Raised with a Hairline Strong border and Dock lift; attribution on 70% Ground at 0.6875rem. A legend pill (88% Ground Raised, 12px blur, 0.8125rem, 10px rounded-square swatches) sits top-right, bottom-left on mobile.
- **Layer dock:** a `nav` of anchor links marked with `aria-current="step"`; a pill on 92% Ground Raised with 12px blur and Dock lift. Desktop: floats 24px above the map's bottom edge, offset right of the cards. Mobile: docks at the top of the map as a 5-column icon-over-label grid with 14px tabs. The current tab inverts to Ink Strong fill with Ground text; clicking scrolls to its step.
- **Step cards:** 384px wide, 24px padding (18px on mobile), 94% Ground Raised with 14px backdrop blur and Card lift; Title-style h3, Ink Soft 0.9375rem body. Upcoming cards wait at 0.4 opacity and 0.98 scale; past cards fade to 0 and stop taking pointer events (0.45s out-expo). An intro card shows the combined "fits everything" readout first.
- **Controls:** below a hairline, muted 0.8125rem labels; toggle pills (36px, 1px Hairline Strong border, Ink text, `aria-pressed`; pressed inverts to Ink Strong fill with Ground text); range sliders with `accent-color` Signal Blue and an Ink Strong tabular output; a 500-weight Ink Strong tabular readout computed live; a muted 0.8125rem source line.
- **Touch:** on coarse pointers one-finger swipes scroll the page; a "Move the map" pill (top-left, bottom-right on mobile) hands gestures to the map and turns Signal Blue while pressed.

## Do's and Don'ts

### Do:
- **Do** build every surface on Ground and lift containers with Ground Raised plus a 1px hairline, not with colour.
- **Do** use Signal Blue for every primary action and link, with Signal Blue Ink as the text on blue.
- **Do** show the real app as the evidence: the live map running the demo's own data, framed at 22px radius, with the screenshot as poster and fallback.
- **Do** keep a source line next to any data claim, in muted 0.875rem text.
- **Do** make interactive controls full pills and honour `prefers-reduced-motion` for the rise, card transitions and smooth-scroll.

### Don't:
- **Don't** put an eyebrow, kicker or icon chip above a heading.
- **Don't** use Fits Green for anything that does not mean "fits", "live" or "done".
- **Don't** use fake device mockups, stock photos or invented stats.
- **Don't** introduce a second accent hue or hard offset shadows.
