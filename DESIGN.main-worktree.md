---
name: Pathwise
description: AI-powered curriculum generation and lesson delivery for serious learners.
colors:
  canvas:            "oklch(98.8% 0.004 100)"
  chrome:            "oklch(99.4% 0.003 100)"
  panel:             "oklch(99.1% 0.003 100)"
  node-surface:      "oklch(99.4% 0.003 100)"
  node-current:      "oklch(97.2% 0.022 249)"
  node-done:         "oklch(95.5% 0.044 150)"
  node-locked:       "oklch(96.5% 0.005 100)"
  goal:              "oklch(18.4% 0.006 255)"
  border:            "oklch(90.6% 0.008 100)"
  border-mid:        "oklch(80.9% 0.012 100)"
  border-accent:     "oklch(78.4% 0.097 249 / 0.58)"
  text-primary:      "oklch(18.4% 0.006 255)"
  text-secondary:    "oklch(39.6% 0.010 255)"
  text-muted:        "oklch(61.2% 0.010 100)"
  text-subtle:       "oklch(74.2% 0.011 100)"
  text-inverted:     "oklch(98.8% 0.004 100)"
  text-accent:       "oklch(50.5% 0.181 258)"
  accent:            "oklch(78.4% 0.097 249)"
  accent-hover:      "oklch(70.7% 0.139 252)"
  accent-subtle:     "oklch(92.6% 0.034 249)"
  success:           "oklch(49.1% 0.122 150)"
  success-soft:      "oklch(95.5% 0.044 150)"
  success-border:    "oklch(87.1% 0.078 150)"
  danger:            "oklch(57.7% 0.209 25)"
  danger-soft:       "oklch(96.3% 0.020 25)"
  danger-border:     "oklch(86.1% 0.071 25)"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 790
    lineHeight: 1.12
    letterSpacing: "0"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 780
    lineHeight: 1.12
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 760
    lineHeight: 1.3
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.72
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 750
    lineHeight: 1
    letterSpacing: "0.12em"
  caption:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 650
    lineHeight: 1.45
rounded:
  xs: "3px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.goal}"
    textColor: "{colors.text-inverted}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "oklch(27.5% 0.008 255)"
    textColor: "{colors.text-inverted}"
    rounded: "{rounded.md}"
  button-ghost:
    backgroundColor: "{colors.node-surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "0 11px"
    height: "30px"
  button-ghost-hover:
    backgroundColor: "{colors.node-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
---

# Design System: Pathwise

## 1. Overview

**Creative North Star: "The Cartographer's Table"**

Pathwise is a precision instrument, not a consumer app. Its visual language is drawn from technical reference materials: the quiet authority of a well-made atlas, the structural clarity of a circuit diagram, the calm density of a well-typeset textbook. Every surface is there to make the learner's mental model clearer, not to signal product sophistication.

The palette is deliberately restrained — near-white surfaces with almost no chroma, a single cool accent used sparingly on interactive states, and near-black text. The accent (a desaturated periwinkle-slate, hue 249) is earned: it appears on current nodes, focus rings, and active borders, never as decoration. Color does semantic work or stays home.

The system adapts fully to light and dark mode. The light theme reflects the physical scene: a serious learner at a well-lit desk, reading a lesson in focused daylight. The dark theme matches the same learner working in a dimmer environment — same precision, same restraint, different ambient light.

**Key Characteristics:**
- Warm off-white surfaces, near-zero chroma, tinted toward warm-neutral (hue 100)
- Single periwinkle-slate accent (hue 249) reserved for interactive and state-indicating roles
- No decorative color; semantic color only (success = sage green, danger = terracotta, accent = slate-blue)
- Shadow vocabulary is structural, not decorative — only appears on elevated or interactive elements
- Typography runs on a single family (Inter) with weight as the primary hierarchy instrument
- Node states (current, done, locked, available) are the only place color carries meaning without a text label

## 2. Colors: The Mineral Palette

A near-monochromatic ground with one cool accent and two semantic signals. Every color earns its place by doing work.

### Primary
- **Ink Near-Black** (`oklch(18.4% 0.006 255)`): The primary text and button-primary background in light mode. Slightly cool-tinted (hue 255) to prevent warmth from reading as aged or soft.
- **Periwinkle Slate** (`oklch(78.4% 0.097 249)`): The single accent. Used on node-current backgrounds, border-accent, focus rings, and `--color-accent`. Low chroma — present without calling attention to itself.

### Secondary
- **Sage Green** (`oklch(49.1% 0.122 150)`): Completion state. Used on `--color-success`, "Mark complete" confirmation, and node-done. Not celebratory — clinical confirmation.
- **Terracotta** (`oklch(57.7% 0.209 25)`): Error and danger state. Highest chroma in the system (0.209) because errors demand attention.

### Neutral
- **Warm Canvas** (`oklch(98.8% 0.004 100)`): Page background. Near-white with trace warmth (hue 100, chroma 0.004). Never pure white.
- **Chrome Off-White** (`oklch(99.4% 0.003 100)`): Header/top bar surface — slightly brighter than canvas to lift the chrome layer.
- **Panel Off-White** (`oklch(99.1% 0.003 100)`): Content panel backgrounds and the worked example tint block.
- **Node Surface** (`oklch(99.4% 0.003 100)`): Default skill node background.
- **Border Pale** (`oklch(90.6% 0.008 100)`): Default dividers, card outlines, and structural borders.
- **Border Mid** (`oklch(80.9% 0.012 100)`): Hover-state borders and interactive separators.
- **Secondary Text** (`oklch(39.6% 0.010 255)`): Body prose, descriptions. Warm-cool split — reads as charcoal, not pure gray.
- **Muted Text** (`oklch(61.2% 0.010 100)`): Labels, timestamps, helper text.
- **Subtle Text** (`oklch(74.2% 0.011 100)`): Placeholder content and lowest-hierarchy metadata.

### Named Rules

**The One Accent Rule.** The periwinkle-slate accent (`--color-accent`) is reserved for interactive and state indicators only: current node highlight, focused border rings, active accent text. It is never used decoratively as a header background, highlight band, or illustration stroke.

**The Semantic Color Rule.** Sage green means "done." Terracotta means "error." Periwinkle means "active/interactive." No other color carries semantic weight. If a new color is tempting, ask first: is it semantic or decorative? Decorative colors are prohibited.

## 3. Typography

**Display / Body Font:** Inter (with `-apple-system, BlinkMacSystemFont, system-ui` fallback chain)
**Mono Font:** `ui-monospace, SF Mono, Cascadia Code, Fira Code, Menlo` — code blocks and node IDs only

**Character:** Inter at high weights (750+) has the structural authority this system requires. It reads as precise without being cold. The narrow letter-spacing at large sizes keeps headlines tight and referential, not editorial.

### Hierarchy

- **Display** (weight 790, 32px, line-height 1.12): Lesson page title. One instance per lesson view. Tight leading — reads as a heading on a reference document, not a marketing splash.
- **Headline** (weight 780, 24px, line-height 1.12): Concept name in the lesson sidebar. Primary entry point for the learner.
- **Title** (weight 760, 15px, line-height 1.3): Section headings within a lesson body, node names on the dashboard. The workhorse heading level.
- **Body** (weight 400, 14.5px, line-height 1.72): Lesson prose. Generous line-height (1.72) for sustained reading. Max line length 72ch.
- **Label** (weight 750, 10px, line-height 1, letter-spacing 0.12em, UPPERCASE): Eyebrow labels above content blocks ("CONCEPT", "END GOAL", "WORKED EXAMPLE", "TRY THIS"). All-caps + wide tracking creates clear category separation without size difference.
- **Caption** (weight 650, 12px, line-height 1.45): Secondary UI text, node status badges, timestamps, small control labels.

### Named Rules

**The Weight-Over-Size Rule.** Hierarchy is expressed primarily through weight contrast, not size jumps. The Title (15px/760) and Body (14.5px/400) are nearly the same size but register as clearly different levels. Never compensate for weak weight contrast by bumping font size.

**The Uppercase Label Rule.** Uppercase eyebrow labels exist only at 10px/750 weight with 0.12em letter-spacing. Any other use of all-caps is prohibited. This pattern is a unique structural marker — diluting it with other usages destroys its signal value.

## 4. Elevation

Pathwise is flat-by-default. Surfaces sit on a single visual plane; elevation is only invoked to indicate state change or interactive context. The shadow vocabulary is structural, never decorative.

### Shadow Vocabulary

- **`--shadow-node`** (`0 1px 2px oklch(20% 0.020 75 / 0.04)`): Resting skill node. Almost imperceptible — just enough to lift the node card from canvas.
- **`--shadow-node-active`** (`0 1px 3px oklch(78.4% 0.097 249 / 0.34), 0 4px 12px oklch(78.4% 0.097 249 / 0.13)`): Hovered/focused node. Accent-tinted glow — the only place shadow carries accent color.
- **`--shadow-node-selected`** (`0 0 0 3px oklch(78.4% 0.097 249 / 0.22), 0 4px 18px oklch(20% 0.020 75 / 0.08)`): Selected node. Combines an accent ring with a neutral lift.
- **`--shadow-card`** (`0 2px 12px oklch(20% 0.020 75 / 0.07)`): Content panels and sidebar cards. Ambient ambient lift.
- **`--shadow-control`** (`0 1px 4px oklch(20% 0.020 75 / 0.06)`): Input fields and small controls.
- **`--shadow-floating`** (`0 18px 44px oklch(20% 0.020 75 / 0.12), 0 2px 6px oklch(20% 0.020 75 / 0.04)`): Dropdown menus, tooltips, and detached panels.
- **`--shadow-popover`** (`0 14px 40px oklch(20% 0.020 75 / 0.12), 0 2px 8px oklch(20% 0.020 75 / 0.06)`): Popovers and contextual overlays.
- **`--shadow-drag`** (`0 8px 28px oklch(20% 0.020 75 / 0.14), 0 0 0 2px oklch(78.4% 0.097 249 / 0.34)`): Nodes being dragged. Maximum lift + accent ring to signal "in motion."

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state: hover, selection, drag, or floating context. A shadow on a resting card is a mistake.

**The Tinted Shadow Rule.** Accent-tinted shadows (`shadow-node-active`, `shadow-drag`) are reserved for the graph canvas only. All other surfaces use the warm-dark neutral shadow base (`oklch(20% 0.020 75)`).

## 5. Components

### Buttons

Buttons use weight and form to signal confidence. No gradients, no icons by default, no rounded-pill shape.

- **Shape:** Gently rounded (6-8px radius). Not pill, not square. "Rounded rectangle" reads as capable without being soft.
- **Primary:** Near-black background (`--color-goal`, `oklch(18.4% 0.006 255)`), inverted white text, 38px height, 16px side padding. Hover lightens to `oklch(27.5% 0.008 255)`. No transition beyond background color.
- **Ghost / Secondary:** Off-white background (`--color-node`), border (`--color-border`), secondary text color. 30px height for header controls, 36px for post-completion navigation. Hover shifts border to `--color-border-mid` and text to primary.
- **Disabled / Saving states:** `opacity: 0.7`, `cursor: default`. Never hidden — presence communicates that the action exists but is in-progress.

### Node Cards (Skill Tree)

The primary interactive element of the graph canvas.

- **Shape:** Rounded rectangle, radius varies by node type
- **Default background:** `--color-node` (off-white, near-chrome)
- **Current node:** `--color-node-current` (periwinkle-tinted), `--shadow-node-active`
- **Completed node:** `--color-node-done` (sage-tinted), green checkmark badge
- **Locked node:** `--color-node-locked` (near-chrome, desaturated), disabled interaction
- **Selected:** `--shadow-node-selected` (accent ring + lift)
- **Border:** `--color-border` at rest; `--color-border-accent` on current/active

### Lesson Content Blocks

The lesson page has three distinct content block types with intentionally different visual weight:

- **Prose sections:** No container. Plain text on canvas. h3 title + body paragraph, 32px gap between sections.
- **Worked example:** `--color-panel` background, 10px radius, 20px/24px padding. "WORKED EXAMPLE" uppercase eyebrow label above the heading. Distinguishes applied content from explanatory prose by form, not color.
- **Try this:** Separated by a `--color-border` top rule, 28px top padding, "TRY THIS" uppercase eyebrow label. Terminal content — signals the learner's turn.

### Lesson Sidebar (Aside)

- Three grouped blocks: Concept (name + description), Goal (end goal), Actions (Mark complete + post-completion navigation)
- Concept and Goal blocks separated by a `--color-border` top rule
- No sidebar border — column separation achieved by the 56px gap alone
- Sticky positioning: `top: 72px` (below fixed header)

### Misconceptions List

Numbered (not bulleted) with `01 / 02` tabular-numeric counters in muted text, two-column grid layout. The numbering signals that order and count matter — these are discrete things to watch for, not a prose list.

### Header / Navigation Bar

- Fixed, 48px height, `--color-chrome` background, `--color-border` bottom rule
- Logo mark: 22px rounded square (`--color-goal` fill, white dot), Pathwise wordmark at 14.5px/750
- Breadcrumb: node name (13px/650) + subject label (11px, muted) — two lines, truncated
- Back-to-graph ghost button right-aligned

### Skeleton / Loading States

Shimmer animation using a gradient sweep from `--color-chrome` through `--color-panel` back to `--color-chrome`. 7px border-radius. Varied widths (58%, 92%, 100%) and heights to approximate real content shapes.

## 6. Do's and Don'ts

### Do:
- **Do** use OKLCH for all color values. The canonical source of truth is `globals.css` `:root` declarations.
- **Do** use `--color-*` tokens for every color assignment. One-off hex values are prohibited unless you are authoring a new token.
- **Do** use uppercase eyebrow labels (10px/750/0.12em tracking) before section type changes: "CONCEPT", "END GOAL", "WORKED EXAMPLE", "TRY THIS". This is a system pattern, not decoration.
- **Do** vary spacing for rhythm. Lesson sections use 32px between sections, 36px before the title, 40px before "Watch for" and the worked example, 28px padding on the "Try this" section. Identical gaps are a mistake.
- **Do** distinguish content types by container form, not color. The worked example uses a panel background + padding. "Try this" uses a border-top separator. Both avoid color-as-differentiator.
- **Do** keep the lesson aside column-separated by gap alone (56px). No border-right.
- **Do** make completion navigation buttons the same visual weight as the "Back to graph" header button (ghost button style, 36px height). Completion should feel like a natural transition, not a reward moment.
- **Do** use font weight as the primary hierarchy instrument. The gap between 790 and 400 is the primary scale. Don't compensate for weak weight contrast with font size.

### Don't:
- **Don't** use blue-purple gradients, glowing orbs, or glassmorphism. This is the first anti-reference in PRODUCT.md for a reason: it is the default AI product aesthetic and Pathwise must be visibly different.
- **Don't** use gamification patterns: streaks, badges, confetti, progress bars with fill animations, celebratory success states. Completing a lesson is not an achievement to celebrate — it is a step taken.
- **Don't** add dashboard widgets, metric cards, or any unnecessary chrome around the core graph experience.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on any content block. Worked examples, callouts, and alerts use background tints or full-border containers instead.
- **Don't** use gradient text (`background-clip: text`). Single solid color for all text.
- **Don't** use identical card grids (icon + heading + body, repeated). The graph uses distinct node types. The lesson uses distinct section forms.
- **Don't** introduce a second typeface. Inter at varied weights handles all hierarchy. A second family adds visual weight without information.
- **Don't** animate layout properties (width, height, margin, padding, grid-template-columns). Transitions are background-color and opacity only.
- **Don't** use decorative shadows. Every shadow in the vocabulary has a semantic role: resting, active, selected, dragging, floating. A shadow not in `--shadow-*` is probably wrong.
- **Don't** use heavy textures, pattern overlays, or competing layer treatments. The graph canvas background may have a subtle structural grid; it must recede, not compete.
- **Don't** use `#000` or `#fff`. Every neutral is tinted. The darkest value is `oklch(18.4% 0.006 255)` (Ink Near-Black); the lightest is `oklch(99.4% 0.003 100)` (Chrome Off-White).
