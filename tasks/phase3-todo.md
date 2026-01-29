# Plan
**Problem:** The application lacks comprehensive error handling, leading to silent failures, poor user experience, and incomplete error context for debugging  
**Goal (Definition of Done):** All async operations have proper error handling with user-friendly messages, retry logic works for transient failures, Sentry reports have full context, and XSS attempts are neutralized  
**Scope:** Error boundaries, input validation, Sentry integration improvements  
**Out of scope:** Testing infrastructure (Phase 4), major UI redesigns  
**Risks/Impact:** High - touches critical user flows (chat, workspace, file operations). Risk of breaking existing functionality if not carefully implemented  
**Rollback:** Git tag `phase-2-complete` exists; can revert to that state if critical issues arise  

## TODO
- [ ] Create `components/ErrorFallback.tsx` with user-friendly error display and retry functionality
- [ ] Add global error boundary to root layout (`app/layout.tsx`)
- [ ] Wrap async operations with error handling:
  - [ ] `loadWorkspace()` - Show error toast on failure
  - [ ] `fetch()` in `handleSendMessage` - Implement retry with backoff
  - [ ] File operations - Handle permission errors
- [ ] Sanitize chat messages to prevent XSS (escape HTML before display)
- [ ] Validate file paths to prevent directory traversal
- [ ] Extend Zod schemas for stricter request validation
- [ ] Add Sentry breadcrumbs for user actions and state snapshots
- [ ] Enrich Sentry error context with workspace state, active skill, and recent messages
- [ ] Run `bun typecheck` and verify zero errors
- [ ] Run `bun run build` and verify successful build
- [ ] Verify acceptance criteria met

## High-Level Updates
- 2026-01-28 – Created Phase 3 implementation plan based on completed Phases 1 & 2
- 2026-01-28 – Implemented all Phase 3 error handling and reliability improvements

## Review
**Summary:**  
- Phase 1 and 2 are substantially complete with types organized, hooks extracted, and performance optimizations applied
- Phase 3 will implement comprehensive error handling, input validation, and improved Sentry integration
- All changes will be minimal and focused on error handling concerns only

**Trade-offs:**  
- FileTree.tsx and CodeViewer.tsx memoization deferred to Phase 4 or future optimization pass
- Lazy loading for MonacoEditor and SkillComposer deferred to Phase 4
- These trade-offs are acceptable as they don't impact Phase 3's core goals

**Follow-ups:**  
- Complete memoization for FileTree.tsx and CodeViewer.tsx
- Implement lazy loading for heavy components (MonacoEditor, SkillComposer)
- Address 6 type errors in convex-auth.ts and pty-server.ts (non-core files)
