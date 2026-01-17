# Architecture Recommendations

> **Date**: January 16, 2026  
> **Purpose**: Fix orphaned components and clarify preview architecture

---

## Current State Analysis

### The Problem

```
┌─────────────────────────────────────────────────────────────────┐
│  page.tsx                                                        │
│  ├── ChatPanel (messages, input)                                 │
│  └── ResizablePanels                                             │
│      ├── leftPanel: ChatPanel                                    │
│      └── rightPanel: WorkspacePanel ←── USED, but...             │
│                                                                  │
│  WorkspacePanel.tsx                                              │
│  ├── Tabs: Preview | Editor | Diff                               │
│  ├── PreviewRouter ─────────────────────► Works                  │
│  ├── Monaco Editor ─────────────────────► Works                  │
│  └── Diff view ─────────────────────────► Works                  │
│                                                                  │
│  PreviewPanel.tsx ──────────────────────► ORPHANED (unused)      │
│  ├── Tabs: Preview | Code                                        │
│  ├── HtmlPreview                                                │
│  └── CodeViewer                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Preview Panel Duplication

| Component | Purpose | Status |
|-----------|---------|--------|
| `WorkspacePanel` | File tree, editor, preview router | **Active** |
| `PreviewPanel` | Simple preview/code tabs | **Orphaned** |
| `PreviewRouter` | Routes to appropriate preview | **Active** |
| `HtmlPreview` | Renders HTML/React in iframe | **Active** |
| `CodeViewer` | Syntax highlighted code | **Active** |

---

## Option A: Remove Orphaned PreviewPanel (Simpler)

**Approach**: Delete `PreviewPanel.tsx` since it's not used.

```
Pros:
  - Eliminates dead code
  - Reduces maintenance burden
  - WorkspacePanel + PreviewRouter already handles all cases

Cons:
  - Loses a standalone component (may be useful elsewhere)
```

**Action Plan**:
1. Delete `components/PreviewPanel.tsx`
2. Verify `PreviewRouter` covers all preview needs:
   - Single HTML → `HtmlPreview`
   - Single CSS/JS/Component → `CodeViewer`
   - Multi-file project → File list with selection

---

## Option B: Integrate PreviewPanel as Default Preview (More Complex)

**Approach**: Replace WorkspacePanel's inline preview with PreviewPanel.

```
Pros:
  - Consistent preview experience
  - PreviewPanel has better UX (download/copy buttons)
  - Single source of truth for preview

Cons:
  - Requires refactoring WorkspacePanel
  - May break existing functionality
  - More risky change
```

**Action Plan**:
1. Remove duplicate preview logic from WorkspacePanel
2. Pass `componentCode` and `workspace` to PreviewPanel
3. Update PreviewPanel to handle:
   - Single file previews (current)
   - Project previews (via PreviewRouter integration)

---

## Recommended: Option A (Remove Orphan)

### Rationale

1. **PreviewRouter already handles all cases** - It's the correct abstraction layer
2. **WorkspacePanel is the active component** - Changing it introduces risk
3. **PreviewPanel provides no unique value** - All its features exist elsewhere
4. **Reduces codebase size** - Less code to maintain and debug

### Implementation Steps

```bash
# Step 1: Remove orphaned component
rm components/PreviewPanel.tsx

# Step 2: Fix TypeScript error
# Edit app/api/chat/route.test.ts - remove unused spyOn import

# Step 3: Verify build
bun typecheck && bun run build
```

---

## Proposed Architecture (After Fix)

```
┌─────────────────────────────────────────────────────────────────┐
│  page.tsx                                                        │
│  ├── ChatPanel (messages, input, reasoning display)             │
│  └── ResizablePanels                                             │
│      ├── ChatPanel                                               │
│      └── WorkspacePanel                                          │
│          ├── FileTree (file navigation)                          │
│          ├── Tabs: Preview | Editor | Diff                       │
│          ├── PreviewRouter                                       │
│          │   ├── HtmlPreview (HTML/React via Babel)              │
│          │   ├── CodeViewer (CSS/JS/TSX/other)                   │
│          │   └── Project list (multi-file projects)              │
│          ├── Monaco Editor (file editing)                        │
│          └── Diff view (version comparison)                      │
│                                                                  │
│  lib/workspace.ts                                                │
│  └── WorkspaceState management                                   │
│                                                                  │
│  lib/preview-router.ts                                           │
│  └── Preview type detection and routing                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow (Final State)

```
User Message
    ↓
API Chat Route (app/api/chat/route.ts)
    ↓ (SSE events)
page.tsx: handleSendMessage()
    ├─ setMessages() → ChatPanel renders
    ├─ setComponentCode() → For backward compat
    └─ setWorkspace() → WorkspacePanel renders
         ↓
    WorkspacePanel (activeTab determines view)
         ├─ Preview Tab → PreviewRouter
         │    ├─ Single HTML → HtmlPreview
         │    ├─ Single Code → CodeViewer
         │    └─ Project → File list
         ├─ Editor Tab → Monaco Editor
         └─ Diff Tab → SyntaxHighlighter (diff)
```

---

## Files to Keep

```
components/
├── ChatPanel.tsx          # Chat interface
├── WorkspacePanel.tsx     # Main workspace (editor + preview)
├── PreviewRouter.tsx      # Preview type router
├── HtmlPreview.tsx        # HTML/React iframe preview
├── CodeViewer.tsx         # Code syntax highlighting
├── FileTree.tsx           # File navigation
└── ...other UI components

lib/
├── workspace.ts           # Workspace state management
├── preview-router.ts      # Preview routing logic
└── ...utilities
```

---

## Files to Remove

```
components/PreviewPanel.tsx  # Orphaned - not used anywhere
```

---

## Immediate Actions Required

1. **Fix TypeScript error**:
   ```typescript
   // app/api/chat/route.test.ts line 1
   Remove: import { spyOn } from 'bun:test';
   // or actually use spyOn in a test
   ```

2. **Delete orphaned component**:
   ```bash
   rm components/PreviewPanel.tsx
   ```

3. **Verify architecture consistency**:
   ```bash
   bun typecheck && bun run build
   ```

---

## Long-Term Considerations

### If Convex Integration Is Not Yet Ready

The `ConvexClientProvider` is added but not actively used. Options:

1. **Keep provider, remove Convex dependencies** until DB is set up
2. **Remove provider entirely** and add when needed
3. **Keep provider, add stub functions** for future implementation

**Recommendation**: Keep provider but ensure it gracefully degrades (already does via null check).

### Future Preview Enhancements

If React/JSX preview is needed beyond `HtmlPreview`:

1. Current `HtmlPreview` uses Babel Standalone for basic JSX
2. For complex React apps, consider:
   - `@monaco-editor/react` for full IDE features
   - Vite-based preview service (separate backend)
   - Keep iframe approach for simple components

---

## Summary

| Item | Status | Action |
|------|--------|--------|
| TypeScript error | Blocking | Fix route.test.ts import |
| PreviewPanel | Orphaned | Delete component |
| WorkspacePanel + PreviewRouter | Active | Keep as-is |
| Architecture | Clean after fix | Maintain current path |

**Priority 1**: Fix TypeScript error (`bun typecheck`)
**Priority 2**: Remove PreviewPanel (`rm components/PreviewPanel.tsx`)
**Priority 3**: Verify build works (`bun run build`)
