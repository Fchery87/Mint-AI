# Plan
**Problem:** The chat stream can include fenced code blocks inside `<reasoning>...</reasoning>`, causing the Reasoning UI to display code when it should be reasoning-only text.  
**Goal (Definition of Done):** When the model outputs a ``` fenced block before `</reasoning>`, the server stops reasoning at the fence and the client never receives that fenced block via `reasoning-chunk` SSE events.  
**Scope:** Fix reasoning stream parsing in `app/api/chat/route.ts` | **Out of scope:** Prompt tuning/model behavior changes; UI redesign of the reasoning panel.  
**Risks/Impact:** Streaming parser edge cases (tags split across chunks); ensure no infinite loops or lost explanation/code content.  
**Rollback:** Revert the changes in `app/api/chat/route.ts` to restore previous streaming behavior.  

## TODO
- [x] Reproduce bug / failing test
- [x] Identify root cause in `app/api/chat/route.ts`
- [x] Implement minimal fix
- [x] Add/adjust targeted tests
- [x] Run type / build / unit checks
- [x] Verify acceptance criteria
- [ ] Prepare PR with summary + rollback steps

## High-Level Updates
- 2025-12-18 – Planned to end reasoning at the first fenced code block to prevent code from appearing in the Reasoning UI (reason: models occasionally place code before closing `</reasoning>`).
- 2025-12-18 – Updated the stream parser to treat ``` inside `<reasoning>` as an early terminator and emit `reasoning-complete` (reason: prevent fenced code from being streamed as reasoning).
- 2025-12-18 – Added a small unit test for the reasoning terminator split logic (reason: lock in behavior for the regression).
- 2025-12-18 – Verified with `bun test`, `bun typecheck`, and `bun --bun next build` (reason: ensure no regressions from parser change).

## Review
**Summary:**  
- Updated `app/api/chat/route.ts` to terminate reasoning on the first ``` fence (in addition to `</reasoning>`).
- Added `app/api/chat/route.test.ts` to cover the terminator parsing behavior.

**Trade-offs:**  
- Treating ``` inside reasoning as an implicit terminator may truncate any post-fence “reasoning” text, but prevents code leakage into the reasoning UI.
- `bun lint` currently fails because this Next.js CLI build has no `lint` subcommand and ESLint isn’t installed.

**Follow-ups:**  
- None.
