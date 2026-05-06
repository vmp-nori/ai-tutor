# Repository Guidelines

## Karpathy-Inspired Agent Behavior

These project-scoped coding guidelines are adapted from `forrestchang/andrej-karpathy-skills`.
They apply when writing, reviewing, or refactoring code in this repository.

### Think Before Coding

Do not assume silently. State important assumptions, surface ambiguity, and ask for clarification
when the request or code context is genuinely unclear. If a simpler approach exists, say so and
explain the tradeoff.

### Simplicity First

Write the minimum code that solves the requested problem. Do not add speculative features,
single-use abstractions, unrequested configurability, or handling for impossible scenarios. If a
solution is becoming much larger than the problem warrants, simplify it before continuing.

### Surgical Changes

Touch only the files and lines needed for the user's request. Do not refactor, reformat, or
"improve" adjacent code unless it is required for the task. Remove only imports, variables, or
helpers made unused by your own changes; mention unrelated dead code instead of deleting it.

### Goal-Driven Execution

For non-trivial tasks, define concrete success criteria and verify against them. Prefer checks that
prove the requested behavior, such as focused tests, builds, linting, or manual validation. Keep
working until the stated goal is met or a real blocker is identified.

## Project Structure & Module Organization

This repository contains a Next.js app named `pathwise`.

- `src/app/` contains App Router routes and page-level UI:
  - `page.tsx` — landing/home (waitlist form)
  - `dashboard/page.tsx` — authenticated user dashboard
  - `generate/page.tsx` + `GeneratePageClient.tsx` — skill tree generation flow. After a path is generated and saved, the client renders `SkillTreeLoader` in-place. The TopBar "+ New path" button calls an `onNewPath` callback (threaded through `SkillTreeLoader` → `SkillTreeCanvas` → `TopBar`) that resets local state back to the generate form, avoiding a stale same-URL navigation.
  - `learn/[treeId]/[nodeId]/LessonPageClient.tsx` — lesson page; fetches or returns a cached lesson via `api/lessons/generate`, renders sections, worked example, misconceptions, and diagram, and handles progress completion.
  - `sign-in/page.tsx`, `sign-up/page.tsx` — Supabase auth pages
  - `api/skill-tree/generate/route.ts` — streams a Bedrock `ConverseStream` response as plain text; default model is Claude Opus 4.7; can be overridden by `BEDROCK_MODEL_ID`.
  - `api/skill-tree/save/route.ts` — validates and persists a generated schema via the `create_skill_tree_with_graph` Postgres RPC.
  - `api/lessons/generate/route.ts` — generates a lesson for a skill node via Bedrock; default model is Claude Sonnet 4.6. Returns `skill_nodes.generated_lesson` if already cached; otherwise calls Bedrock and writes the result back. System prompt loaded from `prompts/lessongeneration.txt`.
  - `api/progress/complete/route.ts` — marks a node complete and advances progress to the next node.
  - `api/waitlist/route.ts` — records waitlist signups.
- `src/components/skill-tree/` contains `SkillTreeCanvas` (main graph renderer), `SkillTreeLoader` (dynamic-import wrapper), `SkillNode`, and `SkillEdge`.
- `src/components/ui/TopBar.tsx` — accepts optional `onNewPath` callback; renders a `<button>` instead of `<a href="/generate">` when provided, so in-page state resets work correctly.
- `src/lib/` contains shared types and utilities.
- `src/lib/supabase/` contains Supabase browser/server client helpers.
- `supabase/migrations/` contains SQL migrations applied to the Supabase project. Migration `0003` adds `teaching_brief`, `zone`, `zone_color`, `difficulty_level`, `is_checkpoint`, and `position_z` columns to `skill_nodes`, and defines the `create_skill_tree_with_graph` RPC. Migration `0005` adds `teaching_plan` (JSONB) to `skill_nodes`. Migration `0006` adds `generated_lesson` (JSONB) to `skill_nodes` for lesson caching. Run any unapplied migrations via the Supabase dashboard SQL editor if `supabase db push` is unavailable.
- `prompts/` contains system prompt text files loaded at request time: `graphgeneration.txt` (skill tree generation) and `lessongeneration.txt` (lesson generation). Edit these to change AI behavior without touching code.
- `.agents/` contains repo-shared agent skills, commands, and MCP templates. Treat it as agent-facing project metadata.
- Root config files include `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, and `postcss.config.mjs`.

There is no dedicated `tests/` directory yet. Add tests near the code they cover or introduce a clear `src/**/__tests__/` convention when a test runner is added.

## Build, Test, and Development Commands

Use npm scripts from `package.json`:

- `npm run dev` starts the Next.js dev server with Turbopack.
- `npm run build` creates a production build and catches TypeScript/build regressions.
- `npm run start` serves the production build.
- `npm run lint` runs the configured Next/ESLint lint command.

## Coding Style & Naming Conventions

Use TypeScript, React function components, and the existing component structure. Prefer named exports for shared utilities/components unless a file already follows another pattern. Use PascalCase for React components, camelCase for functions and variables, and kebab-case for route folders where appropriate. Keep CSS tokens and shared styling in `src/app/globals.css`; avoid one-off hardcoded colors when an existing token fits.

## Testing Guidelines

No test framework is currently configured. For now, validate changes with `npm run build` and targeted manual checks in the dashboard. When adding tests, document the runner in `package.json`, use clear names such as `SkillTreeCanvas.test.tsx`, and cover graph parsing, zoom behavior, and JSON import edge cases.

## Commit & Pull Request Guidelines

Recent commits use concise imperative summaries, for example `Add selected ECC agent skills` and `Refine graph UI and accent colors`. Follow that style: short subject, present tense, focused scope.

Pull requests should include a summary, verification steps, screenshots for visual UI changes, and notes for schema, MCP, or agent-skill changes. Do not include local secrets or generated build artifacts.

## Environment Variables

<!-- AUTO-GENERATED from .env.example -->

Copy `.env.example` to `.env.local` for local development.

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon public key | — |
| `SUPABASE_PROJECT_REF` | Yes | Supabase project ref for project-scoped MCP access | — |
| `SUPABASE_ACCESS_TOKEN` | No | Optional Supabase access token for non-OAuth MCP clients | — |
| `AWS_BEDROCK_REGION` | Yes | AWS region for Bedrock | `us-east-1` |
| `AWS_BEARER_TOKEN_BEDROCK` | One of* | Amazon Bedrock API key (preferred) | — |
| `AWS_ACCESS_KEY_ID` | One of* | IAM access key (alternative to bearer token) | — |
| `AWS_SECRET_ACCESS_KEY` | One of* | IAM secret key (alternative to bearer token) | — |
| `BEDROCK_MODEL_ID` | No | Override Bedrock model ID for all generation routes (graph default: Opus 4.7; lesson default: Sonnet 4.6) | — |
| `MEM0_API_KEY` | No | Mem0 API key | — |
| `FIRECRAWL_API_KEY` | No | Firecrawl API key | — |
| `GITHUB_PAT_TOKEN` | No | GitHub personal access token for Codex GitHub MCP | — |
| `NEXT_PUBLIC_APP_URL` | No | App base URL | `http://localhost:3000` |

\* Provide either `AWS_BEARER_TOKEN_BEDROCK` **or** the `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` pair.

<!-- END AUTO-GENERATED -->

## Security & Configuration Tips

Keep `.env*`, `.mcp.json`, and `.codex/config.toml` out of Git. Use `.agents/mcp.example.json` as the safe template for remote harness setup.
