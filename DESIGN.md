---
name: Pathwise
description: A precise, structural landing-page design system for mapping any learning goal.
colors:
  paper: "oklch(96.8% 0.014 168)"
  paper-deep: "oklch(92.2% 0.025 168)"
  panel: "oklch(98.8% 0.009 168)"
  ink: "oklch(16.8% 0.018 238)"
  ink-soft: "oklch(36% 0.024 238)"
  muted: "oklch(53% 0.021 212)"
  line: "oklch(82% 0.035 184)"
  line-strong: "oklch(47% 0.112 174)"
  green: "oklch(67% 0.145 164)"
  amber: "oklch(78% 0.153 76)"
  coral: "oklch(66% 0.17 28)"
  blue: "oklch(61% 0.14 246)"
  dark: "oklch(17.5% 0.02 236)"
  dark-line: "oklch(31% 0.031 236)"
typography:
  display:
    fontFamily: "var(--font-display), ui-sans-serif, system-ui, sans-serif"
    fontSize: "5.8rem"
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: "0"
  headline:
    fontFamily: "var(--font-display), ui-sans-serif, system-ui, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: "0"
  title:
    fontFamily: "var(--font-display), ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "0"
  body:
    fontFamily: "var(--font-display), ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "var(--font-display), ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "28px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "50px"
  button-dark-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.dark}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "50px"
  input-email:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "50px"
  chip-status:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.xs}"
    padding: "4px 8px"
---

# Design System: Pathwise Landing

## 1. Overview

**Creative North Star: "The Moving Curriculum Blueprint"**

Pathwise should feel like a precise learning map laid on tinted drafting paper: quiet, technical, and alive. The landing page proves the product by letting the graph become the atmosphere. It is not a marketing decoration; it is the interface behaving as brand.

The system is light by default because the product asks learners to inspect structure. Dark sections are used as deliberate contrast chambers for the problem and final action, not as a general app theme. Motion is slow, continuous, and structural: graph drift, path traces, scroll parallax, and staged entrances. It must never feel celebratory, gamified, or ornamental.

**Key Characteristics:**
- Product-first hero: the animated skill-tree background carries the page.
- Technical paper surfaces: off-white, gridded, tinted, never pure white.
- Hard-working typography: large, heavy, compact, and direct.
- Precision accents: green, amber, coral, and blue have named jobs.
- Motion with purpose: show traversal, dependency, and progress.

## 2. Colors

The palette is a restrained full palette: tinted neutrals do most of the work, while four accents mark state, warning, energy, and path movement.

### Primary
- **Blueprint Ink** (`ink`): The primary text and primary button color. Use it for high-confidence actions and for the dense product-shell chrome.
- **Verdigris Signal** (`green`): The activation color. Use it for current learning state, success marks, and dark-section primary CTAs.

### Secondary
- **Amber Checkpoint** (`amber`): Use for numbered blockers, checkpoint nodes, and learning milestones. It should appear as a signal, never a wash.
- **Coral Interrupt** (`coral`): Use for section labels, error states, and the small hero marker. It names friction without making the page feel alarmed.

### Tertiary
- **Path Blue** (`blue`): Use for animated graph traces and secondary graph energy. Do not let it become a generic SaaS blue brand color.
- **Strong Line Teal** (`line-strong`): Use for active dependency lines, labels, focus states, and product-map structure.

### Neutral
- **Drafting Paper** (`paper`): Main landing-page canvas. It must stay tinted and gridded.
- **Deep Drafting Paper** (`paper-deep`): Secondary surface or background depth.
- **Instrument Panel** (`panel`): Inputs, graph nodes, and product-shell panels.
- **Soft Ink** (`ink-soft`): Supporting copy and secondary navigation.
- **Measured Muted** (`muted`): Proof text, metadata, placeholders, and quiet labels.
- **Hairline Teal** (`line`): Section dividers, input borders, product-shell grid, and graph zones.
- **Night Graphite** (`dark`): Problem and close sections only.
- **Night Divider** (`dark-line`): Borders and row rules on dark sections.

### Named Rules

**The Graph Color Rule.** Green, amber, coral, and blue are state colors first. Do not use them as random decorative fills.

**The Tinted Neutral Rule.** Pure white and pure black are forbidden. Every neutral should carry a small hue bias toward the Pathwise paper or graphite family.

## 3. Typography

**Display Font:** `var(--font-display), ui-sans-serif, system-ui, sans-serif`  
**Body Font:** `var(--font-display), ui-sans-serif, system-ui, sans-serif`  
**Label/Mono Font:** No separate mono voice in the landing system.

**Character:** Heavy, close, and structural. The type should feel like labels on a serious instrument, not like generic tech marketing. Scale and weight provide hierarchy; letter spacing stays at `0`.

### Hierarchy
- **Display** (800, `5.8rem`, `0.94`): Hero headline only. Keep it short enough to operate as a shape.
- **Headline** (800, `4.5rem`, `0.94`): Major section claims and closing calls.
- **Title** (800, `26px`, `1.08`): System rows and compact product-surface titles.
- **Body** (400, `19px`, `1.55`): Hero body and section explanation. Keep line length below `56ch`.
- **Label** (800, `13px`, `1`): Section labels, form labels, metadata, and compact UI text. Short labels may use uppercase only inside product nodes.

### Named Rules

**The No-Decorative-Type Rule.** Do not use gradient text, italic display flourishes, typewriter fonts, or monospace as a shortcut for "technical."

**The Dense-But-Legible Rule.** Compact labels are allowed, but body copy needs breathing room. Do not compress paragraph line-height below `1.5`.

## 4. Elevation

The landing system is mostly flat. Depth appears when an element needs to feel like a usable product surface: the animated product shell, graph legend, inputs on focus, and primary buttons on hover. Shadows must be soft, broad, and low-contrast.

### Shadow Vocabulary
- **Product Shell Lift** (`0 34px 92px oklch(28% 0.035 185 / 0.16)`): Use only for the signature graph surface or similarly important app-preview panels.
- **Floating Control** (`0 18px 50px oklch(32% 0.04 185 / 0.13)`): Use for compact floating legends, popovers, and small overlay controls.
- **Button Hover Lift** (`0 10px 22px oklch(20% 0.02 238 / 0.14)`): Use only on interactive hover, not at rest.
- **Focus Ring** (`0 0 0 3px oklch(67% 0.145 164 / 0.18)`): Use for focused fields and clear keyboard interaction.

### Named Rules

**The Flat-At-Rest Rule.** Most surfaces are separated by lines, grid, contrast, and spacing. Shadows are earned by interaction or signature product preview.

## 5. Components

### Buttons
- **Shape:** Firm rounded rectangle (`8px`). Never pill-shaped for primary actions.
- **Primary:** Blueprint Ink background with Drafting Paper text, `50px` height, `0 20px` padding, `15px` bold text.
- **Dark Primary:** Verdigris Signal background with Night Graphite text for dark sections.
- **Hover / Focus:** Hover lifts by `translateY(-1px)` and may add Button Hover Lift. Active state compresses to `scale(0.985)`.
- **Secondary / Nav:** Compact nav actions use `34px` height and `6px` radius.

### Chips
- **Style:** Small rectangular status chips with `4px` radius, hairline border, and bold `12px` text.
- **State:** Chips are informational. Do not use them as decorative badges or gamified achievements.

### Cards / Containers
- **Corner Style:** Graph surfaces use `10px`; repeated product nodes use `7px` to `8px`.
- **Background:** Use Instrument Panel or translucent Drafting Paper. Avoid nested cards.
- **Shadow Strategy:** Product Shell Lift for the main graph preview only; otherwise rely on borders and tonal separation.
- **Border:** Hairline Teal at `1px`.
- **Internal Padding:** Product shell topbar uses `18px`; forms use `16px`; content sections use large rhythm from `28px` to `102px`.

### Inputs / Fields
- **Style:** `50px` height, Instrument Panel background, Hairline Teal border, `8px` radius, `15px` semibold text.
- **Placeholder:** Animated placeholder is allowed for the waitlist field only. It must stop once the user types.
- **Focus:** Strong Line Teal border with Verdigris focus ring and a `translateY(-1px)` lift.
- **Error / Disabled:** Coral border and soft Coral ring for errors; disabled state uses opacity, not layout change.

### Navigation
- **Style:** Fixed `58px` top bar on paper, `1px` bottom border, bold wordmark, compact links, and one dark action button.
- **Typography:** Wordmark is `18px` and `800`; nav actions are `13px` and `700`.
- **Mobile:** Hide secondary links before compressing the wordmark or CTA.

### Signature Component: Animated Skill-Tree Background

The graph is the brand object. It should use a product-shell topbar, chapter zones, dependency lines, stateful nodes, progress metadata, and a small legend. Continuous motion is required: slow graph drift, moving path traces, a staged first load, and scroll-linked parallax. Respect `prefers-reduced-motion` by disabling motion without removing the graph.

## 6. Do's and Don'ts

### Do:
- **Do** make the graph the first visual signal. The product visualization is not a supporting illustration.
- **Do** use Drafting Paper, Hairline Teal, and Blueprint Ink as the default interface foundation.
- **Do** use `8px` radius for primary controls and keep cards at `10px` or less.
- **Do** use motion to explain traversal, dependency, progress, and state.
- **Do** keep app redesign surfaces dense but calm: compact topbars, clear graph zones, restrained panels, and meaningful labels.
- **Do** respect reduced motion for every graph, scroll, and type animation.

### Don't:
- **Don't** use generic AI product sites: blue-purple gradients, glowing orbs, glassmorphism, or "the future is here" hero copy.
- **Don't** add overcomplicated visual noise: heavy textures, pattern overlays, or too many competing layers.
- **Don't** make Pathwise feel like gamified learning apps (Duolingo-style): streaks, badges, confetti, excessive color, or childlike illustration.
- **Don't** create dashboard bloat: widgets, metric cards, or unnecessary chrome around the core graph experience.
- **Don't** use gradient text, side-stripe card accents, nested cards, or rounded pill CTAs.
- **Don't** redesign the app with the old dashboard palette as the reference. The landing page is the new visual target.
