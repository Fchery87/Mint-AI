# Check Types

Run comprehensive TypeScript type checking across the entire project.

## Usage

`/check-types` or `/check-types [path]`

## Steps

1. Run full project type check:
   ```bash
   bun typecheck
   ```

2. If errors found, check specific directory:
   ```bash
   bun typecheck app
   bun typecheck components
   bun typecheck app/api
   ```

3. Review error messages and fix issues:
   - Missing type annotations
   - Incorrect prop types
   - Type mismatches

4. For stubborn issues, search the codebase:
   ```bash
   # Find all 'any' types
   rg -n ": any" --type ts --type tsx

   # Find missing types
   rg -n "const.*=" app components | head -20
   ```

5. Commit fixes:
   ```bash
   git add .
   git commit -m "fix: resolve TypeScript errors"
   ```

## Common Issues

### "Property does not exist on type"

Usually props not matching interface:

```typescript
// ❌ Props interface
interface Props {
  name: string;
}

// Component receives extra prop
<Component name="test" age={25} /> // Error: age not in Props

// Fix: Add to interface
interface Props {
  name: string;
  age?: number;
}
```

### "Type 'any' is not allowed"

Too generic typing:

```typescript
// ❌ Bad
const handleChange = (e: any) => {}

// ✅ Fix: Use specific event type
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {}
```

### Missing type imports

```typescript
// ❌ Not imported
const items: Array<Item> = []; // Error: Item not found

// ✅ Import it
import { Item } from "@/types";
const items: Array<Item> = [];
```

## Pre-PR Gate

Always run before committing:

```bash
bun typecheck && echo "✅ Type check passed"
```

If it passes, ready for commit!

Reference: `CLAUDE.md` - Universal Development Rules section.
