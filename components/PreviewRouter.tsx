"use client";

import type { PreviewRouterProps } from '@/types/preview';
import { determinePreviewType, getMainFile } from '@/lib/preview-router';
import { HtmlPreview } from './HtmlPreview';
import { CodeViewer } from './CodeViewer';
import { FileCode, Download, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PreviewRouter({
  files,
  projectType,
  projectName = 'project',
  activePath,
  onSelectPath,
}: PreviewRouterProps) {
  const previewType = determinePreviewType(files);
  const mainFile = getMainFile(files);

  // Handle project mode
  if (projectType === 'project' || files.length > 1) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/30">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileCode className="w-4 h-4" />
            <span>{files.length} files</span>
          </div>
          <span className="text-xs text-muted-foreground">{projectName}</span>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <div className="text-center py-8">
              <Code2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                {projectType === 'project' 
                  ? 'Full project generated' 
                  : `${files.length} files generated`}
              </p>
            </div>
            
            {/* File list for project mode */}
            <div className="space-y-1">
              {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => onSelectPath?.(file.path)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm",
                    "hover:bg-muted/50 transition-colors",
                    activePath === file.path && "bg-muted"
                  )}
                >
                  <FileCode className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{file.path}</span>
                  <span className="text-xs text-muted-foreground/60">
                    {file.language}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single file mode - route to appropriate preview
  if (!mainFile) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No files to preview
      </div>
    );
  }

  switch (previewType) {
    case 'html':
      return <HtmlPreview code={mainFile.content} />;
    
    case 'css':
      return (
        <CodeViewer
          code={mainFile.content}
          language="css"
          path={mainFile.path}
        />
      );
    
    case 'javascript':
      return (
        <CodeViewer
          code={mainFile.content}
          language={mainFile.language}
          path={mainFile.path}
        />
      );
    
    case 'component':
      return (
        <CodeViewer
          code={mainFile.content}
          language={mainFile.language}
          path={mainFile.path}
        />
      );
    
    case 'python':
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <Download className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium mb-1">Python Script</p>
          <p className="text-xs text-muted-foreground">
            Python files cannot be previewed in browser.
            <br />Download or copy to run locally.
          </p>
        </div>
      );
    
    case 'code':
    case 'none':
    default:
      return (
        <CodeViewer
          code={mainFile.content}
          language={mainFile.language}
          path={mainFile.path}
        />
      );
  }
}
