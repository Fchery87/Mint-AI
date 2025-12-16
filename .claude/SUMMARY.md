# Claude Code CLAUDE.md Hierarchy - Summary

This document summarizes the complete CLAUDE.md hierarchy for Mint AI, optimized for Claude Code development workflows.

## Files Generated

### 1. Root CLAUDE.md (`CLAUDE.md`)

**Purpose**: Universal development rules, navigation hub, and project guidelines.

**Contains**:
- Project identity and overview
- Universal development rules (MUST/SHOULD/MUST NOT)
- Core commands and build workflow
- Project structure map
- Quick find search commands
- Security and secrets management
- Git workflow conventions
- Testing strategy (future implementation)
- Available tools and permissions
- Key files to understand
- Common workflows
- Environment setup

**Key Sections**:
- Code Quality Rules
- React Patterns
- Styling Guidelines
- Dangerous Patterns to Block
- Git Workflow
- Security Boundaries

**When to Read**: Start here for all development work.

---

### 2. API Routes CLAUDE.md (`app/api/CLAUDE.md`)

**Purpose**: v0 SDK integration patterns and API endpoint best practices.

**Contains**:
- Development commands specific to API routes
- Route handler pattern and structure
- v0 SDK integration patterns
- Error handling best practices
- Request validation patterns
- Environment variable usage
- v0 SDK patterns (create chat, continue chat, rate limiting)
- Response types and structures
- Message flow architecture
- Session persistence patterns
- Quick search commands
- Common gotchas (env vars, request parsing, CORS)
- Testing patterns (future)
- Pre-PR checklist

**Key Patterns**:
- Request/response typing
- Error handling with status codes
- v0 Client initialization
- Chat session management
- Environment variable validation

**When to Read**: When working in `app/api/` directory.

---

### 3. Components CLAUDE.md (`components/CLAUDE.md`)

**Purpose**: React component standards, state management, and styling patterns.

**Contains**:
- Development commands for components
- Component architecture and file structure
- Component template pattern
- Naming conventions
- Props interface pattern
- State management pattern
- Event handler pattern
- Loading and error states pattern
- Tailwind styling pattern
- Conditional rendering patterns
- Key components (ChatPanel, PreviewPanel)
- Styling guide with mint color palette
- Component composition and data flow
- Quick search commands
- Type checking and analysis
- Common patterns in Mint AI
- Common gotchas (keys, closures, dark mode)
- Pre-PR checklist

**Key Patterns**:
- Functional components with hooks
- Props interfaces
- Event handler typing
- Tailwind className usage
- Loading/error state management
- Message rendering patterns

**When to Read**: When working in `components/` directory.

---

### 4. Claude Code Configuration (`.claude/settings.json`)

**Purpose**: Automation hooks for development workflows.

**Contains**:
- PreToolUse hooks:
  - Block dangerous bash commands (rm -rf, git force push)
  - Warn before .env.local edits
- PostToolUse hooks:
  - Auto-run type checking on component/API edits
  - Development server integration

**Hooks Configured**:
- Security: Block dangerous operations
- Warnings: Alert on sensitive file edits
- Validation: Auto-check types after changes

---

### 5. Custom Slash Commands (`.claude/commands/`)

**Purpose**: Repeatable workflows for common tasks.

**Commands Created**:

#### `/add-component ComponentName`
Create a new React component following patterns.
- Template with TypeScript props interface
- Type checking step
- Testing in dev server
- Commit guidance

#### `/add-api-route endpoint-name`
Create a new API endpoint with v0 SDK integration.
- Route handler template
- Input validation
- Environment setup
- Testing with curl
- Commit guidance

#### `/check-types [path]`
Run TypeScript type checking.
- Full project check or specific directory
- Common error explanations
- Fixes for typical issues
- Pre-PR gate usage

#### `/dev-server`
Start development server.
- Next.js dev server startup
- Troubleshooting guide
- Development tips
- Port conflict resolution

---

### 6. MCP Setup Guide (`.claude/MCP-SETUP.md`)

**Purpose**: Configure external tools and documentation access.

**Recommended Servers**:
1. **GitHub** - Manage issues, PRs, releases
2. **Context7** - Official library documentation lookups
3. **Sequential Thinking** - Complex architecture decisions

**Configuration**:
- `.mcp.json` for project-specific setup
- GitHub token creation and security
- Server verification
- Troubleshooting guide

---

## Hierarchy & Organization

```
CLAUDE.md                           Root rules & navigation
├── app/api/CLAUDE.md               API-specific patterns
├── components/CLAUDE.md            Component standards
├── tests/CLAUDE.md                 (Future) Testing setup
│
.claude/
├── settings.json                   Hooks for automation
├── commands/
│   ├── add-component.md
│   ├── add-api-route.md
│   ├── check-types.md
│   └── dev-server.md
└── MCP-SETUP.md                    External tool configuration
```

## Quick Start for New Sessions

1. **Read Root CLAUDE.md First**
   ```bash
   # Get oriented with project rules
   cat CLAUDE.md | head -100
   ```

2. **Navigate to Your Directory**
   - Working on components? → Read `components/CLAUDE.md`
   - Working on API routes? → Read `app/api/CLAUDE.md`

3. **Use Custom Commands**
   ```
   /add-component YourComponent
   /add-api-route endpoint-name
   /check-types
   /dev-server
   ```

4. **Follow the Patterns**
   - Each CLAUDE.md has code examples
   - Use "✅ DO" and "❌ DON'T" sections
   - Check "Common Patterns" section for similar code

## Development Workflow

### Adding a New Component

1. Read: `components/CLAUDE.md`
2. Run: `/add-component ComponentName`
3. Follow: Template in command
4. Check: `/check-types components`
5. Test: `/dev-server`
6. Commit: With conventional message

### Adding an API Route

1. Read: `app/api/CLAUDE.md`
2. Run: `/add-api-route endpoint-name`
3. Follow: Template in command
4. Check: `/check-types app/api`
5. Test: `curl` command or browser
6. Commit: With conventional message

### Fixing a Bug

1. Read: Relevant CLAUDE.md (root + directory-specific)
2. Search: `rg` command from "Quick Find Commands"
3. Locate: File and understand issue
4. Fix: Following patterns in CLAUDE.md
5. Check: `/check-types`
6. Test: `/dev-server`
7. Commit: With conventional message

## Safety & Security

### Protected Operations (Blocked by Hooks)

- `rm -rf` - Requires explicit confirmation
- `git push --force` - Requires explicit confirmation
- `.env.local` edits - Warning message

### Tool Permissions

✅ **Always allowed**:
- Read any file
- Write component/API code
- Run type checking

❌ **Ask first**:
- Edit `.env.local`
- Git force operations
- Delete important files

## Key Commands for Sessions

```bash
# Type checking
bun typecheck                    # Full project
bun typecheck components         # Components only
bun typecheck app/api            # API only

# Development
bun run dev                      # Start dev server
bun run build                    # Build for production

# Search
rg -n "keyword" components       # Find in components
rg -n "keyword" app/api          # Find in API
gh issue list                    # GitHub issues
```

## Common Gotchas & Solutions

### TypeScript Errors
- **Issue**: "Property does not exist on type"
- **Solution**: Check props interface matches actual props
- **Reference**: `components/CLAUDE.md` - Props Interface Pattern

### Component Not Rendering
- **Issue**: Component shows nothing or errors
- **Solution**: Check type errors first (`bun typecheck`)
- **Reference**: `components/CLAUDE.md` - Conditional Rendering

### API Not Working
- **Issue**: Chat messages not generating
- **Solution**: Check V0_API_KEY in `.env.local`
- **Reference**: `app/api/CLAUDE.md` - Environment Variables

### Styling Issues
- **Issue**: Colors look wrong or layout broken
- **Solution**: Use Tailwind classes, not inline styles
- **Reference**: `components/CLAUDE.md` - Tailwind Styling Pattern

## Future Enhancements

### Testing Setup (Ready to implement)
- Create `tests/CLAUDE.md`
- Set up Vitest + Testing Library
- Add test patterns and examples
- Create `/add-test` command

### CI/CD Pipeline (Future)
- GitHub Actions workflow
- Pre-commit hooks
- Type checking gate
- Linting enforcement

### Database Integration (If needed)
- Create `db/CLAUDE.md`
- Migrations guide
- MCP database server
- Query patterns

## Periodic Maintenance

- **Monthly**: Review and update CLAUDE.md files based on learnings
- **After major changes**: Update patterns and examples
- **Quarterly**: Evaluate if new subdirectory CLAUDE.md files are needed
- **As needed**: Add new custom commands for repeated workflows

## Using This Hierarchy Effectively

### For Solving Problems
1. Start with root `CLAUDE.md` for general rules
2. Move to directory-specific CLAUDE.md for patterns
3. Use "Quick Find Commands" to search codebase
4. Reference "Common Patterns" for examples

### For Building Features
1. Read entire relevant CLAUDE.md file first
2. Use `/add-component` or `/add-api-route` command
3. Follow template and patterns
4. Run `/check-types` and `/dev-server`
5. Commit with conventional message

### For Debugging
1. Check root CLAUDE.md "Common Gotchas"
2. Check directory-specific "Common Gotchas"
3. Use search commands to find related code
4. Follow "Error Handling" patterns to fix

## Tools & Resources

- **Local**: bash, git, bun, rg (ripgrep)
- **TypeScript**: Type checking and validation
- **Testing** (future): Vitest + Testing Library
- **MCP Servers**: GitHub, Context7, Sequential Thinking
- **Documentation**: React, Next.js, Tailwind, v0-sdk

## Questions & Answers

**Q: Where do I start as a new developer?**
A: Read `CLAUDE.md` from top to bottom, then read the directory-specific file for your area.

**Q: What's the fastest way to add a component?**
A: Run `/add-component ComponentName` and follow the template.

**Q: How do I fix type errors?**
A: Run `/check-types`, read the error message, check the "Props Interface Pattern" in `components/CLAUDE.md`.

**Q: What if I break something?**
A: Use git to revert. Worst case, hooks will block dangerous operations.

**Q: Can I add my own custom commands?**
A: Yes! Add `.md` files to `.claude/commands/` following the existing pattern.

## Success Indicators

You're using the hierarchy effectively when:

- ✅ You refer to CLAUDE.md files for patterns instead of guessing
- ✅ New code follows existing conventions
- ✅ Type checking passes first try
- ✅ Code reviews focus on logic, not style
- ✅ Onboarding new developers takes minutes
- ✅ Commands become muscle memory (`/add-component`, `/check-types`)

## Getting Help

- **For patterns**: Check relevant CLAUDE.md and "Common Patterns" section
- **For commands**: Use `/help` or check `.claude/commands/`
- **For tools**: Check "Resources" section at bottom of each CLAUDE.md
- **For types**: Run `bun typecheck` and search for example in codebase
- **For debugging**: Check "Common Gotchas" and use search commands

---

**Last Updated**: 2025-12-15
**Version**: 1.0
**Status**: Complete and ready for use
