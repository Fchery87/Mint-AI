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
│  │ (Enhanced)   │    │ (Plan/Build) │    │  (iframe srcDoc)     │   │
│  └──────┬───────┘    └──────┬───────┘    └──────────────────────┘   │
│         │                   │                                        │
│         ▼                   ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Next.js API Routes                         │   │
│  │                    /api/chat/route.ts                         │   │
│  │                    (Plan Parser & Executor)                   │   │
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
├── page.tsx                 # Main orchestrator (Plan/Build state)
│   ├── ChatPanel            # Enhanced User Input
│   ├── WorkspacePanel       # Editor + File Tree + Plan/Build Panels
│   └── PreviewPanel         # iframe srcDoc rendering
│
components/
├── ChatPanel.tsx            # Message list + ChatInputEnhanced
├── ChatInputEnhanced.tsx    # Mode-aware input with suggested actions
├── WorkspacePanel.tsx       # Editor + tabs + conditional plan/build panels
├── PlanPanel.tsx            # Implementation steps + clarifying questions
├── BuildExecutionPanel.tsx  # Real-time build progress + execution controls
├── DebugMode.tsx            # Hypothesis-driven troubleshooting UI
├── DiffReviewModal.tsx      # Monaco diff review for pending changes
├── WebSearchDisplay.tsx     # Structured search results from Exa
├── ReasonBlock.tsx          # Collapsible reasoning display
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
├── contexts/
│   └── PlanBuildContext.tsx # Global state provider for workflow
├── hooks/
│   └── usePlanBuild.ts      # Reducer-based workflow state hook
├── agent.ts                 # Tool execution (list_files, read_file, write_file)
├── prompts.ts               # Plan/Build specific system prompts
├── plan-parser.ts           # XML-tag parsing for structured plans
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
User Input (Plan/Build/Debug)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /api/chat                                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Context retrieval (Convex history + workspace)           │
│ 2. Web search via Exa (if plan/debug mode)                  │
│ 3. LLM streaming with mode-specific system prompts          │
│ 4. Output parsing (xml-tags: <plan>, <step>, <question>)    │
│ 5. Agent loop for tool execution (Build mode)               │
│ 6. Visual Diff generation for pending changes               │
│ 7. Checkpoint creation (automated before build)             │
│ 8. SSE Push: chunks, plan-chunks, diff-chunks, status       │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Frontend receives:
- reasoning-chunk (AI thoughts)
- plan-update (steps/questions)
- build-status (execution progress)
- file-diff (for review)
- content-chunk (explanation)
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

### 1. Visual Diff & Review Flow

[Implemented]

Before AI changes are applied to the workspace, the system generates a `pendingChange` object.
The `DiffReviewModal` uses Monaco's `DiffEditor` to show side-by-side changes.
User must explicitly "Accept" or "Accept All" to commit changes to Convex.

### 2. Automated Checkpointing

[Implemented]

The system automatically creates a `WorkspaceCheckpoint` in Convex before starting any `build` execution.
This includes:

- Serialized state of all files
- Chat message ID reference
- Timestamp and description

### 3. Agentic Workflow (Plan/Build/Debug)

[Implemented]

The architecture pivoted from a simple chat to a 3-mode engine:

- **Plan Mode**: Focuses on research, spec generation, and human-in-the-loop clarification using `<question>` and `<step>` protocols.
- **Build Mode**: Sequential execution of plans with real-time status reporting and pause/resume capabilities.
- **Debug Mode**: Hypothesis-driven loop for troubleshooting runtime errors or logic bugs.

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
