"use client";

import { useState, useEffect } from 'react';
import { Play, Loader2, Terminal, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  executePython, 
  getPyodideStatus,
  type PythonExecutionResult 
} from '@/lib/execution/pyodide-executor';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';

interface PyodideExecutorProps {
  code: string;
  className?: string;
  autoRun?: boolean;
}

export function PyodideExecutor({ code, className, autoRun = false }: PyodideExecutorProps) {
  const { theme } = useTheme();
  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<PythonExecutionResult | null>(null);
  const [pyodideStatus, setPyodideStatus] = useState(getPyodideStatus());
  const usesPygame = code.includes('import pygame') || code.includes('pygame.');

  useEffect(() => {
    if (autoRun && code && status === 'idle') {
      handleRun();
    }
  }, [autoRun, code]);

  const handleRun = async () => {
    setStatus('loading');
    setPyodideStatus('loading');
    
    try {
      const executionResult = await executePython(code);
      setResult(executionResult);
      setStatus(executionResult.error ? 'error' : 'done');
      setPyodideStatus('loaded');
    } catch (error) {
      setResult({
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
      });
      setStatus('error');
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {usesPygame && (
        <div className="px-4 py-2 text-xs border-b border-border/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
          Pyodide can’t run `pygame` in the browser. Generate a browser-based version (HTML canvas/JS) or a local pygame script.
        </div>
      )}
      {/* Code Display */}
      <div className="flex-1 overflow-auto border-b border-border/40">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-muted/50 backdrop-blur border-b border-border/40">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Terminal size={14} />
            <span>Python Code</span>
          </div>
          <button
            onClick={handleRun}
            disabled={status === 'loading' || status === 'running'}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {status === 'loading' || status === 'running' ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {pyodideStatus === 'loading' ? 'Loading Python...' : 'Running...'}
              </>
            ) : (
              <>
                <Play size={14} />
                Run Code
              </>
            )}
          </button>
        </div>
        
        <SyntaxHighlighter
          language="python"
          style={theme === 'dark' ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            background: 'transparent',
            fontSize: '13px',
            lineHeight: '1.6',
          }}
          showLineNumbers
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {/* Output Panel */}
      {result && (
        <div className="h-64 flex flex-col bg-muted/30">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Terminal size={14} className={status === 'error' ? 'text-destructive' : 'text-primary'} />
              <span className={status === 'error' ? 'text-destructive' : 'text-foreground'}>
                {status === 'error' ? 'Error' : 'Output'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={12} />
              <span>{result.executionTime.toFixed(0)}ms</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            <pre className={cn(
              "font-mono text-xs leading-relaxed whitespace-pre-wrap",
              status === 'error' ? 'text-destructive' : 'text-foreground'
            )}>
              {result.error || result.output}
            </pre>
          </div>
        </div>
      )}

      {/* First Run Message */}
      {!result && status === 'idle' && (
        <div className="h-64 flex items-center justify-center bg-muted/30 border-t border-border/40">
          <div className="text-center text-muted-foreground">
            <Terminal size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Click "Run Code" to execute</p>
            {pyodideStatus === 'not-loaded' && (
              <p className="text-xs mt-1 opacity-60">First run will load Python (~6MB)</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
