# Plan
**Problem:** HTML preview executes untrusted code by default, requiring a safe-by-default preview with an explicit trusted toggle.  
**Goal (Definition of Done):** Safe preview renders HTML/CSS without executing scripts; React/JSX previews require user-enabled trusted mode; trusted mode resets on code change.  
**Scope:** `HtmlPreview` behavior and small helper utilities/tests | **Out of scope:** Bundling React/Babel locally, removing all CDN usage in trusted mode.  
**Risks/Impact:** Potential preview regressions if CSP or toggle logic is incorrect.  
**Rollback:** Revert changes to `components/HtmlPreview.tsx` and `lib/html-preview.ts`.  

## TODO
- [ ] Add helper utilities + tests for safe preview doc generation
- [ ] Gate trusted preview behind explicit toggle in `HtmlPreview`
- [ ] Run lint/typecheck
- [ ] Manually verify safe/trusted preview flows
- [ ] Update High-Level Updates + Review

## High-Level Updates
- 

## Review
**Summary:**  
- 

**Trade-offs:**  
- 

**Follow-ups:**  
- 
