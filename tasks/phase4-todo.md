# Plan
**Problem:** No test framework configured and no test coverage for critical paths  
**Goal (Definition of Done):** Test framework configured with Vitest, unit tests for utilities, hooks, and components, integration tests for main flows, all tests passing  
**Scope:** Testing infrastructure setup and initial test suite  
**Out of scope:** Full 60% coverage (deferred to ongoing work), component tests requiring complex provider mocking  
**Risks/Impact:** Low - additive only, no production code changes  
**Rollback:** Remove test files and dev dependencies  

## TODO
- [x] Install Vitest and testing dependencies (@testing-library/react, jest-dom, user-event, jsdom)
- [x] Configure Vitest with vitest.config.ts
- [x] Create test setup file (test/setup.ts)
- [x] Create test utilities (test/utils.tsx)
- [x] Write unit tests for utility functions (diff, project-types)
- [x] Write integration tests for API routes (chat route)
- [x] Add test scripts to package.json
- [x] Run all tests and verify they pass
- [ ] Add coverage reporting (deferred)
- [ ] Write component tests (deferred - needs provider mocking fixes)
- [ ] Write hook tests (deferred - needs provider mocking fixes)

## High-Level Updates
- 2026-01-28 – Installed Vitest and testing dependencies
- 2026-01-28 – Created Vitest configuration with jsdom environment
- 2026-01-28 – Created test utilities and mock providers
- 2026-01-28 – Converted existing bun:test files to vitest
- 2026-01-28 – All 12 tests passing (3 test files)

## Review
**Summary:**  
- ✅ Vitest test framework installed and configured
- ✅ Test utilities created with provider mocks
- ✅ 12 tests passing across 3 test files:
  - lib/diff.test.ts (6 tests)
  - lib/project-types.test.ts (1 test)
  - app/api/chat/route.test.ts (5 tests)
- ✅ Test scripts added to package.json (test, test:run, test:coverage)

**Trade-offs:**  
- Component and hook tests deferred due to next-themes provider mocking issues (addListener error)
- Coverage reporting not yet configured (can be added with @vitest/coverage-v8)
- Focused on getting core infrastructure working rather than full test suite

**Follow-ups:**  
- Fix next-themes mocking for component tests
- Add @vitest/coverage-v8 for coverage reporting
- Write tests for hooks (useChat, useWorkspace, usePlanBuild)
- Write component tests (MessageItem, FileExplorer, ChatPanel)
- Write integration tests for chat flow, workspace operations, plan/build flow
- Target >60% coverage on critical paths
