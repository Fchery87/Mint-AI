# AI Coding Platform Enhancement Research

> **Objective**: Transform Mint AI into a competitive online AI coding platform rivaling Claude Code, OpenAI Codex, Cursor, and Replit.

---

## 📊 Current State Analysis

### What Mint AI Has Today

| Feature             | Status | Description                                            |
| ------------------- | ------ | ------------------------------------------------------ |
| Chat Interface      | ✅     | Enhanced split-screen with Plan/Build/Debug modes      |
| Multi-File Projects | ✅     | Full lifecycle: Plan → Review → Build → Verify         |
| Code Preview        | ✅     | Live preview for React/HTML/Vue components             |
| Reasoning Display   | ✅     | Real-time thinking display during research and coding  |
| Multi-Language      | ✅     | Supports Python, Rust, Go, Java, C++, TypeScript, etc. |
| Cost Tracking       | ✅     | Token/cost visibility per session                      |
| Visual Diff Review  | ✅     | Modal for reviewing and accepting code changes         |
| Web Search Results  | ✅     | Structured display of citations and search context     |
| Debug Mode          | ✅     | Hypothesis-driven troubleshooting workflow             |

### Key Architecture Components

```
app/
├── page.tsx        → Main split-screen interface
├── api/chat/       → Streaming API with OpenRouter integration
components/
├── ChatPanel.tsx   → Message handling + suggestion cards
├── PreviewPanel.tsx → Live iframe preview
├── ProjectPreviewPanel.tsx → Multi-file project explorer
lib/
├── prompts.ts      → Dynamic prompt generation per language
├── project-types.ts → Project structure parsing
```

---

## 🎯 Competitor Feature Matrix

| Feature                | Claude Code      | Codex             | Cursor       | Replit        | Mint AI                   |
| ---------------------- | ---------------- | ----------------- | ------------ | ------------- | ------------------------- |
| **IDE Integration**    | VS Code, CLI     | VS Code, CLI, Web | Native IDE   | Web IDE       | ❌ Web only               |
| **Code Execution**     | Terminal sandbox | Cloud sandbox     | Local        | WebContainers | ❌ Preview only           |
| **Git Integration**    | Auto-commits     | Auto-commits      | Native       | Native        | ⚠️ Snapshots only         |
| **File System Access** | Full project     | Full project      | Full project | Full project  | ⚠️ Virtual FS             |
| **Web Search**         | ✅               | ✅                | ✅           | ❌            | ✅ Implemented            |
| **MCP Support**        | ✅ Native        | ✅                | ✅           | ❌            | ❌ Missing                |
| **Multi-File Editing** | ✅               | ✅                | ✅           | ✅            | ✅ Plan/Build Flow        |
| **Code Review**        | ✅               | ✅                | ✅           | ✅            | ✅ Visual Diff            |
| **Test Execution**     | ✅               | ✅                | ✅           | ✅            | ❌ Missing                |
| **Collaboration**      | ❌               | ❌                | ❌           | ✅ Real-time  | ❌ Missing                |
| **Project Memory**     | CLAUDE.md        | Codex context     | .cursorrules | .replit       | ✅ .mintrules + CLAUDE.md |

---

## 🚀 Enhancement Roadmap

### Phase 1: Core Platform Features (High Impact)

#### 1. Code Execution: FREE 100% Online Solutions

> **Goal**: Run code entirely in the browser with zero licensing costs

---

##### ✅ Recommended Stack (All Free, All Browser-Based)

| Language         | Solution         | License    | Cost | Backend Needed? |
| ---------------- | ---------------- | ---------- | ---- | --------------- |
| **React/JS**     | Sandpack         | Apache 2.0 | FREE | No              |
| **Python**       | Pyodide          | MPL 2.0    | FREE | No              |
| **HTML/CSS/Vue** | Iframe (current) | N/A        | FREE | No              |

---

##### Option 1: Sandpack (React/JavaScript) ✅ RECOMMENDED

**What it is**: Open-source toolkit by CodeSandbox for live code editing in browser.

**License**: **Apache 2.0** (FREE for personal AND commercial use)

```bash
npm install @codesandbox/sandpack-react
```

```tsx
import { Sandpack } from '@codesandbox/sandpack-react';

export function CodePlayground({ code }: { code: string }) {
  return (
    <Sandpack
      template='react-ts'
      files={{ '/App.tsx': code }}
      options={{ showNavigator: true, editorHeight: 400 }}
    />
  );
}
```

**Note**: Basic React/Vite templates = FREE. Next.js/Astro templates use Nodebox (commercial).

---

##### Option 2: Pyodide (Python in Browser) ✅ RECOMMENDED

**What it is**: Full CPython compiled to WebAssembly. Runs entirely in browser.

**License**: **MPL 2.0** (FREE)

```typescript
import { loadPyodide } from 'pyodide';

const pyodide = await loadPyodide();
const result = await pyodide.runPythonAsync(`
import numpy as np
np.array([1,2,3]).mean()
`);
console.log(result); // 2.0
```

---

##### ⚠️ NOT Recommended for Free Usage

| Solution          | Why Not                                       |
| ----------------- | --------------------------------------------- |
| **WebContainers** | Commercial license for production             |
| **Microsandbox**  | Requires self-hosted server (not 100% online) |
| **E2B**           | Pay-per-use cloud API                         |

---

##### Architecture for Mint AI (100% Browser)

```
┌─────────────────────────────────────────────────┐
│             Mint AI (Next.js Browser)           │
├───────────────┬───────────────┬─────────────────┤
│  React/JS     │    Python     │   HTML/Vue      │
│      ↓        │       ↓       │       ↓         │
│  Sandpack     │   Pyodide     │   Iframe        │
│ (Apache 2.0)  │  (MPL 2.0)    │   (Native)      │
└───────────────┴───────────────┴─────────────────┘
        ALL EXECUTION IN BROWSER - NO BACKEND
```

---

#### 2. Monaco Editor Integration

> Replace preview-only mode with full code editing

**Why**: Users need to edit generated code, not just view it.

**Features**:

- Syntax highlighting for all languages
- IntelliSense/autocomplete
- Multi-file tabs
- Diff view for AI changes
- Inline AI suggestions

```typescript
// components/CodeEditor.tsx
import Editor from '@monaco-editor/react';

<Editor
  language={getLanguage(activeFile)}
  value={files[activeFile]}
  onChange={(value) => updateFile(activeFile, value)}
  options={{
    minimap: { enabled: false },
    fontSize: 14,
    suggestOnTriggerCharacters: true,
  }}
/>;
```

---

#### 3. Git Integration

> Version control for AI-generated changes

**Features**:

- Virtual git repository in browser (isomorphic-git)
- Commit history visualization
- Diff view before applying AI changes
- Branch management
- GitHub/GitLab push integration

```typescript
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';

await git.init({ fs, dir: '/project' });
await git.add({ fs, dir: '/project', filepath: '.' });
await git.commit({
  fs,
  dir: '/project',
  message: 'feat: Add user authentication',
  author: { name: 'Mint AI', email: 'ai@mint.dev' },
});
```

---

### Phase 2: AI Enhancement Features

#### 4. Model Context Protocol (MCP) Support

> Connect to external tools and data sources

**Why**: Claude Code's killer feature. MCP is becoming the standard for AI tool integration.

**Implementation**:

```typescript
// lib/mcp-client.ts
interface MCPServer {
  name: string;
  transport: 'stdio' | 'http';
  command?: string;
  url?: string;
}

const servers: MCPServer[] = [
  { name: 'filesystem', transport: 'stdio', command: 'mcp-server-filesystem' },
  { name: 'github', transport: 'http', url: 'https://mcp.github.com' },
  { name: 'web-search', transport: 'http', url: 'https://mcp.exa.ai' },
];
```

**Unlock Capabilities**:

- File system access beyond generated files
- Database connections (Postgres, Redis)
- API integrations (GitHub, Figma, Slack)
- Web search for up-to-date documentation

---

#### 5. Agentic Coding Mode

> AI that executes multi-step tasks autonomously

**Architecture**:

```
┌─────────────────────────────────────────────────┐
│                  Agent Loop                      │
├─────────────────────────────────────────────────┤
│  1. Understand Task                             │
│  2. Plan Steps (with user approval)             │
│  3. Execute (edit, run, test)                   │
│  4. Verify Results                              │
│  5. Report or Continue                          │
└─────────────────────────────────────────────────┘
```

**Key Features**:

- Plan mode: Show proposed changes before execution
- Tool use: Run terminal commands, edit files, search web
- Self-correction: Re-run on test failure
- Human-in-the-loop: Approval gates for destructive actions

---

#### 6. Web Search Integration

> Access up-to-date documentation and examples

**Why**: Claude Code and Codex can search the web for current APIs and solutions.

```typescript
// lib/tools/web-search.ts
async function searchDocs(query: string): Promise<SearchResult[]> {
  const response = await fetch('/api/tools/search', {
    method: 'POST',
    body: JSON.stringify({ query, sources: ['npm', 'github', 'docs'] }),
  });
  return response.json();
}
```

---

### Phase 3: Developer Experience

#### 7. Project Context & Memory

> Persistent understanding across sessions

**Implementation**:

- Read existing `CLAUDE.md` / `.mintrules` files
- Auto-generate project context from package.json, tsconfig
- Store conversation history in IndexedDB
- Project-level settings and preferences

```typescript
// lib/project-context.ts
interface ProjectContext {
  type: 'nextjs' | 'react' | 'node' | 'python' | 'unknown';
  framework?: string;
  packageJson?: object;
  readme?: string;
  aiRules?: string; // CLAUDE.md content
}

async function analyzeProject(files: FileTree): Promise<ProjectContext>;
```

---

#### 8. Inline AI Assistance

> AI help without leaving the editor

**Features**:

- `Cmd+K` for inline edits
- Code explanations on hover
- Error fix suggestions
- Refactoring proposals
- Documentation generation

---

#### 9. Terminal Integration

> Full terminal experience with AI assistance

```
┌─ Terminal ─────────────────────────────────────┐
│ $ npm install react-query                       │
│ + react-query@5.0.0                            │
│                                                 │
│ $ npm test                                      │
│ PASS src/components/Button.test.tsx            │
│ PASS src/hooks/useAuth.test.ts                 │
│                                                 │
│ 🤖 AI: All tests passing! Ready to commit?     │
└────────────────────────────────────────────────┘
```

---

### Phase 4: Collaboration & Enterprise

#### 10. Real-Time Collaboration

> Multiple users editing together

**Technologies**:

- Y.js for CRDT-based sync
- WebRTC for peer connections
- Presence awareness (cursors, selections)

---

#### 11. Team Features

> Enterprise-ready platform

- Shared prompt libraries
- Organization workspaces
- Usage analytics dashboard
- Role-based access control
- SSO integration

---

#### 12. Code Review Mode

> AI-assisted pull request reviews

**Features**:

- Automated code review comments
- Security vulnerability detection
- Performance issue identification
- Best practice suggestions
- Test coverage analysis

---

## 💰 Monetization Strategy

### Pricing Tiers (Industry Benchmarks)

| Tier           | Price       | Features                                        | Reference               |
| -------------- | ----------- | ----------------------------------------------- | ----------------------- |
| **Free**       | $0          | 50 generations/month, basic preview             | Replit Free             |
| **Pro**        | $20/mo      | Unlimited generations, WebContainers, Git       | Cursor Pro              |
| **Team**       | $40/user/mo | Collaboration, shared context, priority support | GitHub Copilot Business |
| **Enterprise** | Custom      | SSO, audit logs, SLA, dedicated support         | All competitors         |

### Revenue Drivers

1. **Usage-based pricing**: Token consumption beyond tier limits
2. **Add-on packs**: MCP server integrations, enterprise tools
3. **Compute credits**: WebContainer execution time for heavy workloads

---

## 🛠️ Technical Implementation Priority

### Immediate (Weeks 1-4)

1. **Monaco Editor** - Replace preview with full editor
2. **WebContainers** - Add terminal and execution
3. **File System** - Editable virtual file system

### Short-term (Months 1-2)

4. **Git Integration** - Version control in browser
5. **Project Upload** - Analyze existing codebases
6. **Enhanced Prompts** - Context from uploaded projects

### Medium-term (Months 3-4)

7. **MCP Client** - Tool integrations
8. **Agentic Mode** - Multi-step task execution
9. **Web Search** - External knowledge access

### Long-term (Months 5-6)

10. **Collaboration** - Real-time multi-user
11. **Enterprise Features** - Teams, SSO, audit
12. **Code Review** - PR analysis mode

---

## 📦 Recommended Dependencies

```json
{
  "dependencies": {
    "@codesandbox/sandpack-react": "^2.13.0",
    "pyodide": "^0.24.1",
    "@monaco-editor/react": "^4.6.0",
    "isomorphic-git": "^1.25.0",
    "lightning-fs": "^4.4.1",
    "yjs": "^13.6.0",
    "y-webrtc": "^10.3.0",
    "@mcp/client": "^0.1.0"
  }
}
```

---

## 🔑 Key Differentiators to Target

Based on competitor analysis, Mint AI should focus on:

| Differentiator           | Why It Matters                           |
| ------------------------ | ---------------------------------------- |
| **Browser-First**        | No install, instant access (like Replit) |
| **Visual Code Flow**     | Show AI reasoning + changes visually     |
| **Framework Agnostic**   | Not tied to one ecosystem                |
| **Open Model Support**   | OpenRouter = any LLM provider            |
| **Transparent Pricing**  | Clearer than competitors                 |
| **Developer Experience** | Premium UI/UX focus                      |

---

## 📚 References

- [Claude Code Overview](https://code.claude.com/docs/en/overview)
- [OpenAI Codex Features](https://developers.openai.com/codex/cli/features/)
- [WebContainers Guide](https://webcontainers.io/guides/introduction)
- [Model Context Protocol](https://anthropic.com/engineering/code-execution-with-mcp)
- [Cursor Pricing](https://cursor.com/pricing)
- [Agentic IDE Comparison](https://builder.io/blog/agentic-ide)

---

## ✅ Summary

Mint AI has solid foundations (chat interface, streaming, multi-file generation). To compete with Claude Code, Codex, and Cursor, the key gaps are:

1. **Code Execution** → Sandpack (React/JS) + Pyodide (Python) - FREE
2. **Full Editor** → Monaco
3. **Version Control** → isomorphic-git
4. **External Tools** → MCP integration
5. **Autonomous Tasks** → Agentic mode
6. **Knowledge Access** → Web search

The recommended approach is to layer these features incrementally, starting with the editing and execution capabilities that provide the most immediate user value.
