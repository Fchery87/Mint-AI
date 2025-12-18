# ResizablePanels Component

A draggable divider component that allows users to resize two panels horizontally.

## Features

- **Drag to resize** - Smooth dragging with visual feedback
- **Constraints** - Min/max width limits to prevent extreme sizes
- **Persistence** - Saves width preference to localStorage
- **Visual indicator** - Grip icon appears on hover/drag
- **Smooth UX** - Prevents text selection during drag
- **TypeScript** - Full type safety

## Usage

```tsx
import { ResizablePanels } from "@/components/ResizablePanels";

function MyLayout() {
  return (
    <ResizablePanels
      defaultLeftWidth={400}
      minLeftWidth={300}
      maxLeftWidth={800}
      storageKey="my-layout-width"
      leftPanel={<div>Left content</div>}
      rightPanel={<div>Right content</div>}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `leftPanel` | `React.ReactNode` | Required | Content for the left panel |
| `rightPanel` | `React.ReactNode` | Required | Content for the right panel |
| `defaultLeftWidth` | `number` | `400` | Initial width of left panel in pixels |
| `minLeftWidth` | `number` | `300` | Minimum width of left panel in pixels |
| `maxLeftWidth` | `number` | `800` | Maximum width of left panel in pixels |
| `storageKey` | `string` | `"resizable-panels-width"` | localStorage key for saving width |
| `className` | `string` | `undefined` | Additional CSS classes for container |

## How It Works

1. **Initial render**: Loads saved width from localStorage or uses `defaultLeftWidth`
2. **Drag start**: Click and hold the divider to start dragging
3. **Dragging**: Move mouse left/right to resize (constrained by min/max)
4. **Drag end**: Releases mouse, saves new width to localStorage
5. **Next visit**: Restored to saved width automatically

## Visual Feedback

- **Idle**: Thin border line between panels
- **Hover**: Border highlights, grip icon appears
- **Dragging**: Border turns primary color, grip icon stays visible
- **Cursor**: Changes to `col-resize` during drag

## Implementation Details

### State Management
```tsx
const [leftWidth, setLeftWidth] = useState(() => {
  // Load from localStorage or use default
  const saved = localStorage.getItem(storageKey);
  return saved ? parseInt(saved) : defaultLeftWidth;
});
```

### Drag Handling
- Uses `onMouseDown` to start drag
- Adds global `mousemove` and `mouseup` listeners during drag
- Prevents text selection by setting `user-select: none` on body
- Cleans up event listeners when drag ends

### Width Constraints
```tsx
const constrainedWidth = Math.min(
  Math.max(newWidth, minLeftWidth),
  maxLeftWidth
);
```

## Accessibility

- Visual grip indicator for discoverability
- Changes cursor to `col-resize` on hover
- Keyboard navigation not implemented (drag-only)

## Browser Compatibility

- ✅ Chrome/Edge/Safari/Firefox - Full support
- ✅ localStorage support required for persistence
- ✅ Mouse events (no touch support currently)

## Future Enhancements

- [ ] Touch support for mobile/tablet
- [ ] Keyboard shortcuts (e.g., Cmd+[ to shrink left panel)
- [ ] Double-click to reset to default width
- [ ] Snap points for common widths
- [ ] Vertical resizing mode
- [ ] Animation when resetting to default

## Example: Mint AI

In Mint AI, the ResizablePanels component separates:
- **Left panel**: Chat interface (300-800px)
- **Right panel**: Code preview (flexible)

The width preference persists across sessions, so users don't need to resize every time they visit.
