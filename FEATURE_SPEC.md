# Mint AI Platform - Feature Enhancement Specification

> **Version**: 1.0  
> **Date**: January 9, 2026  
> **Status**: Draft - Pending Review

---

## 1. Overview

This specification details the proposed enhancements to the Mint AI platform based on a comprehensive code review and competitive analysis against v0.dev, Cursor, Bolt.new, and Claude Code.

### 1.1 Goals

- Fix critical issues affecting user experience
- Add free, 100% browser-based React/JSX preview capabilities
- Implement advanced "code-first" IDE features
- Maintain simplicity and avoid complex dependencies

---

## 2. Critical Fixes

### 2.1 Remove Stubbed `run_command` Tool

| Attribute    | Value            |
| ------------ | ---------------- |
| **Priority** | High             |
| **Effort**   | Low (1-2 hours)  |
| **Files**    | `lib/prompts.ts` |

**Current State**: The agent prompt includes `run_command` as an available tool, but execution returns a stub message.

**Action**: Remove `run_command` from the system prompt in `getSystemPrompt()`.

---

### 2.2 Wire Reasoning Streaming

| Attribute    | Value                                   |
| ------------ | --------------------------------------- |
| **Priority** | High                                    |
| **Effort**   | Medium (4-6 hours)                      |
| **Files**    | `app/api/chat/route.ts`, `app/page.tsx` |

**Current State**: Frontend expects `reasoning-chunk` and `reasoning-complete` SSE events. Backend only emits generic `chunk` events.

**Requirements**:

1. Parse `<reasoning>...</reasoning>` tags from streaming buffer
2. Emit `reasoning-chunk` events for content inside tags
3. Emit `reasoning-complete` when closing tag detected
4. Continue emitting `explanation-chunk` for content after reasoning

---

### 2.3 Respect Ask Mode

| Attribute    | Value                   |
| ------------ | ----------------------- |
| **Priority** | High                    |
| **Effort**   | Low (1-2 hours)         |
| **Files**    | `app/api/chat/route.ts` |

**Current State**: Files are upserted to Convex regardless of mode.

**Action**: Skip `extractCodeFromResponse` and `upsertFile` calls when `mode === 'ask'`.

---

## 3. Free Browser-Only React Preview

### 3.1 Babel Standalone Integration

| Attribute    | Value                                                  |
| ------------ | ------------------------------------------------------ |
| **Priority** | Medium                                                 |
| **Effort**   | Medium (6-8 hours)                                     |
| **Files**    | `components/HtmlPreview.tsx`, `lib/preview-support.ts` |

**Approach**: Inject Babel and React CDN into iframe `srcDoc` for JSX transpilation.

**Template**:

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@18",
          "react-dom/client": "https://esm.sh/react-dom@18/client"
        }
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel" data-presets="react">
      // GENERATED_CODE_HERE
    </script>
  </body>
</html>
```

**Acceptance Criteria**:

- [ ] React components render in preview tab
- [ ] Hooks (useState, useEffect) work correctly
- [ ] Tailwind CSS classes render (via CDN injection)
- [ ] Error messages display clearly in preview

---

## 4. Code-First IDE Enhancements

### 4.1 Visual Diff Review

| Attribute    | Value                                           |
| ------------ | ----------------------------------------------- |
| **Priority** | Medium                                          |
| **Effort**   | High (8-12 hours)                               |
| **Files**    | `components/WorkspacePanel.tsx` (new component) |

**Description**: Before AI changes are committed to Convex, show a side-by-side diff view.

**Requirements**:

1. Use Monaco Editor's `monaco.editor.createDiffEditor()`
2. Show original file on left, proposed changes on right
3. Add "Accept" and "Reject" buttons per file
4. Batch accept/reject for multi-file changes

---

### 4.2 Spec-Driven Development Mode

| Attribute    | Value                            |
| ------------ | -------------------------------- |
| **Priority** | Low                              |
| **Effort**   | High (12-16 hours)               |
| **Files**    | `app/page.tsx`, `lib/prompts.ts` |

**Description**: Add a "Blueprint" mode where the AI generates a technical specification before writing code.

**Workflow**:

1. User describes feature
2. AI generates `SPEC.md` with requirements, file structure, and approach
3. User reviews and approves/edits spec
4. AI implements code based ONLY on the approved spec

---

### 4.3 Git-Style Checkpointing

| Attribute    | Value                                  |
| ------------ | -------------------------------------- |
| **Priority** | Medium                                 |
| **Effort**   | Medium (6-8 hours)                     |
| **Files**    | `convex/workspaces.ts`, `app/page.tsx` |

**Description**: Auto-create checkpoints before AI edits for easy rollback.

**Requirements**:

1. Create checkpoint in Convex before each `upsertFile` batch
2. Link checkpoint to chat message ID
3. Add "Undo" button next to each assistant message
4. Restore all files to checkpoint state on undo

---

## 5. Dependency Cleanup

### 5.1 Remove Unused Packages

| Package                       | Reason                                        |
| ----------------------------- | --------------------------------------------- |
| `@codesandbox/sandpack-react` | Not actively used, replaced by Babel approach |
| `pyodide`                     | Not actively used                             |

**Action**: Run `bun remove @codesandbox/sandpack-react pyodide` if confirmed unused.

---

## 6. Out of Scope

The following are explicitly NOT part of this specification:

- MCP (Model Context Protocol) integration
- Real-time collaboration features
- Deployment to Vercel/Netlify
- Project upload/import from GitHub

---

## 7. Implementation Order

| Phase | Features                       | Est. Time |
| ----- | ------------------------------ | --------- |
| **1** | Critical Fixes (2.1, 2.2, 2.3) | 8 hours   |
| **2** | Babel React Preview (3.1)      | 8 hours   |
| **3** | Visual Diff Review (4.1)       | 12 hours  |
| **4** | Git Checkpointing (4.3)        | 8 hours   |
| **5** | Spec-Driven Mode (4.2)         | 16 hours  |

**Total Estimated Effort**: ~52 hours

---

## 8. Approval

- [ ] User approves critical fixes scope
- [ ] User approves Babel preview approach
- [ ] User selects which IDE enhancements to implement
- [ ] User confirms dependency removal is safe
