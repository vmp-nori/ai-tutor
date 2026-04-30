---
name: firecrawl
description: |
  Firecrawl gives AI agents and apps fast, reliable web context with
  search, scraping, crawling, mapping, and browser interaction tools.
  Use when an agent needs live web data or needs to wire Firecrawl into
  application code.
---

# Firecrawl

Firecrawl helps agents search first, scrape clean content, crawl or map sites,
and interact with live pages when plain extraction is not enough.

## Install

Firecrawl publishes one command that installs its CLI tools and agent skills:

```bash
npx -y firecrawl-cli@latest init --all --browser
```

That setup provides:

- CLI tools such as `firecrawl search`, `firecrawl scrape`, `firecrawl crawl`, `firecrawl map`, and `firecrawl interact`
- task-focused skills for search, scrape, crawl, map, interact, and app integration
- browser auth for signing in or creating a Firecrawl account

Before real work, verify the install:

```bash
mkdir -p .firecrawl
firecrawl --status
firecrawl scrape "https://firecrawl.dev" -o .firecrawl/install-check.md
```

## Choose A Path

- Need web data during this session: use live CLI tools.
- Need to add Firecrawl to app code: integrate the API or SDK with `FIRECRAWL_API_KEY`.
- Need an account or API key first: finish browser auth or ask the human for the key.
- Need no install: call the REST API directly.

## Live Web Work

Default flow:

1. Use search when discovery is needed.
2. Scrape once you have a target URL.
3. Use crawl or map for site-wide discovery.
4. Use interact only when the page requires clicks, forms, navigation, or login.

Prefer clean markdown output for agent context, and store temporary extraction
artifacts in `.firecrawl/`.

## App Integration

For product code, inspect the repo first and add Firecrawl where the project
already handles API clients and secrets.

Required environment variable:

```dotenv
FIRECRAWL_API_KEY=fc-...
```

Base URL:

```text
https://api.firecrawl.dev/v2
```

Auth header:

```text
Authorization: Bearer fc-YOUR_API_KEY
```

Common endpoints:

- `POST /search` - discover pages by query, optionally with full page content
- `POST /scrape` - extract clean markdown from one URL
- `POST /crawl` - extract many pages from a site
- `POST /map` - discover indexed URLs for a site
- `POST /interact` - operate a browser session for dynamic pages

The required product question before implementation is:

```text
What should Firecrawl do in the product?
```

Route the answer to search, scrape, crawl, map, or interact, then run one real
request as a smoke test when a valid key is available.

## MCP

This repo includes MCP examples in `.agents/`:

- `.agents/mcp.example.json` for hosted HTTP MCP servers
- `.agents/mcp.local-npx.example.json` for local `npx firecrawl-mcp`

Do not commit real API keys. Use `FIRECRAWL_API_KEY` and `MEM0_API_KEY` through
the harness secret manager or local environment.

Official references:

- https://www.firecrawl.dev/skills
- https://docs.firecrawl.dev/mcp-server
- https://github.com/firecrawl/firecrawl-mcp-server
- https://github.com/firecrawl/skills
