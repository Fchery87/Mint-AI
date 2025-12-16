# MCP Server Setup Guide

This guide helps you configure Model Context Protocol (MCP) servers to extend Claude Code's capabilities for Mint AI development.

## Recommended MCP Servers

### 1. GitHub Integration

Manage issues, pull requests, and repositories.

```bash
# Install GitHub MCP server
claude mcp add --scope user github -- bunx @modelcontextprotocol/server-github

# Set GitHub token
export GITHUB_TOKEN="ghp_your_token_here"
# Or add to ~/.claude/config.json
```

**Use Cases**:
- View and create GitHub issues
- Create and manage pull requests
- Fetch repository information
- Manage releases and tags

**Commands**:
```bash
gh issue view <number>         # Get issue details
gh pr create                   # Create PR from current branch
gh issue list                  # List open issues
gh pr review -a                # Auto-approve PR
```

### 2. Context7 - Documentation Lookups

Access official documentation for libraries.

```bash
# Install Context7 MCP server
claude mcp add --scope user context7 -- bunx context7-mcp
```

**Use Cases**:
- Look up v0 SDK documentation
- Reference Next.js 16 docs
- Check React 19 API reference
- Search Tailwind CSS utilities

**Commands**:
```bash
# In conversation:
# "Look up v0-sdk chat API"
# "How do I use React useEffect?"
# "What's the Tailwind syntax for padding?"
```

### 3. Sequential Thinking (Optional)

Break down complex architectural decisions.

```bash
# Install Sequential Thinking MCP server
claude mcp add --scope user sequential-thinking -- bunx @modelcontextprotocol/server-sequential-thinking
```

**Use Cases**:
- Design new feature architecture
- Debug complex issues
- Refactor large components
- Plan testing strategy

## Project-Specific Configuration

Create `.mcp.json` in the project root (commit to git):

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "bunx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "context7": {
      "type": "stdio",
      "command": "bunx",
      "args": ["context7-mcp"]
    }
  }
}
```

## Setting Up GitHub Token

1. Go to https://github.com/settings/tokens/new

2. Create Personal Access Token with scopes:
   - `repo` - Full control of repositories
   - `workflow` - Update GitHub Actions workflows (optional)
   - `gist` - Create gists (optional)

3. Save the token (only shown once!)

4. Add to environment:
   ```bash
   # Add to ~/.bashrc, ~/.zshrc, or ~/.profile
   export GITHUB_TOKEN="ghp_your_token_here"

   # Or set in ~/.claude/config.json
   {
     "env": {
       "GITHUB_TOKEN": "ghp_your_token_here"
     }
   }
   ```

## Using GitHub MCP in Claude Code

### Create a PR from current branch

```
/help github-create-pr
# OR:
gh pr create --title "feat: add new component" --body "Description"
```

### Check CI status

```bash
gh run list --branch main --limit 5
gh run view <run-id>
```

### Create issue from bug

```bash
gh issue create --title "Bug: chat not scrolling" --body "Description of bug"
```

## Using Context7 for Lookups

When working on Mint AI:

1. **v0 SDK questions**:
   ```
   Context7: How do I use V0Client.sendMessage()?
   ```

2. **Next.js questions**:
   ```
   Context7: What's the App Router directory structure in Next.js 16?
   ```

3. **React questions**:
   ```
   Context7: Show me the useEffect pattern for async operations
   ```

## Future MCP Servers (Optional)

### Web Search
```bash
claude mcp add --scope user web -- bunx @modelcontextprotocol/server-brave-search
```
- Search npm packages
- Look up library versions
- Find Stack Overflow answers

### File System (with safety)
```bash
claude mcp add --scope user filesystem -- bunx @modelcontextprotocol/server-filesystem
```
- Read files across the system
- Understand external config files

### Database Tools (if using DB)
```bash
claude mcp add --scope user postgres -- bunx @modelcontextprotocol/server-postgres
```
- Query databases
- Run migrations
- Analyze schema

## Verifying Setup

Test your MCP setup:

```bash
# List configured servers
claude config list

# Test GitHub token
gh auth status

# Test Context7 (in Claude Code session)
# Ask: "Context7: What's React.useState?"
```

## Troubleshooting

### GitHub token not working

```bash
# Check token is set
echo $GITHUB_TOKEN

# Verify it's valid
gh auth status

# If not, create new token at:
# https://github.com/settings/tokens/new
```

### MCP server not responding

```bash
# Check server is installed
bunx @modelcontextprotocol/server-github --version

# Try running directly
bunx @modelcontextprotocol/server-github

# Should output JSON (Ctrl+C to exit)
```

### Context not showing results

- Make sure topic is specific (e.g., "v0-sdk sendMessage" not just "sdk")
- MCP servers need internet access
- Some topics may not have documentation available

## Best Practices

1. **Keep tokens secure**:
   - Never commit tokens to git
   - Use `.env.local` or environment variables
   - Rotate tokens periodically

2. **Use for appropriate tasks**:
   - GitHub MCP: PR creation, issue tracking
   - Context7: Documentation lookups
   - Bash/CLI: Local development commands

3. **Session management**:
   - MCP servers add context token usage
   - Use `/clear` between unrelated tasks
   - Don't query large repositories in one session

## References

- [MCP Documentation](https://modelcontextprotocol.io)
- [GitHub CLI Reference](https://cli.github.com/manual)
- [GitHub Token Creation](https://github.com/settings/tokens/new)
- [Claude Code MCP Setup](https://claude.com/claude-code)
