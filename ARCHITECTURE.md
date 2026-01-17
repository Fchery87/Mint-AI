# Mint AI Platform - Technical Architecture

> **Version**: 1.0  
> **Date**: January 9, 2026  
> **Related**: [FEATURE_SPEC.md](./FEATURE_SPEC.md)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Mint AI Platform                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │  Chat Panel  │◄──►│  Workspace   │◄──►│   Preview Panel      │   │
│  │              │    │    Panel     │    │  (iframe srcDoc)     │   │
│  └──────┬───────┘    └──────┬───────┘    └──────────────────────┘   │
│         │                   │                                        │
│         ▼                   ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Next.js API Routes                         │   │
│  │                    /api/chat/route.ts                         │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                        │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   OpenRouter    │  │     Convex      │  │    Exa API      │
│   (LLM API)     │  │  (Real-time DB) │  │  (Web Search)   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Component Architecture

### Frontend Layer

```
app/
├── page.tsx                 # Main orchestrator
│   ├── ChatPanel            # User input + message history
│   ├── WorkspacePanel       # Monaco Editor + File Tree
│   └── PreviewPanel         # iframe srcDoc rendering
│
components/
├── ChatPanel.tsx            # Message list + prompt input
├── WorkspacePanel.tsx       # Editor + tabs + file operations
├── HtmlPreview.tsx          # iframe srcDoc preview
├── ReasoningBlock.tsx       # Collapsible reasoning display
└── ResizablePanels.tsx      # Split-pane layout
```

### Backend Layer

```
app/api/
└── chat/
    └── route.ts             # Streaming SSE endpoint
        ├── getWebSearchContext()   # Exa API integration
        ├── OpenAI client           # OpenRouter compatible
        ├── Agent loop (5 iters)    # Tool execution cycle
        └── Convex mutations        # Workspace persistence

lib/
├── agent.ts                 # Tool execution (list_files, read_file, write_file)
├── prompts.ts               # System prompt generation
├── cost-tracking.ts         # Token usage calculation
├── preview-support.ts       # Language → preview type mapping
└── project-types.ts         # Multi-file parsing
```

### Data Layer (Convex)

```
convex/
├── schema.ts
│   ├── workspaces           # { name, status, createdAt, updatedAt }
│   ├── files                # { workspaceId, path, content, language }
│   └── messages             # { workspaceId, role, content, reasoning }
│
└── workspaces.ts            # CRUD mutations + queries
```

---

## Data Flow

### 1. Chat Message Flow

```
User Input
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /api/chat                                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Rate limiting check                                      │
│ 2. Validate request (Zod)                                   │
│ 3. Fetch history from Convex (if workspaceId)               │
│ 4. Optional: Web search via Exa                             │
│ 5. Stream LLM response (OpenRouter)                         │
│ 6. Parse tool calls → execute → re-prompt (up to 5x)        │
│ 7. Extract code from response                               │
│ 8. Upsert files to Convex                                   │
│ 9. Return SSE stream                                        │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Frontend receives: reasoning-chunk, chunk, code-chunk, done
```

### 2. File Persistence Flow

```
AI generates code
    │
    ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ parseProject    │────►│ upsertFile()    │────►│ Convex files    │
│ Output()        │     │ mutation        │     │ table           │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │ useQuery()      │
                                              │ listFiles       │
                                              └────────┬────────┘
                                                       │
                                                       ▼
                                              WorkspacePanel
                                              (real-time sync)
```

---

## Proposed Architecture Changes

### 1. Reasoning Streaming Enhancement

```
Current:
  LLM chunk → emit('chunk', content)

Proposed:
  LLM chunk → buffer
           → if contains <reasoning> → emit('reasoning-chunk')
           → if contains </reasoning> → emit('reasoning-complete')
           → else → emit('explanation-chunk')
```

### 2. Babel React Preview

```
Current HtmlPreview:
  ┌─────────────────┐
  │ iframe          │
  │ srcdoc = HTML   │ ← Only supports HTML/CSS/JS
  └─────────────────┘

Proposed ReactPreview:
  ┌─────────────────────────────────────────────────────────┐
  │ iframe                                                  │
  │ srcdoc = {                                              │
  │   <script src="babel-standalone">                       │
  │   <script src="esm.sh/react">                           │
  │   <script type="text/babel">                            │
  │     // GENERATED_COMPONENT                              │
  │     ReactDOM.createRoot(root).render(<Component />)     │
  │   </script>                                             │
  │ }                                                       │
  └─────────────────────────────────────────────────────────┘
```

### 3. Visual Diff Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ WorkspacePanel                                              │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐  ┌─────────────────────┐           │
│ │ DiffEditor (Monaco) │  │ Actions             │           │
│ │ ┌─────────┬────────┐│  │ ┌─────────────────┐ │           │
│ │ │ Original│Proposed││  │ │ ✓ Accept All    │ │           │
│ │ │         │        ││  │ │ ✗ Reject All    │ │           │
│ │ │         │        ││  │ │ ↩ Accept File   │ │           │
│ │ └─────────┴────────┘│  │ └─────────────────┘ │           │
│ └─────────────────────┘  └─────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 4. Checkpoint System

```
Convex Schema Addition:
  checkpoints: defineTable({
    workspaceId: v.id('workspaces'),
    messageId: v.id('messages'),    // Link to chat message
    files: v.array(v.object({
      path: v.string(),
      content: v.string(),
    })),
    createdAt: v.number(),
  })

Flow:
  Before AI edit → createCheckpoint(workspaceId, messageId, currentFiles)
  User clicks Undo → restoreCheckpoint(checkpointId)
```

---

## Technology Stack

| Layer     | Technology                | Purpose                       |
| --------- | ------------------------- | ----------------------------- |
| Framework | Next.js 16                | App router, SSE streaming     |
| Runtime   | Bun                       | Fast package management       |
| UI        | React 19, Tailwind CSS    | Components, styling           |
| Editor    | Monaco Editor             | Code editing, diffing         |
| Database  | Convex                    | Real-time sync, persistence   |
| LLM       | OpenRouter API            | Multi-model access            |
| Search    | Exa API                   | Web search context            |
| Preview   | iframe + Babel Standalone | Zero-dependency transpilation |

---

## Security Considerations

- **iframe sandbox**: `allow-scripts` only (no `allow-same-origin`)
- **Rate limiting**: 10 requests/minute per IP
- **Input validation**: Zod schema on all API inputs
- **Environment variables**: API keys never exposed to client
