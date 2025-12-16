# Dev Server

Start the development server and open the application.

## Usage

`/dev-server`

## Steps

1. Start development server:
   ```bash
   bun run dev
   ```

2. Wait for output:
   ```
   ▲ Next.js 16.0.10
   - Local:        http://localhost:3000
   ```

3. Open browser to http://localhost:3000

4. Test chat functionality:
   - Type a message like "Create a button"
   - Send message
   - Watch for API response and preview

5. Check for errors:
   - Browser DevTools Console (F12)
   - Terminal output for server errors

6. Stop server:
   ```
   Ctrl+C
   ```

## Troubleshooting

### Port 3000 already in use

```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 bun run dev
```

### V0_API_KEY not configured

```bash
# Check .env.local exists
ls -la .env.local

# If missing, copy from example
cp .env.local.example .env.local

# Edit and add your V0_API_KEY
# Then restart: Ctrl+C and bun run dev
```

### Build errors

```bash
# Check for type errors
bun typecheck

# Clear cache and restart
rm -rf .next
bun run dev
```

### Chat not working

1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab - POST to `/api/chat` should return data
4. Verify V0_API_KEY is valid

## Development Tips

- Changes to code auto-reload in browser
- Keep DevTools open to catch console errors
- Use localhost:3000 for testing, not 127.0.0.1
- Test with valid V0_API_KEY for full functionality

Reference: `CLAUDE.md` - Core Commands section.
