# Plan
**Problem:** The Reasoning UI streams into a single block, but you want each reasoning section to appear as its own “bubble” in order (Thinking → Problem → Approach → Key Decisions → Scope → Complexity Check) as the model streams.  
**Goal (Definition of Done):** While reasoning is streaming, each section renders as its own sequential mini-bubble (only showing once it has content) and updates in real time without mixing sections.  
**Scope:** UI-only change to `components/ReasoningBlock.tsx` (parsing + rendering) | **Out of scope:** Server/SSE changes; splitting reasoning into separate chat messages; prompt changes.  
**Risks/Impact:** Models may not follow the exact “- **Section**:” format; ensure fallback rendering still works.  
**Rollback:** Revert `components/ReasoningBlock.tsx` changes to restore the single-block reasoning UI.  

## TODO
- [ ] Confirm desired UI behavior (mini-bubbles vs separate messages)
- [ ] Update reasoning parser to split sections incrementally
- [ ] Render ordered mini-bubbles with streaming updates
- [ ] Add/adjust targeted tests (if applicable)
- [ ] Run type / build checks
- [ ] Verify acceptance criteria
- [ ] Prepare PR with summary + rollback steps

## High-Level Updates
- 2025-12-19 – Planned UI change to stream reasoning sections as sequential mini-bubbles (reason: match common AI coding platform UX).

## Review
**Summary:**  
- TBD

**Trade-offs:**  
- TBD

**Follow-ups:**  
- TBD

## Previous Work (Completed)
- 2025-12-18 – Fixed reasoning/code leakage by terminating reasoning at ``` fences and preventing partial `</reasoning>` leaks; added `app/api/chat/route.test.ts`.
