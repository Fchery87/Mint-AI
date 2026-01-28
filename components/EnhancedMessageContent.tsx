'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { InteractiveCodeBlock } from '@/components/InteractiveCodeBlock';
import { ArtifactCard } from '@/components/ArtifactCard';
import { parseContentSegments } from '@/lib/content-parser';
import ReactMarkdown from 'react-markdown';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface EnhancedMessageContentProps {
  content: string;
  className?: string;
  onRunCode?: (code: string, language: string) => void;
  onDiffCode?: (before: string, after: string) => void;
  onApplyCode?: (code: string, filename?: string) => void;
  onApplyArtifact?: (files: Array<{ path: string; code: string }>) => void;
  onCopyCode?: (code: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Text Segment Renderer
// ─────────────────────────────────────────────────────────────────────────────

function TextSegment({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">
                {children}
              </code>
            ) : (
              <code className={cn('text-sm font-mono', className)}>{children}</code>
            );
          },
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function EnhancedMessageContent({
  content,
  className,
  onRunCode,
  onDiffCode,
  onApplyCode,
  onApplyArtifact,
  onCopyCode,
}: EnhancedMessageContentProps) {
  const segments = useMemo(() => {
    return parseContentSegments(content);
  }, [content]);

  const handleRunCode = (code: string, language: string) => {
    onRunCode?.(code, language);
  };

  const handleDiffCode = (before: string, after: string) => {
    onDiffCode?.(before, after);
  };

  const handleApplyCode = (code: string, filename?: string) => {
    onApplyCode?.(code, filename);
  };

  const handleCopyCode = (code: string) => {
    onCopyCode?.(code);
  };

  const handleApplyArtifact = (files: Array<{ path: string; code: string; language: string }>) => {
    const simplifiedFiles = files.map((f) => ({ path: f.path, code: f.code }));
    onApplyArtifact?.(simplifiedFiles);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {segments.map((segment, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          {segment.type === 'text' && segment.content && (
            <TextSegment content={segment.content} />
          )}

          {segment.type === 'code' && segment.codeBlock && (
            <InteractiveCodeBlock
              code={segment.codeBlock.code}
              language={segment.codeBlock.language}
              filename={segment.codeBlock.filename}
              onRun={() => handleRunCode(segment.codeBlock!.code, segment.codeBlock!.language)}
              onDiff={(before) => handleDiffCode(before, segment.codeBlock!.code)}
              onApply={(code) => handleApplyCode(code, segment.codeBlock!.filename)}
              maxHeight={400}
            />
          )}

          {segment.type === 'artifact' && segment.artifact && (
            <ArtifactCard
              id={segment.artifact.id}
              title={segment.artifact.title}
              description={segment.artifact.description}
              files={segment.artifact.files}
              previewUrl={segment.artifact.previewUrl}
              onEdit={(file) => handleApplyCode(file.code, file.path)}
              onApply={handleApplyArtifact}
              onCopy={handleCopyCode}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default EnhancedMessageContent;
