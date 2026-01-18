# Workspace File Marker Parsing Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Preserve `file:` markers during streaming so multi-file outputs populate the workspace file tree correctly.

**Architecture:** Adjust code-fence parsing in the streaming API to capture `file:` markers even when language tokens are present on the same fence line; keep `parseProjectOutput` behavior unchanged and validate via targeted tests in `app/api/chat/route.test.ts`.

**Tech Stack:** Next.js (app router), TypeScript, Bun test (bun:test)

### Task 1: Add failing test for mixed language + file markers

**Files:**
- Modify: `app/api/chat/route.test.ts`

**Step 1: Write the failing test**

```ts
function extractAccumulatedCodeFromStream(chunks: string[]): string {
  // Minimal extraction mirroring route.ts: capture file markers when parsing fences
}

test('preserves file markers when fence line includes language and file', async () => {
  const chunks = [
    '```tsx file:app/page.tsx\n',
    'export default function Page() { return <div>Hi</div>; }\n',
    '```\n',
  ];

  const result = extractAccumulatedCodeFromStream(chunks);
  expect(result).toContain('```file:app/page.tsx');
});
```

**Step 2: Run test to verify it fails**

Run: `bun test app/api/chat/route.test.ts`
Expected: FAIL with missing `file:` marker

**Step 3: Write minimal implementation**

```ts
// Parse the fence line, support optional language token + file: token
// Preserve file marker in accumulatedCode
```

**Step 4: Run test to verify it passes**

Run: `bun test app/api/chat/route.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/chat/route.ts app/api/chat/route.test.ts
git commit -m "fix: preserve file markers in streamed fences"
```

### Task 2: Regression test for standard file-only fences

**Files:**
- Modify: `app/api/chat/route.test.ts`

**Step 1: Write the failing test**

```ts
test('continues to preserve plain file-only fences', async () => {
  const chunks = [
    '```file:components/Button.tsx\n',
    'export function Button() { return <button/> }\n',
    '```\n',
  ];

  const result = extractAccumulatedCodeFromStream(chunks);
  expect(result).toContain('```file:components/Button.tsx');
});
```

**Step 2: Run test to verify it fails**

Run: `bun test app/api/chat/route.test.ts`
Expected: PASS (baseline)

**Step 3: Write minimal implementation**

No new code if Task 1 passes

**Step 4: Run test to verify it passes**

Run: `bun test app/api/chat/route.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/chat/route.test.ts
git commit -m "test: cover file-only fences"
```

### Task 3: Verify workspace parsing end-to-end (manual)

**Files:**
- None

**Step 1: Manual verification**

Run app, submit a prompt that returns:

```
```tsx file:app/page.tsx
...
```

```file:components/TodoForm.tsx
...
```
```

Expected: File tree lists `app/page.tsx` and `components/TodoForm.tsx`, not `Component.tsx`.

**Step 2: Commit**

No commit (manual verification)
