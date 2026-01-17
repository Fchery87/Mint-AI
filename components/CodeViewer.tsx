"use client";

import { useCallback, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { Copy, Check, FileCode } from 'lucide-react';
import type { CodeViewerProps } from '@/types/preview';

const languageMap: Record<string, string> = {
  tsx: 'typescript',
  ts: 'typescript',
  jsx: 'javascript',
  js: 'javascript',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
};

export function CodeViewer({
  code,
  language,
  path,
  onCopy,
  showLineNumbers = true,
}: CodeViewerProps) {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [code, onCopy]);

  const highlightLanguage = languageMap[language.toLowerCase()] || 'plaintext';
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {path && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#f3f3f3] dark:bg-[#21252b] border-b border-border/20 dark:border-[#3e4451]/50">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground/70 truncate max-w-[200px]">
              {path}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors"
            style={{
              backgroundColor: isDark ? '#282c34' : '#f3f3f3',
              color: isDark ? '#abb2bf' : '#5c6370',
            }}
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Code */}
      <div className="flex-1 overflow-auto bg-[#fafafa] dark:bg-[#282c34]">
        <SyntaxHighlighter
          language={highlightLanguage}
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: '16px',
            background: 'transparent',
            fontSize: '13px',
            fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', Consolas, monospace",
          }}
          showLineNumbers={showLineNumbers}
          lineNumberStyle={{
            minWidth: '2em',
            paddingRight: '1em',
            color: isDark ? '#4b5563' : '#9ca3af',
            textAlign: 'right',
          }}
          wrapLines={true}
        >
          {code || '// No code available'}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
