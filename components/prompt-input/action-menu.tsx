"use client";

import { useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";

// ============================================================================
// ActionMenu Context
// ============================================================================
interface ActionMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ActionMenuContext = createContext<ActionMenuContextValue | null>(null);

const useActionMenu = () => {
  const context = useContext(ActionMenuContext);
  if (!context) {
    throw new Error("ActionMenu components must be used within PromptInputActionMenu");
  }
  return context;
};

// ============================================================================
// PromptInputActionMenu - Root component
// ============================================================================
interface PromptInputActionMenuProps {
  children: React.ReactNode;
}

export const PromptInputActionMenu = ({ children }: PromptInputActionMenuProps) => {
  const [open, setOpen] = useState(false);

  return (
    <ActionMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </ActionMenuContext.Provider>
  );
};

// ============================================================================
// PromptInputActionMenuTrigger - Button to open menu
// ============================================================================
interface PromptInputActionMenuTriggerProps {
  className?: string;
}

export const PromptInputActionMenuTrigger = ({ className }: PromptInputActionMenuTriggerProps) => {
  const { open, setOpen } = useActionMenu();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex items-center justify-center rounded-md p-2 transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        open && "bg-accent text-accent-foreground",
        className
      )}
    >
      <MoreHorizontal className="h-4 w-4" />
    </button>
  );
};

// ============================================================================
// PromptInputActionMenuContent - Dropdown content
// ============================================================================
interface PromptInputActionMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}

export const PromptInputActionMenuContent = ({
  children,
  align = "start",
  className
}: PromptInputActionMenuContentProps) => {
  const { open, setOpen } = useActionMenu();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setOpen(false)}
      />
      {/* Menu */}
      <div
        className={cn(
          "absolute bottom-full z-50 mb-2 min-w-[200px] rounded-md border border-border bg-popover p-1 shadow-md",
          align === "end" && "right-0",
          align === "start" && "left-0",
          className
        )}
      >
        {children}
      </div>
    </>
  );
};
