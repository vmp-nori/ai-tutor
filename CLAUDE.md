# CLAUDE.md

Project-scoped instructions for Claude Code in this repository. Follow the repository guidance in
`AGENTS.md`, plus the Karpathy-inspired behavior below.

## Karpathy-Inspired Coding Guidelines

These guidelines are adapted from `forrestchang/andrej-karpathy-skills` and apply when writing,
reviewing, or refactoring code in this project.

### 1. Think Before Coding

Do not assume silently or hide confusion. Before implementing, state important assumptions, surface
ambiguous interpretations, and ask for clarification when the request or code context is genuinely
unclear. If a simpler approach exists, point it out and explain the tradeoff.

### 2. Simplicity First

Use the minimum code that solves the requested problem. Avoid speculative features, single-use
abstractions, unrequested configurability, and error handling for impossible scenarios. If the
solution is growing beyond the problem, simplify it.

### 3. Surgical Changes

Touch only what the task requires. Do not refactor, reformat, or improve adjacent code unless it is
necessary for the requested change. Remove only dead imports, variables, or helpers created by your
own edits. Mention unrelated dead code instead of deleting it.

### 4. Goal-Driven Execution

For non-trivial work, translate the request into verifiable success criteria and loop until those
criteria are met. Use focused tests, builds, linting, or manual checks that prove the requested
behavior. If verification is blocked, state the blocker clearly.
