# Product

## Register

product

## Landing Page Register

brand

## Product Name & Tagline

**Pathwise** — "Don't know where to start? Start here."

## Landing Page Purpose

Convert cold organic/social traffic into waitlist signups. The emotional job: make visitors feel the gap they didn't know they had — they have a skill they want to learn and no real map to get there — and then immediately offer the solution. The pitch is not "look what AI can do"; it is "you've been stuck at step zero and here's the exit."

## Landing Page Emotional Arc

1. Recognition: the visitor sees their own problem named precisely.
2. Credibility: the product looks serious enough to trust with that problem.
3. Action: one clear step, no commitment required (waitlist).

## Users

Anyone who wants to learn a complex skill or doesn't know how to structure their path toward a high-level goal — self-taught developers, career changers, students, autodidacts. Their context: they have an end goal in mind but lack a clear map to get there. The primary job is navigating from where they are to where they want to be, one atomic concept at a time.

## Product Purpose

An AI-powered educational platform with two integrated systems:

**Graph generation.** Given a goal, Pathwise uses Claude Opus 4.7 to decompose it into atomic prerequisite concepts arranged into a linear DAG — revealing the hidden structure of a subject so the learner always knows what to learn next and why.

**Lesson delivery.** Each node in the graph is a teachable concept with a dedicated lesson page, generated on first visit by Claude Sonnet 4.6 and cached permanently. Lessons include focused explanatory sections, a concrete worked example, common misconceptions numbered for scan-ability, an optional interactive diagram (sandboxed SVG/canvas/vanilla JS), and a "try this" self-guided practice prompt. The graph generation phase injects a structured teaching plan (objective, goal context, focus points, detours to avoid) into every node, which the lesson model consumes to stay aligned with the learner's actual goal.

**Progress.** Learners move through the graph one node at a time. Completing a lesson marks it done and advances the current pointer to the next node.

Success is when a user can go from "I want to learn X" to a structured, AI-tutored curriculum in seconds — and follow it concept by concept to completion.

## Brand Personality

Precise. Structural. Capable.

Not gamified, not cheerful, not corporate. The tone is that of a brilliant mentor who maps out the territory clearly and gets out of the way. Utilitarian in the best sense: every element earns its place.

## Anti-references

- Generic AI product sites: blue-purple gradients, glowing orbs, glassmorphism, "the future is here" hero copy.
- Overcomplicated visual noise: heavy textures, pattern overlays, too many layers competing for attention.
- Gamified learning apps (Duolingo-style): streaks, badges, confetti, excessive color, childlike illustration.
- Dashboard bloat: widgets, metric cards, unnecessary chrome around the core experience.

## Design Principles

1. **The graph is the product.** The skill tree visualization is the primary UI, not a feature inside a page. Design centers and serves it.
2. **The lesson is a reading experience.** Lesson pages are the second primary surface. They must be calm, typographically clear, and free of chrome. The learner is reading and thinking — nothing should compete for attention.
3. **Structure reveals meaning.** The DAG layout should make concept dependencies legible without labels explaining them. Visual hierarchy does the cognitive work.
4. **Earn every element.** No decorative surfaces, no filler copy, no chrome for its own sake. If it doesn't serve the learner's task, it doesn't exist.
5. **Tool confidence.** This is a precision instrument for serious learners. It should feel capable and calm — not playful, not loud, not anxious.
6. **Get out of the way.** The interface recedes so the learner's mental model can expand. Minimal UI, maximum clarity.

## Accessibility & Inclusion

WCAG AA minimum. Skill tree navigation must be keyboard-accessible. Color cannot be the sole indicator of node state (completed, active, locked). Reduced-motion preference respected for any graph animations.
