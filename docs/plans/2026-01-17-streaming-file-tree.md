# Streaming File Tree Updates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the workspace file tree during streaming as `file:` markers arrive, not only after the final `done` event.

**Architecture:** Extend the client streaming handler to detect inline `file:` markers in `accumulatedCode` and parse project output when present; keep fenced parsing intact. Avoid server-side changes.

**Tech Stack:** Next.js (app router), TypeScript

### Task 1: Add failing test for streaming parse trigger (if feasible)

**Files:**
- Modify: `app/page.tsx` (if tests unavailable, skip with note)

**Step 1: Write the failing test**

```ts
// If there is no existing test harness for app/page.tsx streaming,
// add a minimal pure helper in app/page.tsx and test it separately.
```

**Step 2: Run test to verify it fails**

Run: `bun test <test-file>`
Expected: FAIL before implementation

**Step 3: Write minimal implementation**

```ts
// Detect inline file markers during streaming and call parseProjectOutput
```

**Step 4: Run test to verify it passes**

Run: `bun test <test-file>`
Expected: PASS

**Step 5: Commit**

```bash
git add app/page.tsx <test-file>
git commit -m "fix: update file tree during streaming"
```

### Task 2: Manual verification in UI

**Files:**
- None

**Step 1: Manual verification**

Run app, submit a prompt that streams inline `file:` markers. During streaming, verify file tree shows `package.json` and other paths as they appear.

**Step 2: Commit**

No commit (manual verification)
