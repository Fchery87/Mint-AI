# PromptInput Component

A fully-featured, composable prompt input system inspired by AI SDK's prompt-input, but built completely independent of any SDK.

## Features

- **Auto-resizing textarea** - Expands as you type
- **File attachments** - Drag & drop or click to add files with preview
- **Action menu** - Extensible menu for additional tools
- **Speech-to-text** - Browser-based voice input (Chrome/Edge)
- **Submit with status** - Visual feedback for ready/submitting/streaming/error states
- **Fully composable** - Build your own layout with individual components
- **TypeScript** - Full type safety

## Quick Start

```tsx
import {
  PromptInputProvider,
  PromptInput,
  PromptInputAttachments,
  PromptInputAttachmentCard,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputSpeechButton,
  PromptInputMessage,
} from "@/components/prompt-input";

function MyChat() {
  const handleSubmit = (message: PromptInputMessage) => {
    console.log("Text:", message.text);
    console.log("Files:", message.files);
    // Send to your API
  };

  return (
    <PromptInputProvider onSubmit={handleSubmit}>
      <PromptInput globalDrop multiple>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachmentCard data={attachment} />}
        </PromptInputAttachments>
        <PromptInputBody>
          <PromptInputTextarea placeholder="Type a message..." />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <PromptInputSpeechButton />
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </PromptInputProvider>
  );
}
```

## Component API

### PromptInputProvider

Context provider that manages state. Must wrap all PromptInput components.

**Props:**
- `onSubmit?: (message: PromptInputMessage) => void` - Called when user submits
- `children: React.ReactNode`

### PromptInput

Root container that handles drag & drop.

**Props:**
- `globalDrop?: boolean` - Enable drop anywhere on page (default: false)
- `multiple?: boolean` - Allow multiple file uploads (default: false)
- `children: React.ReactNode`

### PromptInputAttachments

Renders attachment list. Only visible when there are attachments.

**Props:**
- `children: (attachment: PromptInputAttachment) => React.ReactNode` - Render function for each attachment

### PromptInputAttachmentCard

Default attachment card with preview and remove button.

**Props:**
- `data: PromptInputAttachment` - Attachment data
- `className?: string`

### PromptInputTextarea

Auto-resizing textarea with Enter to submit (Shift+Enter for new line).

**Props:**
- `placeholder?: string`
- `maxHeight?: number` - Max height in pixels (default: 150)
- `className?: string`

### PromptInputSubmit

Submit button with loading state.

**Props:**
- `className?: string`

### PromptInputActionMenu

Dropdown menu for additional actions.

**Components:**
- `PromptInputActionMenuTrigger` - Button to open menu
- `PromptInputActionMenuContent` - Menu dropdown

### PromptInputActionAddAttachments

File picker button for attachments.

**Props:**
- `accept?: string` - File types (e.g., "image/*")
- `multiple?: boolean` - Allow multiple files (default: true)

### PromptInputSpeechButton

Speech-to-text button (requires browser support).

**Props:**
- `textareaRef?: React.RefObject<HTMLTextAreaElement | null>` - Optional ref for auto-resize
- `className?: string`

## Hooks

### usePromptInputController

Access the prompt input controller from anywhere within the provider.

```tsx
const controller = usePromptInputController();

// Available methods:
controller.textInput.setValue("Hello");
controller.textInput.clear();
controller.attachments.add([file1, file2]);
controller.attachments.remove(attachmentId);
controller.attachments.clear();
controller.submit();
controller.setStatus("streaming");
```

## Types

```tsx
interface PromptInputMessage {
  text: string;
  files?: File[];
}

interface PromptInputAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string; // For images
}
```

## Advanced Usage

### Custom Submit Button

```tsx
import { usePromptInputController } from "@/components/prompt-input";

function CustomSubmit() {
  const controller = usePromptInputController();

  return (
    <button
      onClick={controller.submit}
      disabled={controller.status === "submitting"}
    >
      {controller.status === "submitting" ? "Sending..." : "Send"}
    </button>
  );
}
```

### Programmatic Control

```tsx
function HeaderControls() {
  const controller = usePromptInputController();

  return (
    <div>
      <button onClick={() => controller.textInput.clear()}>
        Clear Input
      </button>
      <button onClick={() => controller.attachments.clear()}>
        Clear Attachments
      </button>
    </div>
  );
}
```

## Styling

All components accept `className` prop for Tailwind styling. The default styles use the mint color palette from your theme.

```tsx
<PromptInput className="rounded-2xl border-2 border-mint-500">
  {/* ... */}
</PromptInput>
```

## Notes

- Speech-to-text requires Chrome/Edge and HTTPS in production
- File previews are automatically created for images
- Drag & drop works with `globalDrop` prop
- Submit is disabled when input is empty and no attachments
- Status automatically managed by provider
