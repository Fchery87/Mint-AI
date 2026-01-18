# Safe Preview by Default Design

**Goal:** Make preview safe by default while preserving React/JSX preview behind an explicit trusted toggle.

**Summary:**
Default preview renders HTML/CSS only with scripts blocked and strict CSP. When React/JSX is detected, show a warning and a user-controlled "Enable trusted preview" toggle to run code in a sandboxed iframe. Trusted mode uses the existing React/JSX pipeline; safe mode never executes JS.

## Architecture
- `components/HtmlPreview.tsx` gains a `trustedPreview` state.
- If content is React/JSX, show an inline warning + toggle.
- Safe mode: render HTML/CSS in `iframe.srcdoc` with CSP that blocks scripts and external network.
- Trusted mode: allow scripts in the iframe and use the existing React/JSX execution path.

## UX Flow
1. User enters code.
2. If code is HTML/CSS: safe preview renders immediately.
3. If code is React/JSX: safe mode shows “Preview requires trusted mode” + toggle.
4. User enables trusted mode to run React preview.
5. Refresh resets trusted mode.

## Error Handling
- Existing error overlay remains.
- Safe mode avoids runtime errors by not executing scripts.

## Testing
- Optional: component test to assert toggle appears for React/JSX and safe mode blocks execution.
- Manual: verify HTML renders, React requires toggle, and trusted mode runs.

## Rollout
- No backend changes.
- No new dependencies.
- Entirely free and local.
