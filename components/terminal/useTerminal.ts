'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface TerminalLine {
  id: string;
  content: string;
  type: 'input' | 'output' | 'success' | 'error' | 'info' | 'command';
  timestamp: number;
}

export interface TerminalHistory {
  commands: string[];
  currentIndex: number;
}

export function useTerminal(initialLines: TerminalLine[] = []) {
  const [lines, setLines] = useState<TerminalLine[]>(initialLines);
  const [history, setHistory] = useState<TerminalHistory>({
    commands: [],
    currentIndex: -1,
  });
  const linesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    linesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const addLine = useCallback((content: string, type: TerminalLine['type'] = 'output') => {
    const line: TerminalLine = {
      id: `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      type,
      timestamp: Date.now(),
    };
    setLines(prev => [...prev, line]);
    return line.id;
  }, []);

  const addCommand = useCallback((command: string) => {
    const lineId = addLine(command, 'command');
    setHistory(prev => ({
      commands: [...prev.commands, command],
      currentIndex: prev.commands.length,
    }));
    return lineId;
  }, [addLine]);

  const addOutput = useCallback((content: string) => {
    return addLine(content, 'output');
  }, [addLine]);

  const addError = useCallback((error: string) => {
    return addLine(error, 'error');
  }, [addLine]);

  const addSuccess = useCallback((message: string) => {
    return addLine(message, 'success');
  }, [addLine]);

  const addInfo = useCallback((info: string) => {
    return addLine(info, 'info');
  }, [addLine]);

  const clear = useCallback(() => {
    setLines([]);
  }, []);

  const getHistory = useCallback((direction: 'up' | 'down') => {
    setHistory(prev => {
      let newIndex = prev.currentIndex;

      if (direction === 'up') {
        newIndex = prev.currentIndex <= 0 ? 0 : prev.currentIndex - 1;
      } else {
        newIndex = prev.currentIndex >= prev.commands.length - 1
          ? prev.commands.length - 1
          : prev.currentIndex + 1;
      }

      return {
        ...prev,
        currentIndex: newIndex,
      };
    });
  }, []);

  const getCurrentHistoryCommand = useCallback(() => {
    if (history.currentIndex >= 0 && history.currentIndex < history.commands.length) {
      return history.commands[history.currentIndex];
    }
    return '';
  }, [history]);

  const pushToHistory = useCallback((command: string) => {
    setHistory(prev => ({
      commands: [...prev.commands.filter(cmd => cmd !== command), command],
      currentIndex: prev.commands.length,
    }));
  }, []);

  const removeLastHistoryCommand = useCallback(() => {
    setHistory(prev => ({
      commands: prev.commands.slice(0, -1),
      currentIndex: Math.min(prev.currentIndex, prev.commands.length - 2),
    }));
  }, []);

  return {
    lines,
    setLines,
    history,
    linesEndRef,
    addLine,
    addCommand,
    addOutput,
    addError,
    addSuccess,
    addInfo,
    clear,
    getHistory,
    getCurrentHistoryCommand,
    pushToHistory,
    removeLastHistoryCommand,
  };
}

export default useTerminal;
