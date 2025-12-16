# React Components - Mint AI UI

**Technology**: React 19 with Hooks, TypeScript strict, Tailwind CSS
**Entry Point**: Individual `.tsx` files in this directory
**Parent Context**: See [../CLAUDE.md](../CLAUDE.md)

This directory contains all reusable React components. Components follow a consistent pattern: functional components with TypeScript interfaces, co-located styles, and explicit error/loading states.

---

## Development Commands

### This Directory

```bash
# Type check components
bun typecheck components

# Start dev server (includes components)
bun run dev

# Search for component usage
rg -n "ChatPanel\|PreviewPanel" app

# Check for prop type mismatches
bun typecheck components --strict
```

### Pre-PR Checklist

```bash
# Verify all components type-check
bun typecheck components

# Test in dev server
bun run dev

# Check no console warnings
# Open DevTools and look for warnings

# Verify component exports
rg -n "^export" components
```

---

## Component Architecture

### File Structure

Each component follows this pattern:

```
components/
├── ChatPanel.tsx          # Chat interface component
├── PreviewPanel.tsx       # Preview iframe component
```

### Component Template Pattern

Every component should follow this structure:

```typescript
// 1. Imports at top
import { useState, useRef } from "react";
import { Send } from "lucide-react";

// 2. Define props interface
interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

// 3. Component definition with "use client" if needed
export default function ChatPanel({
  messages,
  isLoading,
  onSendMessage,
}: ChatPanelProps) {
  // 4. State management
  const [input, setInput] = useState("");

  // 5. Event handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage(input);
    setInput("");
  };

  // 6. Render
  return (
    <div className="flex flex-col h-full">
      {/* Component JSX */}
    </div>
  );
}
```

### Naming Conventions

Components must follow these naming rules:

```typescript
// ✅ DO: PascalCase for components
export default function ChatPanel() {}

// ✅ DO: Props interface with "Props" suffix
interface ChatPanelProps {
  messages: Message[];
}

// ✅ DO: Descriptive event handler names
const handleSendMessage = () => {};
const handleInputChange = (e) => {};

// ❌ DON'T: camelCase for components
export default function chatPanel() {}

// ❌ DON'T: Generic prop names
interface Props {
  data: any;
}

// ❌ DON'T: Abbreviated names
const onSend = () => {};
const handleMsg = () => {};
```

---

## Component Patterns

### Props Interface Pattern

Every component must have typed props:

```typescript
// ✅ DO: Define props interface before component
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Button({
  label,
  onClick,
  disabled = false,
  size = "md",
}: ButtonProps) {
  return <button>{label}</button>;
}

// ❌ DON'T: Use any or untyped props
export default function Button(props: any) {}

// ❌ DON'T: Props not in interface
interface ButtonProps {
  label: string;
}
export default function Button({ label, disabled }: ButtonProps) {
  // TypeScript error - 'disabled' not in interface!
}
```

### State Management Pattern

Use `useState` for component-local state:

```typescript
// ✅ DO: Type state values
const [count, setCount] = useState<number>(0);
const [name, setName] = useState<string>("");
const [isOpen, setIsOpen] = useState<boolean>(false);

// ✅ DO: Use refs for DOM access
const inputRef = useRef<HTMLInputElement>(null);

// ✅ DO: Extract related state to variables
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// ❌ DON'T: Use state for everything
const [data, setData] = useState<any>({});

// ❌ DON'T: Store function results in state if it's derived
// Bad:
const [uppercase, setUppercase] = useState("");
useEffect(() => setUppercase(name.toUpperCase()), [name]);
// Good:
const uppercase = name.toUpperCase();
```

### Event Handler Pattern

Event handlers should be descriptive and properly typed:

```typescript
// ✅ DO: Type event handlers
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setInput(e.target.value);
};

const handleFormSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Handle submission
};

const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSubmit(e as any);
  }
};

// ❌ DON'T: Untyped event handlers
const handleChange = (e) => {}; // Missing type

// ❌ DON'T: Inline complex logic
<button onClick={() => {
  setIsOpen(!isOpen);
  updateDatabase();
  fetchNewData();
}}>
```

### Loading & Error States Pattern

Every async operation needs loading + error handling:

```typescript
// ✅ DO: Explicit loading and error states
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  setIsLoading(true);
  setError(null);

  try {
    const result = await fetchData();
    setData(result);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setIsLoading(false);
  }
};

// ✅ DO: Show loading state in UI
{isLoading && <LoadingSpinner />}

// ✅ DO: Show error state with message
{error && <ErrorMessage message={error} />}

// ❌ DON'T: Silent failures
const handleAction = async () => {
  const result = await fetchData();
  setData(result);
};

// ❌ DON'T: Generic error messages
setError("Error"); // User doesn't know what went wrong
```

### Tailwind Styling Pattern

All styling uses Tailwind classes (no inline styles):

```typescript
// ✅ DO: Use Tailwind utility classes
<div className="flex flex-col h-full bg-slate-800 text-white">
  <button className="bg-mint-600 hover:bg-mint-700 px-4 py-2 rounded">
    Click me
  </button>
</div>

// ✅ DO: Use responsive prefixes
<div className="w-full md:w-1/2 lg:w-1/3">

// ✅ DO: Use dark mode classes (if dark theme is primary)
<div className="bg-white dark:bg-slate-800">

// ✅ DO: Use mint color palette from tailwind.config.ts
<div className="bg-mint-500 text-mint-900">

// ❌ DON'T: Hardcoded colors
<div style={{ backgroundColor: "#22c55e" }}>

// ❌ DON'T: Inline styles
<div style={{ padding: "16px", marginBottom: "8px" }}>
// Instead: className="p-4 mb-2"

// ❌ DON'T: Generate classes dynamically at runtime
const bgColor = darkMode ? "bg-slate-800" : "bg-white"; // Won't work
// Use conditional className instead:
className={darkMode ? "bg-slate-800" : "bg-white"}
```

### Conditional Rendering Pattern

Use clear patterns for conditional rendering:

```typescript
// ✅ DO: Simple ternary for 2 states
{isLoading ? <LoadingSpinner /> : <Content />}

// ✅ DO: Logical AND for single state
{isError && <ErrorMessage />}

// ✅ DO: Multiple conditions clearly
{isLoading && <LoadingSpinner />}
{!isLoading && isError && <ErrorMessage />}
{!isLoading && !isError && <Content />}

// ✅ DO: Extract to variable for readability
const showSkeleton = !data && isLoading;
return showSkeleton ? <Skeleton /> : <DataDisplay />;

// ❌ DON'T: Complex nested ternaries
{isLoading ? <Spinner /> : error ? <Error /> : data ? <Content /> : <Empty />}

// ❌ DON'T: Conditional className (at runtime)
const className = active ? "active-class" : "inactive-class"; // Bad
// Use conditional in className:
className={active ? "bg-blue-500" : "bg-gray-500"}
```

---

## Key Components

### ChatPanel

**File**: `components/ChatPanel.tsx`

Displays chat messages and input field.

**Props**:
```typescript
interface ChatPanelProps {
  messages: Array<{ role: string; content: string }>;
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}
```

**Key Features**:
- Auto-scrolls to latest message via `messagesEndRef`
- Message history display with user/assistant differentiation
- Auto-resizing textarea input
- Suggestions shown in empty state
- Loading indicator (animated dots)
- Error toast on send failure (via Sonner)

**Patterns Used**:
- `useState` for input value and textarea height
- `useRef` for DOM access (messagesEndRef, inputRef)
- Event handlers for form submission and keyboard events
- Conditional rendering for empty state vs messages

### PreviewPanel

**File**: `components/PreviewPanel.tsx`

Displays generated component preview in iframe.

**Props**:
```typescript
interface PreviewPanelProps {
  demoUrl: string;
}
```

**Key Features**:
- Iframe sandbox with restricted permissions
- Loading state while preview loads
- Error handling for failed previews
- Empty state before any generation
- OnLoad/OnError handlers for iframe

**Patterns Used**:
- `useState` for loading and error state
- `useEffect` to track URL changes
- Iframe with proper security sandbox attributes

---

## Styling Guide

### Color Palette

Use the mint theme defined in `tailwind.config.ts`:

```typescript
// Mint color scale
mint-50   // Lightest (almost white)
mint-100  // Very light
mint-200  // Light
mint-300  // Light-medium
mint-400  // Medium-light
mint-500  // Primary mint
mint-600  // Primary dark
mint-700  // Dark
mint-800  // Darker
mint-900  // Darkest

// Also available: slate for backgrounds/text
slate-50, slate-100, ..., slate-900
```

### Example Usage

```typescript
// ✅ Primary button (mint)
<button className="bg-mint-600 hover:bg-mint-700 text-white">
  Send
</button>

// ✅ Chat message from user (mint background)
<div className="bg-mint-600 text-white px-4 py-3 rounded-lg">
  {content}
</div>

// ✅ Chat message from assistant (slate background)
<div className="bg-slate-700 text-slate-100 px-4 py-3 rounded-lg">
  {content}
</div>

// ✅ Loading indicator (with animation)
<div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />

// ✅ Page background (dark gradient)
<main className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
```

---

## Component Composition

### Parent-Child Data Flow

```
app/page.tsx (page component)
├── state: messages, chatId, demoUrl, isLoading
├── handlers: handleSendMessage
│
├─ ChatPanel (controlled component)
│  ├── props: messages, isLoading, onSendMessage
│  └── local state: input, textarea height
│
└─ PreviewPanel (controlled component)
   ├── props: demoUrl
   └── local state: isLoading, error
```

### Best Practices

```typescript
// ✅ DO: Pass data and callbacks as props
<ChatPanel
  messages={messages}
  isLoading={isLoading}
  onSendMessage={handleSendMessage}
/>

// ✅ DO: Let parent manage shared state
// page.tsx manages: messages, chatId, demoUrl, isLoading
// ChatPanel manages: input, textarea height (local only)

// ❌ DON'T: Pass entire object if child only needs 1 field
<ChatPanel messages={messages} /> // Good
<ChatPanel data={entireState} /> // Bad

// ❌ DON'T: Props drilling (multiple levels)
// If component 5 levels deep needs data, lift state to common parent
```

---

## Quick Search Commands

### Find Components

```bash
# List all components
ls -1 components/*.tsx

# Find component definition
rg -n "^export default function" components

# Find specific component usage
rg -n "<ChatPanel" app

# Find component props
rg -n "interface.*Props" components
```

### Type Checking

```bash
# Type check all components
bun typecheck components

# Find untyped variables
rg -n ": any" components

# Find missing prop types
rg -n "props\)" components | grep -v "Props"
```

### Styling Analysis

```bash
# Check for inline styles (should be none)
rg -n "style=" components

# Check Tailwind usage
rg -n "className=" components | wc -l

# Find hardcoded colors (should only be mint/slate from tailwind)
rg -n "#[0-9a-f]{6}" components
```

---

## Common Patterns in Mint AI

### Chat Message Rendering

See `ChatPanel.tsx` for pattern:

```typescript
{messages.map((msg, idx) => (
  <div
    key={idx}
    className={`flex ${
      msg.role === "user" ? "justify-end" : "justify-start"
    }`}
  >
    <div
      className={`max-w-xs px-4 py-3 rounded-lg ${
        msg.role === "user"
          ? "bg-mint-600 text-white"
          : "bg-slate-700 text-slate-100"
      }`}
    >
      {msg.content}
    </div>
  </div>
))}
```

### Auto-Resizing Textarea

See `ChatPanel.tsx` for pattern:

```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setInput(e.target.value);
  // Auto-resize
  if (inputRef.current) {
    inputRef.current.style.height = "auto";
    inputRef.current.style.height = Math.min(
      inputRef.current.scrollHeight,
      150
    ) + "px";
  }
};
```

### Loading State Indicator

See `ChatPanel.tsx` for pattern:

```typescript
{isLoading && (
  <div className="bg-slate-700 text-slate-100 px-4 py-3 rounded-lg">
    <div className="flex gap-2">
      <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
      <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.1s]" />
      <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
    </div>
  </div>
)}
```

### Iframe Preview

See `PreviewPanel.tsx` for pattern:

```typescript
<iframe
  src={demoUrl}
  className="w-full h-full"
  onLoad={handleIframeLoad}
  onError={handleIframeError}
  title="Generated Component Preview"
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
/>
```

---

## Common Gotchas

### Key Prop in Lists

Always use stable, unique keys:

```typescript
// ✅ DO: Use unique ID if available
items.map((item) => <ListItem key={item.id} {...item} />)

// ✅ DO: Use index as last resort (if list is stable)
messages.map((msg, idx) => <Message key={idx} {...msg} />)

// ❌ DON'T: Use random/unstable keys
messages.map((msg) => <Message key={Math.random()} {...msg} />)

// ❌ DON'T: No key at all
messages.map((msg) => <Message {...msg} />)
```

### Event Handler Closures

Event handlers can capture state:

```typescript
// ✅ DO: Latest state in handler
const [count, setCount] = useState(0);
const handleClick = () => {
  setCount(count + 1); // Captures current count
};

// ⚠️ GOTCHA: Dependencies in useEffect
useEffect(() => {
  const timer = setTimeout(() => {
    console.log(count); // Captures count at effect creation time
  }, 1000);
}, [count]); // Must include count in deps
```

### Tailwind Dark Mode

Currently using slate colors for dark theme (no light mode):

```typescript
// ✅ All components assume dark background
className="bg-slate-900 text-white"

// If light mode added later:
className="bg-white dark:bg-slate-900 text-black dark:text-white"
```

### Memo Optimization (not needed yet)

React 19 improved performance, no need to memoize components prematurely:

```typescript
// ❌ DON'T: Premature optimization
const MemoizedChatPanel = memo(ChatPanel);

// ✅ DO: Let React handle it, optimize only if performance issue
export default function ChatPanel({ ... }) {}
```

---

## Pre-PR Checklist

Before submitting component changes:

- [ ] TypeScript strict mode passes: `bun typecheck components`
- [ ] All props have typed interfaces
- [ ] All event handlers are properly typed
- [ ] Loading and error states exist for async operations
- [ ] No hardcoded colors (use mint/slate from Tailwind)
- [ ] No inline styles (use className only)
- [ ] Components tested in dev server: `bun run dev`
- [ ] No console errors or warnings
- [ ] Component follows naming conventions
- [ ] Props are minimal and focused
- [ ] Responsive classes used where appropriate (`sm:`, `md:`, etc.)

---

## Resources

- **React 19 Docs**: https://react.dev
- **React Hooks**: https://react.dev/reference/react/hooks
- **TypeScript React**: https://www.typescriptlang.org/docs/handbook/react.html
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev
- **Sonner Toast**: https://sonner.emilkowal.ski
