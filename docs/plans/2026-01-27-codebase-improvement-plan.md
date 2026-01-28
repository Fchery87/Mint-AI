# Mint AI Codebase Improvement Plan

**Date:** 2026-01-27  
**Scope:** Comprehensive codebase refactoring across 4 phases  
**Approach:** Incremental refactoring with breaking changes accepted  
**Estimated Duration:** 2-3 weeks

---

## Executive Summary

This plan addresses 8 critical areas of improvement identified during codebase review:
1. Type safety issues
2. State management complexity
3. Performance concerns
4. Error handling gaps
5. Security improvements
6. Code organization
7. Testing infrastructure (deferred)
8. Accessibility & UX (deferred)

**Guiding Principles:**
- Incremental delivery (one phase at a time)
- Breaking changes accepted (no backward compatibility burden)
- Tests added after core improvements (retrofit approach)
- Each phase must pass typecheck and build before proceeding

---

## Phase 1: Type Safety & Code Organization (Week 1)

### 1.1 Centralize Type Definitions

**Problem:** Types scattered across components, duplicated interfaces, `any` usage  
**Impact:** High - affects entire codebase maintainability  
**Files to Modify:** 15-20 files

**Tasks:**

1. **Create `types/index.ts` barrel export**
   - Create `types/chat.ts` - Move `ChatMessage`, `ChatRequest`, `ChatResponse`
   - Create `types/workspace.ts` - Move `WorkspaceState`, `PendingChange`
   - Create `types/plan-build.ts` - Consolidate plan types (currently split)
   - Create `types/skill.ts` - Move `SkillType` and related
   - Create `types/terminal.ts` - Move terminal-related types

2. **Replace `any` types in critical paths**
   - `app/api/chat/route.ts:133` - `data: any` in web search
   - `app/api/chat/route.ts:45` - `usageData: any`
   - `app/page.tsx` - `pendingChanges` Record type refinement

3. **Derive types from Zod schemas**
   ```typescript
   // Replace manual interface with inferred type
   type ChatRequest = z.infer<typeof chatRequestSchema>;
   ```

4. **Standardize export patterns**
   - All types: named exports only
   - Components: default exports for page components, named for utilities

**Validation:**
- [ ] `bun typecheck` passes with zero errors
- [ ] No `any` types remain in `app/` or `components/`
- [ ] All imports updated to use `types/` directory

---

### 1.2 Consolidate State Management

**Problem:** `page.tsx` has 600+ lines, mixed concerns, redundant state  
**Impact:** High - improves maintainability and reduces bugs  
**Files to Create/Modify:** 8-10 files

**Tasks:**

1. **Create `hooks/useChat.ts`**
   - Extract chat state: `messages`, `isLoading`, `chatId`
   - Extract handlers: `handleSendMessage`, streaming logic
   - Return: `{ messages, isLoading, sendMessage, appendMessage }`

2. **Create `hooks/useWorkspace.ts`**
   - Extract workspace state: `workspace`, `draftWorkspace`
   - Extract handlers: file CRUD, checkpoint management
   - Handle persistence via `workspace-storage.ts`

3. **Create `hooks/useTerminal.ts`**
   - Extract terminal state: `terminalLines`
   - Extract handlers: `addTerminalLine`, `clearTerminal`

4. **Refactor `page.tsx`**
   - Reduce to ~200 lines
   - Compose hooks instead of inline state
   - Keep only layout orchestration logic

**Validation:**
- [ ] `page.tsx` under 250 lines
- [ ] All existing functionality preserved
- [ ] No regression in chat/workspace/terminal features

---

### 1.3 Code Organization Cleanup

**Problem:** Mixed patterns, dead code, duplicate logic  
**Impact:** Medium - improves readability  
**Files to Modify:** 10-15 files

**Tasks:**

1. **Remove dead code**
   - Delete unused imports across components
   - Remove TODO comments that are stale
   - Clean up `console.log` statements

2. **Consolidate workspace utilities**
   - Merge overlapping logic in `workspace.ts` and `workspace-storage.ts`
   - Single source of truth for workspace operations

3. **Standardize file structure**
   ```
   lib/
   ├── types/          # All TypeScript types
   ├── hooks/          # React hooks
   ├── utils/          # Pure utility functions
   ├── api/            # API-related utilities
   └── constants/      # Constants and config
   ```

**Validation:**
- [ ] No unused imports (verified via ESLint)
- [ ] Consistent file organization
- [ ] All functions have single responsibility

---

## Phase 2: Performance Optimizations (Week 1-2)

### 2.1 Add Memoization

**Problem:** Unnecessary re-renders on large objects  
**Impact:** Medium - improves UI responsiveness  
**Files to Modify:** 8-12 files

**Tasks:**

1. **Memoize expensive computations**
   - `MessageItem.tsx` - Memoize message parsing
   - `FileExplorer.tsx` - Memoize file tree building
   - `WorkspacePanel.tsx` - Memoize file content rendering

2. **Optimize callbacks with `useCallback`**
   - `page.tsx` handlers passed to children
   - Event handlers in `ChatPanel.tsx`

3. **Add `React.memo` to pure components**
   - `MessageItem` - Pure display component
   - `FileTree` - Only re-renders when files change
   - `CodeViewer` - Expensive syntax highlighting

**Validation:**
- [ ] React DevTools Profiler shows reduced re-renders
- [ ] No functional regressions

---

### 2.2 Optimize Streaming Parser

**Problem:** SSE buffer processing is inefficient  
**Impact:** Medium - improves streaming responsiveness  
**Files to Modify:** 2 files

**Tasks:**

1. **Refactor `route.ts` streaming logic**
   - Extract buffer processing to dedicated function
   - Use state machine pattern for parsing
   - Add unit tests for edge cases

2. **Optimize state updates**
   - Batch rapid state updates during streaming
   - Use `requestAnimationFrame` for UI updates

**Validation:**
- [ ] Streaming feels smoother (subjective test)
- [ ] No dropped messages in stress test

---

### 2.3 Lazy Loading

**Problem:** All components loaded upfront  
**Impact:** Low - improves initial load time  
**Files to Modify:** 3-5 files

**Tasks:**

1. **Lazy load heavy components**
   ```typescript
   const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
     ssr: false,
     loading: () => <Skeleton />
   });
   ```

2. **Code split routes**
   - `/login` and `/signup` as separate chunks
   - Skill composer as lazy-loaded modal

**Validation:**
- [ ] Initial bundle size reduced
- [ ] No visible loading jank

---

## Phase 3: Error Handling & Reliability (Week 2)

### 3.1 Implement Proper Error Boundaries

**Problem:** Silent failures, no retry logic  
**Impact:** High - improves user experience  
**Files to Modify:** 6-10 files

**Tasks:**

1. **Create `components/ErrorFallback.tsx`**
   - User-friendly error display
   - Retry button functionality
   - Error reporting to Sentry

2. **Wrap async operations**
   - `loadWorkspace()` - Show error toast on failure
   - `fetch()` in `handleSendMessage` - Implement retry with backoff
   - File operations - Handle permission errors

3. **Add global error boundary**
   - Wrap root layout
   - Catch unhandled React errors

**Validation:**
- [ ] Errors show user-friendly messages
- [ ] Retry logic works for transient failures
- [ ] Sentry receives all error reports

---

### 3.2 Add Input Validation

**Problem:** No sanitization of user input  
**Impact:** High - security improvement  
**Files to Modify:** 4-6 files

**Tasks:**

1. **Sanitize chat messages**
   - Escape HTML before display
   - Prevent XSS in rendered markdown

2. **Validate file paths**
   - Prevent directory traversal in file operations
   - Validate file extensions

3. **Add request validation**
   - Extend Zod schemas for stricter validation
   - Validate file sizes and types

**Validation:**
- [ ] XSS attempt in chat is neutralized
- [ ] Invalid file paths rejected

---

### 3.3 Improve Sentry Integration

**Problem:** Incomplete error context  
**Impact:** Medium - improves debugging  
**Files to Modify:** 3-5 files

**Tasks:**

1. **Add breadcrumbs**
   - User actions before error
   - State snapshots

2. **Enrich error context**
   - Current workspace state
   - Active skill and mode
   - Recent messages (sanitized)

**Validation:**
- [ ] Sentry errors have full context
- [ ] No PII in error reports

---

## Phase 4: Testing Infrastructure (Week 3)

### 4.1 Setup Test Framework

**Problem:** No test runner configured  
**Impact:** High - enables confident refactoring  
**Files to Create:** 5-10 files

**Tasks:**

1. **Install dependencies**
   ```bash
   bun add -d vitest @testing-library/react @testing-library/jest-dom
   bun add -d @testing-library/user-event jsdom
   ```

2. **Configure Vitest**
   - Create `vitest.config.ts`
   - Setup `test/setup.ts` with jest-dom matchers
   - Add test scripts to `package.json`

3. **Create test utilities**
   - Mock providers (Convex, Theme, PlanBuild)
   - Test data factories
   - Render helpers

**Validation:**
- [ ] `bun test` runs successfully
- [ ] Sample test passes

---

### 4.2 Add Unit Tests

**Problem:** No test coverage  
**Impact:** High - prevents regressions  
**Files to Create:** 15-20 test files

**Tasks:**

1. **Test utility functions**
   - `lib/diff.ts` - Already has `.test.ts`, verify it runs
   - `lib/project-types.ts` - Parse logic
   - `lib/plan-parser.ts` - Plan extraction

2. **Test hooks**
   - `usePlanBuild.ts` - State transitions
   - `useChat.ts` (after Phase 1 extraction)

3. **Test components**
   - `MessageItem` - Rendering different message types
   - `FileExplorer` - File operations

**Validation:**
- [ ] >60% coverage on critical paths
- [ ] All tests pass in CI

---

### 4.3 Add Integration Tests

**Problem:** Critical paths untested  
**Impact:** Medium - catches integration issues  
**Files to Create:** 3-5 test files

**Tasks:**

1. **Test chat flow**
   - Send message → Receive response → Display code

2. **Test workspace operations**
   - Create file → Edit → Save → Download

3. **Test plan/build flow**
   - Create plan → Approve → Build → Complete

**Validation:**
- [ ] Integration tests pass reliably
- [ ] Tests run in <30 seconds

---

## Migration Guide

### For Phase 1 (Type Safety)

Update imports after types move:

```typescript
// Before
import type { ChatMessage } from "@/components/MessageItem";

// After
import type { ChatMessage } from "@/types/chat";
```

### For Phase 2 (Performance)

No breaking changes - purely additive.

### For Phase 3 (Error Handling)

New required props for error boundaries:

```typescript
// Components now require fallback
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### For Phase 4 (Testing)

New dev dependencies - run `bun install` after pull.

---

## Rollback Strategy

Each phase is designed to be independently revertible:

1. **Git tags** at each phase completion: `phase-1-complete`, `phase-2-complete`, etc.
2. **Feature flags** for major changes (can disable via env var)
3. **Gradual rollout** - merge to main after each phase validation

---

## Success Criteria

### Phase 1 Complete When:
- [ ] `bun typecheck` passes with strict mode
- [ ] Zero `any` types in production code
- [ ] All types centralized in `types/` directory
- [ ] `page.tsx` under 250 lines

### Phase 2 Complete When:
- [ ] React DevTools shows 30%+ reduction in re-renders
- [ ] Initial bundle size reduced by 20%+
- [ ] Streaming feels responsive (no visible lag)

### Phase 3 Complete When:
- [ ] All async operations have error handling
- [ ] User sees friendly error messages (not stack traces)
- [ ] Sentry reports have full context
- [ ] XSS attempt is neutralized

### Phase 4 Complete When:
- [ ] `bun test` runs and passes
- [ ] >60% coverage on critical paths
- [ ] CI runs tests on every PR
- [ ] Integration tests cover main user flows

---

## Appendix: File Inventory

### Files to Create (New)
```
types/
├── index.ts
├── chat.ts
├── workspace.ts
├── plan-build.ts
├── skill.ts
└── terminal.ts

hooks/
├── useChat.ts
├── useWorkspace.ts
└── useTerminal.ts

test/
├── setup.ts
├── factories.ts
└── utils.tsx

components/
└── ErrorFallback.tsx
```

### Files to Modify (Existing)
```
app/
├── api/chat/route.ts          # Type fixes, streaming optimization
├── page.tsx                    # Major refactor
└── layout.tsx                  # Error boundary

components/
├── ChatPanel.tsx               # Memoization
├── MessageItem.tsx             # Memoization
├── FileExplorer.tsx            # Memoization
└── FileTree.tsx                # Memoization

lib/
├── workspace.ts                # Consolidation
├── workspace-storage.ts        # Consolidation
└── [various utilities]         # Type fixes
```

---

**Next Steps:**
1. Review this plan
2. Approve or request modifications
3. Begin Phase 1 implementation
