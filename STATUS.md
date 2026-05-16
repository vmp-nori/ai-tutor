# Pathwise Build Status

Last updated: 2026-05-17

## Current Focus

We are implementing optional AI-generated lesson branches. A branch should literally start a side path from the current lesson node while leaving the main lesson graph intact, like:

- main path continues horizontally;
- anchor node has a visible offshoot;
- branch nodes are optional side content;
- branch progress never blocks or advances the main path.

The browser has exposed schema/version drift in Supabase: the branch metadata migration has been applied manually, but the remote database appears to be missing older optional graph metadata columns such as `difficulty_level`. The code now includes fallbacks so branch creation and dashboard rendering still work on that partially migrated schema.

## Done

- Added `supabase/migrations/0007_add_skill_tree_branches.sql`.
  - Adds `skill_nodes.is_branch`.
  - Adds `skill_nodes.branch_anchor_node_id`.
  - Adds `skill_nodes.branch_group_id`.
  - Adds `skill_nodes.branch_label`.
  - Adds index support and anchor FK.
- User manually applied migration `0007_add_skill_tree_branches.sql` in Supabase.
- Added `prompts/branchgeneration.txt` for compact optional branch generation.
- Added `POST /api/skill-tree/branch`.
  - Authenticates the user.
  - Verifies tree ownership.
  - Verifies anchor node ownership.
  - Calls Bedrock with the branch prompt.
  - Caps generated branches to 10 nodes.
  - Server controls layout and edges: anchor -> first branch node -> next branch node.
  - Inserts branch progress rows as `available`.
- Fixed branch API anchor lookup after browser error: `Anchor concept was not found`.
  - The route now uses adaptive anchor fetch fallbacks like the lesson page.
  - It reports real Supabase select errors instead of collapsing them into a 404.
- Fixed branch insertion after browser error: `Could not find the 'difficulty_level' column of 'skill_nodes' in the schema cache`.
  - Branch insertion first tries rich metadata.
  - If optional graph metadata columns are missing, it retries with only base node fields plus branch metadata.
- Updated dashboard graph loading.
  - Fetches branch metadata.
  - Has a branch-aware fallback for partially migrated databases.
  - Prevents branch nodes from being treated as main-path nodes when older optional metadata columns are missing.
- Updated graph rendering.
  - Branch nodes render as dashed/branch-styled side nodes.
  - Branch nodes show a `Branch` badge.
  - Branch edges render as dashed/accented edges.
  - Branch nodes are excluded from chapter rail grouping.
  - Branch nodes are excluded from top-bar completion totals.
  - Branch edges are excluded from pseudo end-goal edge calculation, so branches do not extend the main path.
- Updated progress completion.
  - Completing a branch node marks only that node complete.
  - Completing a branch node does not alter the main current node.
  - Completing a main node advances only through non-branch nodes.
- Updated docked AI chat.
  - Detects natural-language branch intent like “start a branch explaining gradient descent”.
  - Adds explicit `Branch` button beside `Send`.
  - Normal questions continue using `/api/screen-selection/ask`.
- Updated screen-selection overlay.
  - Replaced the old “Soon” branch CTA with the real `/api/skill-tree/branch` call.
  - Sends selected text/context with branch requests.
- Updated `src/lib/types.ts` with branch metadata fields.
- Updated `STATUS.md` repeatedly as branch debugging progressed.

## Current Known Issues / Risks

- Remote Supabase schema appears partially migrated.
  - `0007` branch columns exist now.
  - At least `difficulty_level` was missing from Supabase schema cache or database.
  - Other older optional metadata columns may also be missing: `teaching_plan`, `zone`, `zone_color`, `position_z`, etc.
  - Code fallbacks should tolerate this, but the cleaner fix is to apply all missing migrations through `0006` as well as `0007`.
- Supabase CLI could not be used locally.
  - `npx supabase` works.
  - `npx supabase link` failed because the saved `SUPABASE_ACCESS_TOKEN` in `.env.local` was rejected as unauthorized.
  - There is no local Supabase CLI login profile and no DB URL/password in `.env.local`.
- Branch rendering still needs browser confirmation after the latest dashboard fallback fix.
  - The intended behavior is exactly the user-provided sketch: main path intact, side branch off the anchor.

## Needs To Be Done

- Browser-test branch generation again after the latest fixes:
  - Open a lesson.
  - Use a simple prompt: `start a branch explaining gradient descent`.
  - Confirm branch creation completes.
  - Refresh dashboard.
  - Confirm the branch appears as a side offshoot, not inline in the main path.
- Browser-test all branch entry points:
  - natural-language branch request in docked chat;
  - explicit `Branch` button;
  - selection overlay branch CTA.
- Verify branch progress behavior:
  - complete a branch lesson and confirm main current node is unchanged;
  - complete a main lesson and confirm branch nodes are ignored for main advancement.
- Database spot-check after branch creation:
  - branch nodes share the original `tree_id`;
  - branch nodes have `is_branch=true`;
  - `branch_anchor_node_id`, `branch_group_id`, and `branch_label` are populated;
  - edges chain from anchor -> branch node 1 -> branch node 2.
- Consider applying missing older migrations to Supabase, especially:
  - `0003_store_generated_skill_tree_metadata.sql`;
  - `0004_refresh_skill_tree_graph_rpc.sql`;
  - `0005_add_teaching_plan_to_skill_nodes.sql`;
  - `0006_add_lesson_prompt_category_to_skill_nodes.sql`.
- Browser-check earlier non-branch work:
  - lesson persistence from Supabase or `.pathwise-dev-cache/lessons.json`;
  - compare-slide layout;
  - docked AI chat lesson context;
  - Markdown/LaTeX rendering in chat and lessons.

## Verification

- `npm run build` passed after:
  - initial branch route/UI/graph/progress implementation;
  - adaptive branch anchor lookup fix;
  - minimal branch insert fallback for missing optional metadata columns;
  - branch-aware dashboard fetch fallback.

## Important Context

- The worktree was already heavily modified before this branch work. Do not revert unrelated files.
- `.env.local`, `.mcp.json`, `.codex/config.toml`, and `.pathwise-dev-cache/` must not be committed.
- `.env.example` is currently deleted in this worktree; docs should not assume it exists unless restored.
- The user wants branches to be literal graph offshoots, not inserted inline into the main learning path.
