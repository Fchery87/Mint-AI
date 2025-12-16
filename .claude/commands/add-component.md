# Add Component

Create a new React component following Mint AI patterns.

## Usage

`/add-component ComponentName`

## Steps

1. Create component file: `components/$ARGUMENTS.tsx`

2. Use this template:
```typescript
import { useState } from "react";

interface YourComponentProps {
  // Define props here
}

export default function $ARGUMENTS({
  // Destructure props
}: YourComponentProps) {
  // State and logic

  return (
    <div className="flex flex-col">
      {/* JSX */}
    </div>
  );
}
```

3. Add proper TypeScript types:
   - Props interface with clear field names
   - Type all event handlers
   - Type all state with `useState<Type>`

4. Verify type checking:
   ```bash
   bun typecheck components
   ```

5. Test in dev server:
   ```bash
   bun run dev
   # Open http://localhost:3000
   # Test component in browser
   ```

6. Commit with conventional message:
   ```bash
   git add components/$ARGUMENTS.tsx
   git commit -m "feat: add $ARGUMENTS component"
   ```

## Rules to Follow

- ✅ Use functional components with hooks only
- ✅ Define props interface before component
- ✅ Use Tailwind for all styling (className only)
- ✅ Handle loading and error states
- ✅ Add meaningful empty states
- ✅ Type all event handlers
- ❌ No class components
- ❌ No inline styles
- ❌ No hardcoded colors (use mint/slate theme)
- ❌ No console.logs in production code

## Examples

See `components/ChatPanel.tsx` for message display pattern.
See `components/PreviewPanel.tsx` for async loading pattern.

Reference: `components/CLAUDE.md` for detailed patterns.
