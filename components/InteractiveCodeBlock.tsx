'use client';

import { useState } from 'react';
import { 
  Copy, 
  Check, 
  Play, 
  Diff, 
  Download, 
  Maximize2,
  Code,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveCodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  className?: string;
  onRun?: () => void;
  onDiff?: (before: string, after: string) => void;
  onApply?: (code: string) => void;
  showLineNumbers?: boolean;
  maxHeight?: number;
}

export function InteractiveCodeBlock({
  code,
  language,
  filename,
  className,
  onRun,
  onDiff,
  onApply,
  showLineNumbers = true,
  maxHeight = 400,
}: InteractiveCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `code.${getLanguageExtension(language)}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLanguageExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      typescript: 'ts',
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rust: 'rs',
      ruby: 'rb',
      php: 'php',
      swift: 'swift',
      kotlin: 'kt',
      css: 'css',
      html: 'html',
      json: 'json',
      markdown: 'md',
      yaml: 'yaml',
      sql: 'sql',
    };
    return extensions[language.toLowerCase()] || 'txt';
  };

  const lines = code.split('\n');
  const shouldTruncate = !isExpanded && lines.length > 20;

  return (
    <div 
      className={cn(
        'group relative rounded-lg border border-border/40 bg-zinc-950 dark:bg-zinc-950 overflow-hidden',
        isFullscreen && 'fixed inset-4 z-50 rounded-lg',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/50 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Code size={14} className="text-zinc-400" />
          {filename && (
            <span className="text-sm font-medium text-zinc-300">{filename}</span>
          )}
          {!filename && (
            <span className="text-xs text-zinc-500 uppercase">{language}</span>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          {onRun && (
            <button
              onClick={onRun}
              className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-green-400"
              title="Run code"
            >
              <Play size={14} />
            </button>
          )}
          
          {onDiff && (
            <button
              onClick={() => onDiff('', code)}
              className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-blue-400"
              title="Compare with current"
            >
              <Diff size={14} />
            </button>
          )}
          
          {onApply && (
            <button
              onClick={() => onApply(code)}
              className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-primary"
              title="Apply to workspace"
            >
              <ExternalLink size={14} />
            </button>
          )}
          
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
          
          <button
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            title="Download"
          >
            <Download size={14} />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            title="Toggle fullscreen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div 
        className={cn(
          'overflow-auto p-4',
          isFullscreen ? 'h-[calc(100%-60px)]' : 'relative'
        )}
        style={isFullscreen ? {} : { maxHeight: isExpanded ? maxHeight * 2 : maxHeight }}
      >
        <pre className="text-sm">
          <code className={cn('font-mono', getLanguageColor(language))}>
            {showLineNumbers ? (
              lines.map((line, i) => (
                <div key={i} className="table-row hover:bg-zinc-900/30">
                  <span className="table-cell text-zinc-600 text-right pr-4 select-none w-8">
                    {i + 1}
                  </span>
                  <span className="table-cell text-zinc-300">{line || ' '}</span>
                </div>
              ))
            ) : (
              code
            )}
          </code>
        </pre>
      </div>

      {/* Expand/Collapse Overlay */}
      {shouldTruncate && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950 to-transparent h-20 flex items-end justify-center pb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            {isExpanded ? 'Show less' : `Show ${lines.length - 20} more lines`}
          </button>
        </div>
      )}

      {/* Close Fullscreen Button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-3 right-3 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
        >
          <Maximize2 size={14} className="rotate-45" />
        </button>
      )}
    </div>
  );
}

function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    typescript: 'text-blue-400',
    javascript: 'text-yellow-400',
    python: 'text-green-400',
    java: 'text-orange-400',
    cpp: 'text-blue-300',
    c: 'text-blue-300',
    go: 'text-cyan-400',
    rust: 'text-orange-500',
    ruby: 'text-red-400',
    php: 'text-purple-400',
    swift: 'text-orange-400',
    kotlin: 'text-purple-500',
    css: 'text-blue-500',
    html: 'text-orange-500',
    json: 'text-yellow-500',
    markdown: 'text-zinc-400',
    yaml: 'text-pink-400',
    sql: 'text-blue-400',
  };
  return colors[language.toLowerCase()] || 'text-zinc-300';
}

export default InteractiveCodeBlock;
