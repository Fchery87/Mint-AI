# Plan
**Problem:** Need a codebase review to identify weaknesses, poor coding, vulnerabilities, dead code, and security risks.  
**Goal (Definition of Done):** Produce a prioritized list of concrete findings with file references and risk context.  
**Scope:** Static review of repository code and config | **Out of scope:** Runtime pentest, dependency CVE scan, infrastructure review.  
**Risks/Impact:** Missing issues if key areas are overlooked.  
**Rollback:** Not applicable (review only).  

## TODO
- [x] Inventory security-sensitive entry points and data flows
- [x] Review API routes, auth/ratelimit, and external calls
- [x] Scan for unsafe parsing, injection, and secrets handling
- [x] Identify dead code or unused paths with evidence
- [x] Produce prioritized findings list with file references
- [x] Note verification gaps and suggested checks

## High-Level Updates
- 2026-01-17 – Completed repository review and documented security/quality findings with file references.

## Review
**Summary:**  
- Reviewed API routes, export flows, preview sandboxing, and in-memory state management.
- Identified client-side token usage risk, untrusted code execution surface, and rate-limit gaps.
- Noted unbounded in-memory storage and web search cost exposure.

**Trade-offs:**  
- Static review only; no runtime or dependency vulnerability scanning performed.

**Follow-ups:**  
- Consider automated dependency and SAST scans to catch CVEs and unsafe patterns at scale.
