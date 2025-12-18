"use client";

import { forwardRef, useCallback, useEffect, useRef } from "react";
import { usePromptInputController, usePromptInputTextarea, PromptInputAttachment as AttachmentType } from "./context";
import { cn } from "@/lib/utils";
import { Send, Loader2, Paperclip, X, FileIcon, ImageIcon } from "lucide-react";

// ============================================================================
// PromptInput Root - Main wrapper that handles drop zones
// ============================================================================
interface PromptInputProps {
  children: React.ReactNode;
  className?: string;
  globalDrop?: boolean;
  multiple?: boolean;
}

export const PromptInput = ({ children, className, globalDrop = false, multiple = false }: PromptInputProps) => {
  const controller = usePromptInputController();
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      controller.attachments.add(multiple ? files : [files[0]]);
    }
  }, [controller.attachments, multiple]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useEffect(() => {
    const element = globalDrop ? document.body : dropRef.current;
    if (!element) return;

    element.addEventListener("drop", handleDrop);
    element.addEventListener("dragover", handleDragOver);

    return () => {
      element.removeEventListener("drop", handleDrop);
      element.removeEventListener("dragover", handleDragOver);
    };
  }, [globalDrop, handleDrop, handleDragOver]);

  return (
    <div ref={dropRef} className={cn("w-full", className)}>
      {children}
    </div>
  );
};

// ============================================================================
// PromptInputAttachments - Displays list of attachments
// ============================================================================
interface PromptInputAttachmentsProps {
  children: (attachment: AttachmentType) => React.ReactNode;
  className?: string;
}

export const PromptInputAttachments = ({ children, className }: PromptInputAttachmentsProps) => {
  const controller = usePromptInputController();

  if (controller.attachments.items.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2 p-2", className)}>
      {controller.attachments.items.map((attachment) => children(attachment))}
    </div>
  );
};

// ============================================================================
// PromptInputAttachmentCard - Individual attachment card
// ============================================================================
interface PromptInputAttachmentCardProps {
  data: AttachmentType;
  className?: string;
}

export const PromptInputAttachmentCard = ({ data, className }: PromptInputAttachmentCardProps) => {
  const controller = usePromptInputController();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className={cn("group relative flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded bg-background">
        {data.preview ? (
          <img src={data.preview} alt={data.name} className="h-full w-full rounded object-cover" />
        ) : data.type.startsWith("image/") ? (
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FileIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="truncate font-medium">{data.name}</div>
        <div className="text-xs text-muted-foreground">{formatSize(data.size)}</div>
      </div>
      <button
        type="button"
        onClick={() => controller.attachments.remove(data.id)}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

// ============================================================================
// PromptInputBody - Container for textarea
// ============================================================================
interface PromptInputBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const PromptInputBody = ({ children, className }: PromptInputBodyProps) => {
  return <div className={cn("relative flex items-end", className)}>{children}</div>;
};

// ============================================================================
// PromptInputTextarea - Auto-resizing textarea
// ============================================================================
interface PromptInputTextareaProps {
  placeholder?: string;
  className?: string;
  maxHeight?: number;
}

export const PromptInputTextarea = forwardRef<HTMLTextAreaElement, PromptInputTextareaProps>(
  ({ placeholder = "Type a message...", className, maxHeight = 150 }, ref) => {
    const controller = usePromptInputController();
    const textareaRef = usePromptInputTextarea();
    const localRef = useRef<HTMLTextAreaElement>(null);

    // Merge refs
    useEffect(() => {
      const textarea = localRef.current;
      if (textarea && textareaRef) {
        (textareaRef as React.MutableRefObject<HTMLTextAreaElement>).current = textarea;
      }
    }, [textareaRef]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      controller.textInput.setValue(e.target.value);

      // Auto-resize
      const textarea = e.target;
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        controller.submit();
      }
    };

    return (
      <textarea
        ref={(node) => {
          localRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        value={controller.textInput.value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={controller.status === "submitting" || controller.status === "streaming"}
        rows={1}
        className={cn(
          "flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    );
  }
);

PromptInputTextarea.displayName = "PromptInputTextarea";

// ============================================================================
// PromptInputFooter - Container for tools and submit
// ============================================================================
interface PromptInputFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const PromptInputFooter = ({ children, className }: PromptInputFooterProps) => {
  return (
    <div className={cn("flex items-center justify-between gap-2 px-2 pb-2", className)}>
      {children}
    </div>
  );
};

// ============================================================================
// PromptInputTools - Container for action buttons
// ============================================================================
interface PromptInputToolsProps {
  children: React.ReactNode;
  className?: string;
}

export const PromptInputTools = ({ children, className }: PromptInputToolsProps) => {
  return <div className={cn("flex items-center gap-1", className)}>{children}</div>;
};

// ============================================================================
// PromptInputButton - Generic button for tools
// ============================================================================
interface PromptInputButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const PromptInputButton = ({ children, onClick, disabled, className }: PromptInputButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
};

// ============================================================================
// PromptInputSubmit - Submit button with status
// ============================================================================
interface PromptInputSubmitProps {
  className?: string;
}

export const PromptInputSubmit = ({ className }: PromptInputSubmitProps) => {
  const controller = usePromptInputController();

  const isDisabled =
    controller.status === "submitting" ||
    controller.status === "streaming" ||
    (!controller.textInput.value.trim() && controller.attachments.items.length === 0);

  const icon = controller.status === "submitting" || controller.status === "streaming"
    ? <Loader2 className="h-4 w-4 animate-spin" />
    : <Send className="h-4 w-4" />;

  return (
    <button
      type="button"
      onClick={controller.submit}
      disabled={isDisabled}
      className={cn(
        "flex items-center justify-center rounded-md p-2 transition-all",
        isDisabled
          ? "cursor-not-allowed bg-muted text-muted-foreground opacity-50"
          : "bg-primary text-primary-foreground shadow-sm hover:translate-y-[-1px] hover:shadow-md",
        className
      )}
    >
      {icon}
    </button>
  );
};

// ============================================================================
// PromptInputActionAddAttachments - File picker button
// ============================================================================
interface PromptInputActionAddAttachmentsProps {
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export const PromptInputActionAddAttachments = ({
  accept,
  multiple = true,
  className
}: PromptInputActionAddAttachmentsProps) => {
  const controller = usePromptInputController();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      controller.attachments.add(files);
    }
    // Reset input
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
          className
        )}
      >
        <Paperclip className="h-4 w-4" />
        <span>Add attachments</span>
      </button>
    </>
  );
};
