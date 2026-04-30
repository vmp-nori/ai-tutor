# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Next.js app named `pathwise`.

- `src/app/` contains App Router routes and page-level UI, including the dashboard.
- `src/components/` contains reusable UI and graph components.
- `src/lib/` contains shared types and utilities.
- `src/db/` contains database-related code for Drizzle/Postgres.
- `.agents/` contains repo-shared agent skills, commands, and MCP templates. Treat it as agent-facing project metadata.
- Root config files include `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `drizzle.config.ts`, and `postcss.config.mjs`.

There is no dedicated `tests/` directory yet. Add tests near the code they cover or introduce a clear `src/**/__tests__/` convention when a test runner is added.

## Build, Test, and Development Commands

Use npm scripts from `package.json`:

- `npm run dev` starts the Next.js dev server with Turbopack.
- `npm run build` creates a production build and catches TypeScript/build regressions.
- `npm run start` serves the production build.
- `npm run lint` runs the configured Next/ESLint lint command.
- `npm run db:generate` generates Drizzle migrations.
- `npm run db:migrate` applies Drizzle migrations.
- `npm run db:push` pushes schema changes directly.
- `npm run db:studio` opens Drizzle Studio.

## Coding Style & Naming Conventions

Use TypeScript, React function components, and the existing component structure. Prefer named exports for shared utilities/components unless a file already follows another pattern. Use PascalCase for React components, camelCase for functions and variables, and kebab-case for route folders where appropriate. Keep CSS tokens and shared styling in `src/app/globals.css`; avoid one-off hardcoded colors when an existing token fits.

## Testing Guidelines

No test framework is currently configured. For now, validate changes with `npm run build` and targeted manual checks in the dashboard. When adding tests, document the runner in `package.json`, use clear names such as `SkillTreeCanvas.test.tsx`, and cover graph parsing, zoom behavior, and JSON import edge cases.

## Commit & Pull Request Guidelines

Recent commits use concise imperative summaries, for example `Add selected ECC agent skills` and `Refine graph UI and accent colors`. Follow that style: short subject, present tense, focused scope.

Pull requests should include a summary, verification steps, screenshots for visual UI changes, and notes for schema, MCP, or agent-skill changes. Do not include local secrets or generated build artifacts.

## Security & Configuration Tips

Copy `.env.example` for local configuration. Keep `.env*`, `.mcp.json`, and `.codex/config.toml` out of Git. Use `.agents/mcp.example.json` as the safe template for remote harness setup.
