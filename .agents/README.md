# Agent Setup

This repo carries shared agent skills and MCP examples so different harnesses can work on Pathwise remotely.

## Skills

- `skills/impeccable` - frontend design, polish, critique, and live UI iteration.
- `skills/firecrawl` - Firecrawl onboarding for web search, scraping, crawling, mapping, and app integration.
- `skills/backend-patterns` - Node.js, Express, and Next.js API architecture patterns.
- `skills/coding-standards` - universal TypeScript, JavaScript, React, and Node.js coding standards.
- `skills/continuous-learning-v2` - project-scoped instinct learning and confidence scoring.
- `skills/cpp-coding-standards` - modern C++ coding standards.
- `skills/frontend-patterns` - React, Next.js, state, performance, and UI implementation patterns.
- `skills/java-coding-standards` - Java conventions and modern Java idioms.

## Commands

- `commands/update-docs.md` - documentation update workflow from ECC.

Agent harnesses that support repo-local skills should load from `.agents/skills`.

## MCP

Use `.agents/mcp.example.json` as the project-safe template. Do not commit real API keys.

Required secrets:

```dotenv
MEM0_API_KEY=m0-...
FIRECRAWL_API_KEY=fc-...
```

For local work, copy the example into the MCP config location your harness expects and replace the placeholders with environment-variable references or injected secrets supported by that harness.
