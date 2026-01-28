/**
 * useTerminal Hook
 *
 * Manages terminal output lines and command execution.
 * Extracted from page.tsx to separate terminal concerns from UI.
 */

import { useState, useCallback } from "react";
import type { TerminalLine } from "@/types/terminal";

export interface UseTerminalReturn {
  lines: TerminalLine[];
  addLine: (content: string, type?: TerminalLine["type"]) => void;
  clearTerminal: () => void;
  executeCommand: (command: string) => Promise<void>;
}

// Simple built-in commands for the terminal
const BUILT_IN_COMMANDS: Record<string, (args: string[]) => string | string[]> = {
  echo: (args) => args.join(" ") || "",
  pwd: () => "/home/mint-ai",
  date: () => new Date().toString(),
  whoami: () => "mint-ai-user",
  ls: () => ["components/  hooks/  app/  public/  package.json  README.md"],
  help: () => "Available commands: clear, echo, pwd, date, whoami, ls, help",
};

export function useTerminal(): UseTerminalReturn {
  const [lines, setLines] = useState<TerminalLine[]>([]);

  const addLine = useCallback((content: string, type: TerminalLine["type"] = "output") => {
    const line: TerminalLine = {
      id: `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      type,
      timestamp: Date.now(),
    };
    setLines((prev) => [...prev, line]);
  }, []);

  const clearTerminal = useCallback(() => {
    setLines([]);
  }, []);

  const executeCommand = useCallback(async (command: string) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Add the command as input line
    addLine(`$ ${trimmedCommand}`, "input");

    // Simulate command execution delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const parts = trimmedCommand.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Handle built-in commands
    if (cmd === "clear") {
      clearTerminal();
      return;
    }

    const handler = BUILT_IN_COMMANDS[cmd];
    if (handler) {
      const result = handler(args);
      if (Array.isArray(result)) {
        result.forEach((line) => addLine(line, "output"));
      } else {
        addLine(result, "output");
      }
    } else {
      addLine(`Command not found: ${cmd}`, "error");
    }
  }, [addLine, clearTerminal]);

  return {
    lines,
    addLine,
    clearTerminal,
    executeCommand,
  };
}