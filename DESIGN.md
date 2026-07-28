---
version: alpha
name: excel-template-hub-design
description: A sober, editorial workflow interface on white canvas and dark-ink type, where brand voltage comes from full-bleed signature bands in coral, forest, and dark navy that punctuate long-scroll explainer pages. Inside those pages sits a second dialect — the spreadsheet grid — with zero radius, monospace type, and two colors that carry meaning rather than decoration: blue for cells the reader types into, green for cells Excel computes. Type runs Archivo in modest weights, never bold for its own sake, over Be Vietnam Pro body copy.

colors:
  ink: "#181d26"
  ink-soft: "#41454d"
  ink-faint: "#6b7280"
  paper: "#ffffff"
  panel: "#f8fafc"
  rule: "#dddddd"
  surface-strong: "#e0e2e6"
  surface-dark: "#181d26"
  coral: "#aa2d00"
  forest: "#0a2e0e"
  cream: "#f5e9d4"
  input: "#1f4b99"
  input-bg: "#eaf0f9"
  computed: "#0e6b4a"
  computed-bg: "#e6f2ec"
  flag: "#b45309"

typography:
  display-xl:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: 60px
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: -0.01em
  display-lg:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: -0.01em
  display-md:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: 30px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.01em
  title-lg:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.01em
  title-sm:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  lead:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0
  button:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  caption:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0
  cell:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  cell-chrome:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  none: 0px
  sm: 6px
  md: 10px
  lg: 12px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 16px 24px
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 16px 24px
  button-secondary-on-dark:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 16px 24px
  text-link:
    backgroundColor: transparent
    textColor: "{colors.input}"
    typography: "{typography.body}"
  top-nav:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
  hero-band:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: 96px
  signature-coral-band:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.paper}"
    typography: "{typography.display-md}"
    rounded: "{rounded.lg}"
    padding: 48px
  signature-dark-band:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.paper}"
    typography: "{typography.display-md}"
    rounded: "{rounded.lg}"
    padding: 48px
  cta-band-light:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.ink}"
    typography: "{typography.display-md}"
    rounded: "{rounded.lg}"
    padding: 48px
  card-grid:
    backgroundColor: "{colors.rule}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.md}"
    gap: 1px
  card-grid-cell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.none}"
    padding: 24px
  panel-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 32px
  text-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 12px 16px
    height: 44px
  avatar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
  footer:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.caption}"
    padding: 64px
  sheet-formula-bar:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.computed}"
    typography: "{typography.cell-chrome}"
    rounded: "{rounded.none}"
    padding: 8px 12px
  sheet-chrome-cell:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.cell-chrome}"
    rounded: "{rounded.none}"
  sheet-input-cell:
    backgroundColor: "{colors.input-bg}"
    textColor: "{colors.ink}"
    typography: "{typography.cell}"
    rounded: "{rounded.none}"
    padding: 8px 12px
  sheet-computed-cell:
    backgroundColor: "{colors.computed-bg}"
    textColor: "{colors.computed}"
    typography: "{typography.cell}"
    rounded: "{rounded.none}"
    padding: 8px 12px
  sheet-error-cell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.flag}"
    typography: "{typography.cell}"
    rounded: "{rounded.none}"
  signature-forest-band:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.cream}"
    typography: "{typography.display-md}"
    rounded: "{rounded.lg}"
    padding: 48px
  system-map-node-input:
    backgroundColor: "{colors.input-bg}"
    borderColor: "{colors.input}"
    textColor: "{colors.ink}"
    typography: "{typography.cell}"
    rounded: "{rounded.none}"
    padding: 12px
  system-map-node-computed:
    backgroundColor: "{colors.computed-bg}"
    borderColor: "{colors.computed}"
    textColor: "{colors.ink}"
    typography: "{typography.cell}"
    rounded: "{rounded.none}"
    padding: 12px
  system-map-node-planned:
    backgroundColor: "{colors.panel}"
    borderColor: "{colors.rule}"
    borderStyle: dashed
    textColor: "{colors.ink-faint}"
    typography: "{typography.cell}"
    rounded: "{rounded.none}"
    padding: 12px
  system-map-edge:
    strokeColor: "{colors.ink-faint}"
    strokeWidth: 1px
    textColor: "{colors.ink-faint}"
    typography: "{typography.cell-chrome}"
  system-strip:
    backgroundColor: "{colors.panel}"
    borderColor: "{colors.rule}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 16px
---

## Overview

This is a Vietnamese pSEO site that publishes free Excel templates. Every page exists to make one argument: *other sites hand you a file and hide how it works; here the formulas are on the page*. The design has to carry that argument, not decorate around it.

So the system runs two dialects, and the boundary between them is a hard rule.

**The editorial layer** is everything outside the spreadsheet grid. White canvas, near-black ink, generous whitespace, a `{spacing.section}` (96px) vertical constant between bands, and a near-black `{component.button-primary}`. Nothing competes for attention until a section earns it. Brand voltage comes from **full-bleed signature bands** in `{colors.coral}` and `{colors.surface-dark}` that cut across the white every few screens — never from gradients, meshes, or accent walls.

**The spreadsheet layer** is inside `{component.sheet-input-cell}` and its siblings. Zero radius, monospace type, and two colors that carry meaning: `{colors.input}` for cells the reader types into, `{colors.computed}` for cells Excel calculates. The reader learns this convention at the first preview table and reuses it on every page after. These are not accent colors — they are the vocabulary of the thing being taught.

**Key Characteristics:**
- Primary CTA is `{colors.ink}` with white text and `{rounded.lg}`. It reads as final, not decorative, so it appears at most once per viewport.
- Display type is **never bold**. `{typography.display-xl}` and `{typography.display-lg}` are weight 400. Emphasis comes from size and from the band underneath, never from weight.
- Section rhythm alternates surfaces: white hero → white card grid → coral band → white grid → panel card → footer. Two identical surfaces never sit adjacent.
- The card grid is a hairline lattice (`gap-px` over a `{colors.rule}` background), not a set of floating cards. This is a spreadsheet's own geometry, and it costs no shadow.
- Radius is hierarchical: `{rounded.lg}` for primary CTAs and signature bands, `{rounded.md}` for content cards and grid outer frames, `{rounded.sm}` for inputs and inline code, `{rounded.full}` for avatars, and `{rounded.none}` — mandatory — everywhere inside the grid.
- Vietnamese diacritics stack two levels high, so body `line-height` is 1.65 rather than a typical 1.5, and every font must ship a `vietnamese` subset.

## Colors

### Editorial

- **Ink** (`{colors.ink}` — #181d26): The strongest text, and the primary CTA background. 16.9:1 on paper.
- **Ink Soft** (`{colors.ink-soft}` — #41454d): Running body copy and footer text. 9.6:1 on paper.
- **Ink Faint** (`{colors.ink-faint}` — #6b7280): Column letters, row numbers, timestamps, separators. 4.8:1 on paper — still AA, because some of it is real text (the formula-bar hint), not just chrome.
- **Paper** (`{colors.paper}` — #ffffff): The default canvas. The hero is white, full stop.
- **Panel** (`{colors.panel}` — #f8fafc): Author card, form sidebar, inline code blocks, spreadsheet chrome.
- **Rule** (`{colors.rule}` — #dddddd): The 1px hairline. Borders, table dividers, secondary-button outlines, and the mortar of the card grid.

### Signature Bands

Full-bleed surfaces that punctuate long pages. Never accents on small elements.

- **Coral** (`{colors.coral}` — #aa2d00): The homepage thesis band. White type at 6.8:1.
- **Surface Dark** (`{colors.surface-dark}` — #181d26): The `{component.signature-dark-band}` carrying the course CTA. Same hex as `{colors.ink}` because ink serves as both type color and signature dark surface.
- **Surface Strong** (`{colors.surface-strong}` — #e0e2e6): The light gray closing band on the library index.
- **Forest + Cream** (`{colors.forest}` — #0a2e0e on `{colors.cream}` — #f5e9d4): The `{component.signature-forest-band}`, reserved for the **bundle layer** (`/mau-excel/bo-file/*`). It is not a decorative alternative to coral: it marks a different tier of page. Coral belongs to the homepage, dark navy to the course CTA, forest to a bundle. Landing on a page and recognizing the tier from the band color is the point.

### Spreadsheet Semantics

These carry meaning. They are the one thing in the system that must never be repurposed.

- **Input** (`{colors.input}` — #1f4b99) on **Input BG** (`{colors.input-bg}` — #eaf0f9): Cells the reader types into. Also serves as the link color and the `:focus-visible` ring, both of which are consistent with "this is where you act."
- **Computed** (`{colors.computed}` — #0e6b4a) on **Computed BG** (`{colors.computed-bg}` — #e6f2ec): Cells Excel calculates. 5.7:1 on its own background.
- **Flag** (`{colors.flag}` — #b45309): Error cells (`#DIV/0!`, `#REF!`), form validation errors, and the preview-build banner. Deliberately an amber-orange rather than a red, because a red would sit too close to `{colors.coral}` and let a brand band read as a broken cell.

## Typography

### Font Family

Three families, all loaded through `next/font/google` in `app/layout.tsx` with `subsets: ["latin", "vietnamese"]` — non-negotiable, since a missing Vietnamese subset drops diacritics to a system font and causes layout shift.

- **Archivo** — display. A grotesk in the Haas family tree. Loaded at weights 400 / 500 / 600 only; 700 is deliberately absent so nobody can reach for it.
- **Be Vietnam Pro** — body. Drawn for Vietnamese, which is why it carries every paragraph on the site.
- **JetBrains Mono** — formulas, cell references, column letters. Not decorative: formulas only read comparably when they line up in columns. `font-feature-settings: "zero" 1` keeps the slashed zero.

### Hierarchy

| Token | Size | Weight | Use |
|---|---|---|---|
| `{typography.display-xl}` | 60px | 400 | Homepage and course-page h1 |
| `{typography.display-lg}` | 48px | 400 | Library, category, and template h1 |
| `{typography.display-md}` | 30px | 400 | Section h2 and signature-band headlines |
| `{typography.title-lg}` | 24px | 400 | Sidebar and author-card headings |
| `{typography.title-sm}` | 16px | 500 | Card titles, step names, field labels |
| `{typography.lead}` | 18px | 400 | Intro paragraph under an h1 |
| `{typography.body}` | 16px | 400 | Running copy |
| `{typography.button}` | 16px | 500 | CTA labels |
| `{typography.caption}` | 14px | 400 | Meta lines, footer, breadcrumbs |
| `{typography.cell}` | 14px | 400 | Cell values and formulas |
| `{typography.cell-chrome}` | 12px | 400 | Column letters, row numbers, cell-name box |

### Principles

Weight 400 for every display size. Where the system wants emphasis it goes to 500 — card titles, buttons, step names — and stops there. 600 exists only on the nav wordmark. There is no 700 in the loaded font, which is the enforcement mechanism.

When in doubt: bigger before bolder, and a signature band before a solid accent.

## Layout

### Spacing

- **Base unit:** 4px.
- **`{spacing.section}` (96px) is the universal vertical rhythm.** Every gap between major bands, and every page's top and bottom padding, is 96px. Gaps *within* a band (heading to content) stay at 20–24px — the 96px constant is for band-to-band only, and mixing the two scales is what made the pre-rewrite pages feel arrhythmic.
- **Card padding:** `{spacing.xxl}` (48px) inside signature bands, `{spacing.xl}` (32px) in panel cards, `{spacing.lg}` (24px) in grid cells.

### Grid & Container

- Editorial pages cap at `max-w-5xl` (1024px); the template article caps at `max-w-3xl` (768px) because it is long-form reading.
- Card grids run 3-up at desktop, 2-up at tablet, 1-up at mobile.
- The grid is built as `gap-px` over a `{colors.rule}` background with `{rounded.md} overflow-hidden` on the outer frame only. Individual cells stay square — the lattice is the point.

### Whitespace

Whitespace is the hero's only atmosphere. No gradient, no mesh, no illustration behind the type. The hero carries one headline, one paragraph, and one button pair; anything more belongs in a band further down.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Body sections, nav, footer, hero |
| Hairline | 1px `{colors.rule}` | Inputs, table dividers, card lattice, secondary buttons |
| Color block | No shadow; contrast against the surrounding surface | Signature bands, panel cards, spreadsheet cells |

**Color-block first, shadow never.** There is not a single `box-shadow` in the system. Depth comes from the contrast between white canvas and a saturated band.

## Components

> Only Default and Active/Pressed states are specified. Hover is an affordance, not a documented layer — keep it to the minimum that signals clickability.

### Buttons

**`button-primary`** — `{colors.ink}` background, `{colors.paper}` text, `{typography.button}`, 16px × 24px padding, `{rounded.lg}`. One per viewport. Hover lightens to 85% opacity.

**`button-secondary`** — `{colors.paper}` with a 1px `{colors.rule}` outline and `{colors.ink}` text, same shape. The natural pair beside `{component.button-primary}`.

**`button-secondary-on-dark`** — Same white button, used on `{component.signature-coral-band}` and `{component.signature-dark-band}`. The button stays solid white on dark surfaces; the system never inverts to a translucent on-dark style.

**`text-link`** — `{colors.input}` with a `{colors.input}`/40% underline that solidifies on hover. Blue here is consistent with its spreadsheet meaning: the place where you act.

### Bands & Cards

**`hero-band`** — Full-width white. Headline, one lead paragraph, one button pair, 96px of vertical air.

**`signature-coral-band`** — `{colors.coral}`, white type, `{rounded.lg}`, 48px padding, `{component.button-secondary-on-dark}` as CTA. Carries the site's central claim, placed between two white card grids so it interrupts rather than decorates.

**`signature-dark-band`** — `{colors.surface-dark}`, white type, same geometry. This is the commercial ask (`components/CourseCta.tsx`), and it is the loudest moment in any article.

**`cta-band-light`** — `{colors.surface-strong}`, ink type, `{rounded.lg}`, closing the library index with a `{component.button-primary}`.

**`card-grid`** / **`card-grid-cell`** — A hairline lattice. `{colors.rule}` background showing through 1px gaps, `{colors.paper}` cells, `{rounded.md}` and `overflow-hidden` on the outer frame only.

**`panel-card`** — `{colors.panel}` with a `{colors.rule}` hairline and `{rounded.md}`. The author card and the lead-form sidebar.

### Inputs

**`text-input`** — `{colors.paper}`, 1px `{colors.rule}`, `{rounded.sm}`, 12px × 16px padding, 44px tall. Focus draws the global 2px `{colors.input}` ring at 2px offset.

### Spreadsheet Sub-System

This is the site's own dialect, sitting inside `components/SheetPreview.tsx`. It has its own radius (zero), its own font (mono), and its own colors — and **none of it leaks outward, and nothing from the editorial layer leaks in**. Structurally it plays the role that a pricing sub-system plays on a SaaS marketing site: a bounded region that announces itself by breaking the house style on purpose.

**`sheet-formula-bar`** — Excel's formula bar, rebuilt: cell-name box on the left, an italic `fx` divider, then the resolved formula in `{colors.computed}`. It is an `aria-live` region so screen readers announce the formula as focus moves.

**`sheet-chrome-cell`** — The column-letter strip and row-number gutter. `{colors.panel}` background, `{colors.ink-faint}` mono type, `aria-hidden` — this is the frame of a spreadsheet, not data.

**`sheet-input-cell`** — Cells the reader types into. `{colors.input-bg}` background. Tinted rather than left white so the convention the caption declares is actually visible; a white input cell is indistinguishable from an empty one.

**`sheet-computed-cell`** — Cells Excel calculates. `{colors.computed-bg}` background, `{colors.computed}` text, rendered as a real `<button>` so mouse and keyboard both reveal the formula. Carries a 6px triangle in the top-right corner — borrowed from Excel's own comment marker — because touch devices have no hover and otherwise nothing signals the cell is interactive.

**`sheet-error-cell`** — `{colors.flag}` text for `#DIV/0!` and `#REF!` values.

### Bundle Map — the one sanctioned promotion of the semantic colors

`components/SystemMap.tsx` draws a bundle as a spreadsheet, not a flowchart: square corners, mono labels, an A/B/C column strip across the top. Three columns are three roles — input, process, master.

It is the only place outside `SheetPreview` allowed to use `{colors.input}` and `{colors.computed}`, and the reason is that it does not repurpose them. It **promotes them one level**, from cell to file: blue still means "you type into this," green still means "Excel pulls the numbers in." The reader learns the convention on a cell and reads it again on a file without being taught twice. That is the test any future use has to pass — if a proposed use cannot state the same sentence about the same meaning, it is decoration and the answer is no.

**`system-map-node-input`** / **`system-map-node-computed`** — A file in the bundle. `{rounded.none}`, 1px semantic border over the matching `-bg` tint. The master node takes a 2px border and a mono `FILE TỔNG` label; it is the only node whose role tag is not simply its column name.

**`system-map-node-planned`** — A file not written yet. `{colors.panel}` on a dashed `{colors.rule}` border, `{colors.ink-faint}` type, and **not a link**. Showing an unbuilt file greys-out is honest about the bundle's coverage; linking it to a 404 to make the bundle look complete is not.

**`system-map-edge`** — Data moving between two files. A 1px `{colors.ink-faint}` elbow with an arrowhead, drawn in an SVG layer measured from the real DOM boxes. The label on it names the data ("số công tháng"), never the relationship — a diagram whose arrows say "→" carries no information the layout did not already carry. Below 640px the SVG is dropped entirely and each node carries text chips instead; a diagram collapsed to one column is a list, so it should be drawn as one.

**`system-strip`** — The compact version on a single-file page, answering "where does this file sit." Same node sequence, one row, current file inverted to `{colors.ink}`.

## Do's and Don'ts

### Do
- Keep `{component.button-primary}` near-black, and keep it to one per viewport.
- Trust whitespace as the hero atmosphere. Calm is the brand.
- Use `{component.signature-coral-band}` and `{component.signature-dark-band}` to break editorial monotony — they are the voltage moments.
- Alternate surfaces band to band. White → coral → white → panel reads as rhythm; white → white reads as a typography blog.
- Anchor every band gap at `{spacing.section}` (96px).
- Load every font with the `vietnamese` subset and keep body `line-height` at 1.65.

### Don't
- **Don't use `{colors.input}` or `{colors.computed}` as decoration** — not as a button fill, not as a hover color, not as a band. They mean "you type here" and "Excel computes this." Spending them on ornament dissolves the one convention the whole site teaches. The bundle map is the sole exception and it earns it by keeping the meaning intact; see the sub-section above for the test.
- **Don't reuse `{component.signature-forest-band}` outside `/mau-excel/bo-file/*`.** Band color encodes page tier, not variety.
- **Don't round anything inside the spreadsheet grid.** `{rounded.none}` is mandatory there.
- Don't bold display type. The loaded Archivo weights stop at 600 precisely so this stays impossible; don't add 700 back.
- Don't add a gradient, mesh, or illustration behind the hero.
- Don't introduce a `box-shadow`. Depth is color contrast.
- Don't introduce accent colors beyond the declared signature set.
- Don't let `{colors.flag}` drift back toward red — it has to stay clearly distinct from `{colors.coral}`.

## Responsive Behavior

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | Single-column; card grids 1-up; signature bands drop to 40px padding; the sheet table scrolls horizontally with a visible "cuộn ngang" hint |
| Tablet | 640–1024px | 2-up card grids; course page still single-column |
| Desktop | ≥ 1024px | 3-up card grids; course page splits to content + 360px sticky sidebar |

### Touch Targets
- `{component.button-primary}` renders at 16px padding + 22px line-height ≈ 54px tall — above WCAG AAA's 44px.
- `{component.text-input}` is 44px.
- `{component.sheet-computed-cell}` buttons fill their cell, roughly 38px tall — under 44px, but they are a progressive enhancement (the value is readable without interacting) rather than a required action.

## Iteration Guide

1. Focus on ONE component at a time and reference its YAML key directly.
2. Before adding a component, decide which dialect it belongs to: editorial (Archivo, `{rounded.lg}`/`{rounded.md}`) or spreadsheet (mono, `{rounded.none}`, semantic colors). Nothing belongs to both.
3. Variants live as separate entries in `components:`, never as nested state objects.
4. Use `{token.refs}` in prose wherever a color, radius, type role, or spacing value is named. A hex appears at most once, next to its reference.
5. Check contrast whenever a color value moves. Body text needs 4.5:1; `{colors.ink-faint}` is the tightest at 4.8:1 and has no headroom.
6. Token definitions live in `app/globals.css` under `@theme`. Tailwind v4 generates utilities from them — there is no `tailwind.config.js`.

## Known Gaps

- `{component.system-map-edge}` positions arrows from measured DOM boxes, so the diagram is the one component whose correctness depends on layout having settled. It re-measures on `ResizeObserver` and on `document.fonts.ready`; a box that changes size through neither of those paths (CSS `zoom`, for instance) will leave the arrows stale.
- The bundle map is laid out for at most 3 columns × 8 nodes. Past that the lane-stagger for arrows in a single gap runs out of room.
- Hover is applied but not formally specified per component.
- Animation and transition timings are out of scope; the only motion rule is the `prefers-reduced-motion` clamp in `app/globals.css`.
- Input validation is specified for the error state only. Success and warning states for `{component.text-input}` are not drawn.
- Dark mode is not designed. The system assumes a light canvas throughout.
- `npx @google/design.md lint` is referenced in tooling conventions but is **not** installed in this repo — there is no such dependency in `package.json` and no lint script wired to it.
