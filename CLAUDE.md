# Mint AI

A v0.dev-style component generator powered by the v0 Platform API. This CLAUDE.md is the authoritative source for development guidelines and Claude Code automation rules.

## Overview

- **Type**: Standard Next.js application (not a monorepo)
- **Stack**: Next.js 16, TypeScript (strict mode), Tailwind CSS, React 19, Bun
- **Architecture**: Split-screen chat interface + live component preview
- **AI Integration**: v0 SDK for component generation with real-time preview
- **Status**: MVP complete, testing infrastructure needed

Subdirectories contain specialized CLAUDE.md files that extend these rules:
- [`app/api/CLAUDE.md`](app/api/CLAUDE.md) - API route patterns
- [`components/CLAUDE.md`](components/CLAUDE.md) - React component standards

---

## Universal Development Rules

### Code Quality (MUST)

- **MUST** write all code in TypeScript with strict mode enabled
- **MUST** use functional components exclusively (no class components)
- **MUST** follow component colocation pattern (component + exports in same file)
- **MUST** handle errors explicitly (no silent failures)
- **MUST NOT** use `any` type without explicit justification comment
- **MUST NOT** bypass TypeScript errors with `@ts-ignore`
- **MUST NOT** commit `.env.local`, API keys, or secrets

### Code Style (SHOULD)

- **SHOULD** use descriptive variable names (no single letters except `i`, `j` in loops)
- **SHOULD** keep functions under 50 lines (extract complex logic)
- **SHOULD** use const over let, never use var
- **SHOULD** prefix boolean variables with `is` or `has` (e.g., `isLoading`, `hasError`)
- **SHOULD** use React Query patterns for async operations (see components/CLAUDE.md)
- **SHOULD** extract reusable components instead of duplicating JSX
- **SHOULD** write self-documenting code (good naming > comments)

### React Patterns (SHOULD)

- **SHOULD** use hooks (`useState`, `useEffect`, `useRef`) over class component patterns
- **SHOULD** memoize expensive computations with `useMemo`
- **SHOULD** use `useCallback` for event handlers passed to memoized children
- **SHOULD** split large components (>200 lines) into smaller sub-components
- **SHOULD** provide meaningful loading + error states for all async operations
- **SHOULD** validate form inputs with clear error messages

### Styling (SHOULD)

- **SHOULD** use Tailwind utility classes only (no inline styles)
- **SHOULD** follow the mint color palette defined in `tailwind.config.ts`
- **SHOULD NOT** hardcode colors; use design tokens from theme config
- **SHOULD** use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- **SHOULD** keep component styles in className (co-located with component)

### Anti-Patterns (MUST NOT)

- **MUST NOT** create deeply nested component hierarchies (max 3 levels)
- **MUST NOT** use global state for component-local concerns
- **MUST NOT** fetch data in render logic (use effects + hooks)
- **MUST NOT** hardcode URLs/API endpoints (use environment variables)
- **MUST NOT** disable TypeScript checks without team consensus
- **MUST NOT** leave console.logs in production code
- **MUST NOT** use `eval()` or similar unsafe code execution

---

## Core Commands

### Development Workflow

```bash
# Start development server
bun run dev

# Type checking across project
bun typecheck

# (Future) Run tests
bun test

# (Future) Run tests in watch mode
bun test:watch
```

### Build & Production

```bash
# Build for production
bun run build

# Start production server
bun run start

# Analyze bundle size (when needed)
bunx esbuild-analyze
```

### Pre-PR Quality Gate (when testing is added)

```bash
bun typecheck && \
bun lint && \
bun test && \
bun run build
```

---

## Project Structure

### Applications

- **`app/`** → Next.js App Router
  - `api/chat/route.ts` - Chat API endpoint with v0 SDK integration
  - `page.tsx` - Main split-screen interface
  - `layout.tsx` - Root layout with Sonner provider
  - `globals.css` - Global Tailwind styles

### Components

- **`components/`** → Reusable React components
  - `ChatPanel.tsx` - Chat interface (messages, input, suggestions)
  - `PreviewPanel.tsx` - Live preview iframe component

### Configuration

- **`tailwind.config.ts`** - Design system with mint theme
- **`next.config.ts`** - Next.js settings
- **`tsconfig.json`** - TypeScript strict mode
- **`package.json`** - Bun dependencies and scripts

### Environment

- **`.env.local.example`** - Template for environment variables
- **`.gitignore`** - Excludes sensitive files, .next, node_modules

---

## Quick Find Commands

### Code Navigation

```bash
# Find API endpoints
rg -n "export (async )?function (GET|POST|PUT|DELETE)" app/api

# Find React components
rg -n "^export (function|const) .*\(.*\)" components

# Find chat-related code
rg -n "chat|Chat" --type ts --type tsx

# Find environment variable usage
rg -n "process\.env\." app components

# Find Tailwind classes
rg -n "className=" components | head -20
```

### Type Checking

```bash
# Check for TypeScript errors
bun typecheck

# Find all 'any' types (should be minimal)
rg -n ": any" --type ts --type tsx

# Find all untyped props
rg -n "props\)" --type tsx | grep -v "Props>"
```

### Search API Integration

```bash
# Find v0 SDK usage
rg -n "v0Client\|V0Client\|v0-sdk" app

# Find fetch operations
rg -n "fetch(" app components

# Find toast notifications
rg -n "toast\." components | head -10
```

---

## Security & Secrets

### Secrets Management

- **NEVER** commit tokens, API keys, or credentials to git
- Use `.env.local` for local secrets (already in `.gitignore`)
- Use environment variables for CI/CD secrets (GitHub Settings)
- Never log API responses that contain sensitive data
- PII must be redacted in error messages and logs

### Safe Operations

- Review all bash commands before execution
- Confirm before: `git push --force`, `rm -rf` operations
- Always test API changes with valid `V0_API_KEY`
- Use preview/staging URLs when testing components
- Validate user input before sending to v0 API

### File Security

- `✅` Safe to edit: Component files, API routes, config files
- `❌` Ask before editing: `.env.local`, secrets, package.json (add deps carefully)
- `❌` Never edit: `.gitignore`, lock files (managed by Bun)

---

## Git Workflow

- Branch from `main`: `feature/description` or `fix/issue-number`
- Use Conventional Commits:
  - `feat:` new component or feature
  - `fix:` bug fix
  - `refactor:` code improvement without behavior change
  - `docs:` documentation updates
  - `chore:` dependency updates, config changes
- Keep commits focused (one feature per commit)
- Push feature branch and create PR for review
- All code must be TypeScript-valid before merge
- Delete branch after merge

### Example Commit Messages

```
feat: add suggestion cards to empty chat state
fix: prevent message duplication on rapid sends
refactor: extract message formatting to utility
docs: update API endpoint documentation
chore: upgrade v0-sdk to latest version
```

---

## Testing Strategy (Future Implementation)

### Unit Tests

- Framework: **Vitest** + **Testing Library**
- Location: Colocated with source (`Component.test.tsx`)
- Coverage target: >80% for new features
- Pattern: Test user behavior, not implementation details

### Integration Tests

- Location: `tests/integration/`
- Test API endpoints with real v0-sdk calls
- Verify chat state management

### E2E Tests

- Location: `tests/e2e/`
- Framework: **Playwright**
- Test critical paths: message send → component generation → preview

### Running Tests (once set up)

```bash
bun test                    # Run all tests
bun test:watch             # Watch mode
bun test:coverage          # Coverage report
bun test Component.test.tsx # Single file
```

---

## Available Tools

You have access to:

- **Standard tools**: bash, rg (ripgrep), git, bun
- **GitHub CLI**: `gh` for issues, PRs, releases
- **TypeScript**: Type checking and analysis
- **Tailwind CLI**: Style validation (via npm/bun)

### Tool Permissions

- ✅ Read any file in the project
- ✅ Write/edit component and API files
- ✅ Run `bun typecheck` for validation
- ✅ Run `bun run dev` to test locally
- ✅ Create test files and run tests
- ❌ Edit `.env.local` directly (ask first, use .env.local.example)
- ❌ `git push --force` (ask first)
- ❌ Delete important files/directories (confirm first)
- ❌ Modify `.gitignore` or core config without discussion

---

## Specialized Context

When working in specific directories, refer to their CLAUDE.md files for detailed guidance:

- **API Routes**: [app/api/CLAUDE.md](app/api/CLAUDE.md) - v0 SDK integration, error handling, request/response types
- **Components**: [components/CLAUDE.md](components/CLAUDE.md) - Component patterns, state management, styling
- **Testing** (future): `tests/CLAUDE.md` - Test strategies and fixtures

---

## Key Files to Understand First

These files define the application architecture:

1. **`app/layout.tsx`** - Root layout, Sonner provider setup
2. **`app/page.tsx`** - Main split-screen interface and chat logic
3. **`app/api/chat/route.ts`** - v0 SDK integration and message handling
4. **`components/ChatPanel.tsx`** - Chat message rendering and input
5. **`components/PreviewPanel.tsx`** - Preview iframe management
6. **`tailwind.config.ts`** - Design system tokens (mint color palette)
7. **`tsconfig.json`** - TypeScript configuration

---

## Common Workflows

### Add a New Component

```bash
# 1. Create file in components/
touch components/NewComponent.tsx

# 2. Write component with TypeScript
# See components/CLAUDE.md for pattern

# 3. Export from parent
# Import in page.tsx or other components

# 4. Type check
bun typecheck
```

### Add an API Route

```bash
# 1. Create route handler in app/api/
touch app/api/new-endpoint/route.ts

# 2. Implement with types (see app/api/CLAUDE.md)
# 3. Use v0 SDK if needed
# 4. Test with curl or API client

# 5. Type check
bun typecheck
```

### Fix a Bug

```bash
# 1. Understand the issue
# - Read CLAUDE.md for relevant directory
# - Search codebase: rg -n "keyword" app components

# 2. Locate and fix
# - Make minimal, focused change
# - Verify types: bun typecheck

# 3. Test locally
# - bun run dev
# - Test in browser

# 4. Commit
# git add .
# git commit -m "fix: description of fix"
```

---

## Environment Setup

### Required Variables

Copy `.env.local.example` and add your v0 API key:

```bash
cp .env.local.example .env.local
# Edit .env.local with V0_API_KEY from https://v0.dev/settings/api-keys
```

### Optional Variables (Future)

```bash
# For testing
TEST_V0_API_KEY=test_key_here

# For monitoring/debugging
DEBUG=app:*
```

---

## Common Gotchas

- **Environment Variables**: Client-side env vars need `NEXT_PUBLIC_` prefix (none used yet)
- **TypeScript Strict**: Requires explicit typing for function parameters and returns
- **Tailwind Classes**: Must be recognized at build time (no runtime dynamic class generation)
- **Mint Color**: Use `mint-{shade}` (50-900) not hardcoded colors
- **API Errors**: v0 SDK may rate limit; implement backoff strategy
- **Preview Iframe**: Restrict sandbox attributes carefully for security
- **Message State**: Chat history is in-memory (lost on refresh; persist to localStorage if needed)

---

## Quick Debugging

### TypeScript Errors

```bash
# See all type errors
bun typecheck

# Find specific type issue
bun typecheck 2>&1 | grep "filename"
```

### Runtime Errors

```bash
# Check browser console
bun run dev
# Open http://localhost:3000 and check DevTools

# Check terminal logs for API errors
# Look for console.error in terminal output
```

### v0 SDK Issues

```bash
# Verify API key is set
echo $V0_API_KEY

# Check v0 SDK version
grep "v0-sdk" package.json

# Test API manually
bun repl  # then: import { V0Client } from 'v0-sdk'
```

---

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **v0 SDK**: https://github.com/vercel/v0-sdk
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React 19**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Bun**: https://bun.sh/docs

---

## Contributing

Before submitting changes:

1. Read relevant CLAUDE.md (root + subdirectory)
2. Follow naming conventions and patterns
3. Ensure `bun typecheck` passes
4. Test in dev server: `bun run dev`
5. Write clear commit messages
6. Keep PRs focused on single feature/fix

---

## Notes for Claude Code Sessions

### Using This CLAUDE.md

- This file is the **source of truth** for development rules
- Reference subdirectory CLAUDE.md when working in specific areas
- Use `#` key to add session-specific memories (e.g., "testing setup started")
- Periodically review and update based on team learnings

### Suggested Custom Commands

When setting up `.claude/commands/`, create:
- `/add-component` - New component scaffold
- `/add-api-route` - New API endpoint scaffold
- `/check-types` - Full TypeScript validation
- `/test-setup` - Initialize Vitest + Testing Library

### Hooks Recommendations

Set up in `.claude/settings.json`:
- **PreToolUse**: Block dangerous git/bash operations
- **PostToolUse**: Auto-run `bun typecheck` after component edits
- **PostToolUse**: Validate Tailwind classNames

See `.claude/settings.json.example` for configuration.
