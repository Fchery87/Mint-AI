# Plan
**Problem:** Workspace commits in Agent mode fall back to a single `Component.tsx` because file markers are dropped during streaming when the code fence line includes both language and `file:` metadata.  
**Goal (Definition of Done):** When the model emits code fences with `file:` markers (even with an optional language token), the workspace file tree shows the correct paths (e.g., `app/page.tsx`, `components/TodoForm.tsx`) and no longer defaults to `Component.tsx`.  
**Scope:** Parsing of streamed code fences + project output parsing; targeted tests for parsing behavior | **Out of scope:** Prompt changes, UI redesign, workspace persistence changes.  
**Risks/Impact:** Incorrect parsing could break single-file outputs or non-TSX fences; needs test coverage for both.  
**Rollback:** Revert parsing changes in `app/api/chat/route.ts` and associated tests.  

## TODO
- [ ] Reproduce issue with a response that includes `file:` markers + language on fence line
- [ ] Identify root cause in `app/api/chat/route.ts`
- [ ] Implement minimal parsing fix for file markers (preserve `file:` when mixed with language)
- [ ] Add/adjust targeted tests for streaming parsing and multi-file detection
- [ ] Run lint / type / build checks
- [ ] Verify acceptance criteria
- [ ] Prepare PR with summary + rollback steps

## High-Level Updates
- 2026-01-17 – Preserved mixed language + file fence markers in streaming parser to keep multi-file outputs in workspace (reason: prevent fallback to `Component.tsx`).
- 2026-01-17 – Added streaming parser tests for mixed and file-only fences (reason: lock in multi-file detection behavior).
- 2026-01-17 – Added handling for file tags on the first line inside code blocks (reason: support models that emit ``` then `file:` on the next line).
- 2026-01-17 – Added inline `file:` marker parsing in `parseProjectOutput` (reason: some responses omit fences entirely).

## Review
**Summary:**  
- Preserved file markers in streaming even when a fence starts with a blank line and the `file:` tag appears on the next line.
- Added inline `file:` marker parsing in `parseProjectOutput` for fence-less outputs.
- Added tests covering mixed language/file fences, file-only fences, file tags inside code blocks, and inline file markers.

**Trade-offs:**  
- Inline file marker parsing treats any `file:` line as a new file boundary, so explanatory text after the last file is ignored in parsing.

**Follow-ups:**  
- None
