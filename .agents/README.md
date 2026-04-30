# Agent Setup

This repo carries shared agent skills and MCP examples so different harnesses can work on Pathwise remotely.

## Skills

- `skills/impeccable` - frontend design, polish, critique, and live UI iteration.
- `skills/firecrawl` - Firecrawl onboarding for web search, scraping, crawling, mapping, and app integration.

Agent harnesses that support repo-local skills should load from `.agents/skills`.

## MCP

Use `.agents/mcp.example.json` as the project-safe template. Do not commit real API keys.

Required secrets:

```dotenv
MEM0_API_KEY=m0-...
FIRECRAWL_API_KEY=fc-...
```

For local work, copy the example into the MCP config location your harness expects and replace the placeholders with environment-variable references or injected secrets supported by that harness.
