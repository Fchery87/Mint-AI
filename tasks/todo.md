# Plan
**Problem:** Mint AI can generate code, but it lacks the core “online coding platform loop” (editable workspace + run + safety + diffs/rollback + agent/tools), so users can’t iteratively build like Codex/Cursor/Claude Code online.  
**Goal (Definition of Done):** All of the below work end-to-end in the browser: (1) edit single + multi-file outputs with persistence across reloads, (2) run JS/TS projects and Python, (3) hardened preview isolation, (4) view diffs + revert/apply + export patch/zip, (5) Ask vs Agent mode + checkpoints/rollback + optional web search tooling.  
**Scope:** UI + local persistence + existing API route changes only (no new deps, no auth, no backend DB) | **Out of scope:** GitHub import/push, real multi-user collab, server-side sandboxes, full MCP SDK/server marketplace, accounts/billing.  
**Risks/Impact:** Security (untrusted code in preview iframe), performance (large projects in storage), provider compatibility (tool calling differs across LLM APIs), CSP constraints.  
**Rollback:** Revert workspace runner/editor/diff changes; keep generator-only flow (existing Preview/Project viewer).  

## TODO
- [x] Reproduce current UX gaps (no editing/persistence/run/diff)
- [x] Workspace v1: introduce editable file model for single + project outputs
- [x] Workspace v1: persist workspace to IndexedDB (fallback to localStorage if needed)
- [x] Workspace v1: restore workspace on reload + “Reset workspace” action
- [x] Run v1: run Python via Pyodide executor when language is Python
- [x] Run v1: run JS/TS project via Sandpack when project is runnable
- [x] Safety v1: harden preview iframe sandbox + message origin/source checks
- [x] Git v1: snapshot “base” on generation; show diff (base vs current) per file
- [x] Git v1: revert file/all to base; create checkpoints; restore checkpoint
- [x] Git v1: export zip from current workspace; export .patch from base→current
- [x] Agent v1: add mode toggle (Ask vs Agent) and wire into API prompt/context
- [x] Agent v1: optional web search toggle (Exa fetch + inject citations) behind env var
- [x] Add/adjust targeted tests for new pure utilities (diff/patch + persistence)
- [x] Run lint / type / build checks
- [x] Verify acceptance criteria (binary checklist)
- [x] Prepare PR with summary + rollback steps

## High-Level Updates
- 2025-12-19 – Planned “Workspace/Run/Safety/Git/Agent v1” to move from generator-only to an iterative online coding loop (reason: compete with Codex/Cursor/Claude Code online UX).
- 2025-12-19 – Added persisted workspace + editor with checkpoints/diffs so users can modify outputs and recover from overwrites (reason: enable real iterate/edit loop).
- 2025-12-19 – Added browser execution paths (Pyodide for Python, Sandpack for JS/TS projects) and tightened preview iframe isolation (reason: “run” + safer untrusted code handling).
- 2025-12-19 – Added Ask/Agent mode and optional Exa web search enrichment behind env flags (reason: separate “chat” from “changes” and ground answers with fresh sources).

## Review
**Summary:**  
- Added `components/WorkspacePanel.tsx` to unify preview/editor/diff/run with ZIP + patch export, checkpoints, and revert.  
- Added workspace persistence (`lib/workspace-storage.ts`) + state model (`lib/workspace.ts`).  
- Added diff/patch generation (`lib/diff.ts`) with tests (`lib/diff.test.ts`).  
- Hardened iframe preview isolation (`components/LivePreview.tsx`) and updated CSP for Sandpack (`next.config.ts`).  
- Added Agent/Ask mode + optional Exa web search enrichment (`app/api/chat/route.ts`, `lib/prompts.ts`).  

**Trade-offs:**  
- Workspace is client-side only (IndexedDB/localStorage); no multi-device sync or team collaboration.  
- Sandpack execution depends on external CodeSandbox bundler endpoints; CSP was expanded accordingly.  

**Follow-ups:**  
- Replace textarea editor with Monaco + multi-cursor/search (requires new deps).  
- Implement true “apply agent edits onto existing workspace” (patch-based) instead of replace-on-generate + checkpoint rollback.  

## Previous Work (Completed)
- 2025-12-18 – Fixed reasoning/code leakage by terminating reasoning at ``` fences and preventing partial `</reasoning>` leaks; added `app/api/chat/route.test.ts`.
