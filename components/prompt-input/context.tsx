"use client";

import { createContext, useContext, useCallback, useState, useRef } from "react";

export interface PromptInputAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

export interface PromptInputMessage {
  text: string;
  files?: File[];
}

export interface PromptInputController {
  textInput: {
    value: string;
    setValue: (value: string) => void;
    clear: () => void;
    setInput: (value: string) => void;
  };
  attachments: {
    items: PromptInputAttachment[];
    add: (files: File[]) => void;
    remove: (id: string) => void;
    clear: () => void;
  };
  submit: () => void;
  status: "ready" | "submitting" | "streaming" | "error";
  setStatus: (status: "ready" | "submitting" | "streaming" | "error") => void;
}

interface PromptInputContextValue {
  controller: PromptInputController;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

const PromptInputContext = createContext<PromptInputContextValue | null>(null);

export const usePromptInputController = (): PromptInputController => {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error("usePromptInputController must be used within PromptInputProvider");
  }
  return context.controller;
};

export const usePromptInputTextarea = () => {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error("usePromptInputTextarea must be used within PromptInputProvider");
  }
  return context.textareaRef;
};

interface PromptInputProviderProps {
  children: React.ReactNode;
  onSubmit?: (message: PromptInputMessage) => void;
}

export const PromptInputProvider = ({ children, onSubmit }: PromptInputProviderProps) => {
  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<PromptInputAttachment[]>([]);
  const [status, setStatus] = useState<"ready" | "submitting" | "streaming" | "error">("ready");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addAttachments = useCallback((files: File[]) => {
    const newAttachments: PromptInputAttachment[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    attachments.forEach((a) => {
      if (a.preview) {
        URL.revokeObjectURL(a.preview);
      }
    });
    setAttachments([]);
  }, [attachments]);

  const clearInput = useCallback(() => {
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, []);

  const submit = useCallback(() => {
    const hasText = Boolean(inputValue.trim());
    const hasAttachments = attachments.length > 0;

    if (!(hasText || hasAttachments) || status === "submitting" || status === "streaming") {
      return;
    }

    const message: PromptInputMessage = {
      text: inputValue,
      files: attachments.map((a) => a.file),
    };

    onSubmit?.(message);
    clearInput();
    clearAttachments();
  }, [inputValue, attachments, status, onSubmit, clearInput, clearAttachments]);

  const controller: PromptInputController = {
    textInput: {
      value: inputValue,
      setValue: setInputValue,
      clear: clearInput,
      setInput: setInputValue,
    },
    attachments: {
      items: attachments,
      add: addAttachments,
      remove: removeAttachment,
      clear: clearAttachments,
    },
    submit,
    status,
    setStatus,
  };

  return (
    <PromptInputContext.Provider value={{ controller, textareaRef }}>
      {children}
    </PromptInputContext.Provider>
  );
};
