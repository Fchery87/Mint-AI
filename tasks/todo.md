# Plan
**Problem:** Session mapping not updated after WebSocket reconnection, causing "Session not found or terminated" errors when typing commands.  
**Goal (Definition of Done):** Stable PTY session mapping that survives WebSocket reconnections during Fast Refresh.  
**Scope:** 
- Fix PTY message handler dependencies to keep them stable across reconnections
- Add debugging logs to trace session creation and command execution
- Ensure sessionToPtyMap is updated when new PTY sessions are created
**Out of scope:** Disabling Fast Refresh
**Risks/Impact:** High - affects terminal command execution
**Rollback:** Revert TerminalProvider and usePtyClient changes

## TODO
- [x] Remove ptyClient.connected from PTY message handler effect dependencies
- [x] Add debug logging to session creation and command execution
- [x] Add session not found error response in PTY server
- [x] Add isMounted check to prevent reconnection after component unmount
- [x] Add isInitialMount flag to prevent auto-connect during Fast Refresh
- [ ] Test terminal typing after Fast Refresh
- [ ] Verify sessionToPtyMap is updated correctly on reconnection
- [ ] Test cd, history, and streaming functionality

## High-Level Updates
- 2026-01-26 – Phase 6a: Added cd support, command history, streaming to PTY terminal
- 2026-01-26 – Fixed xterm.js v5 cleanup bug (dispose pattern)
- 2026-01-26 – Built node-pty native module for Linux
- 2026-01-27 – Fixing WebSocket reconnection session mapping issue

## Review
**Summary:**  
- ✅ PTY server tracks cwd per session with cd detection
- ✅ Command history with ↑/↓ navigation (100 commands stored)
- ✅ Output streaming for long-running processes
- ✅ Fixed xterm.js cleanup crash
- ✅ Removed duplicate WebSocket connections
- ✅ Fixed Fast Refresh session mapping (removed ptyClient.connected from deps)
- ✅ Added comprehensive debugging logs

**Trade-offs:**  
- PTY message handlers now stay attached across reconnections (good)
- More console logs for debugging (can be removed later)
- Session map updates rely on 'created' messages arriving in order

**Follow-ups:**  
- Test terminal typing after Fast Refresh
- Test cd, history, and streaming functionality
- Remove debug logs once stable
